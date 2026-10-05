import db from './db';
import type { NextApiRequest } from 'next';
import { deleteUpload } from './uploads';
import { getAuth, type AuthInfo } from './serverPermissions';
import { logAudit } from './logger';

/**
 * Centralised Recycle Bin (soft-delete) helper.
 *
 * Instead of adding `deleted_at` to every table, deleted records are
 * snapshotted as JSON into the single `recycle_bin` table and then
 * hard-deleted from their origin table. This keeps every existing
 * SELECT/list query untouched.
 *
 * Uploaded files (images, PDFs) are LEFT ON DISK while an item sits in
 * the bin (Cara A). Their relative paths are remembered in the payload so
 * they can be removed permanently when the bin entry is purged/restored.
 */

export type RecycleChild = {
  table: string;
  rows: any[];
};

export type RecycleInput = {
  moduleKey: string;        // permission key, e.g. 'app.procurement'
  moduleLabel?: string;     // friendly label, e.g. 'Procurement'
  table: string;            // origin table name
  id: number;               // origin record id
  label?: string;           // human-readable label for the bin list
  /** Child rows to snapshot + delete in the same unit (nested records). */
  children?: RecycleChild[];
  /** Relative upload paths (lib/uploads) to delete only on permanent purge. */
  files?: (string | null | undefined)[];
  auth?: AuthInfo | null;
  /** Request — used to record the audit/activity log for this deletion. */
  req?: NextApiRequest;
};

type Payload = {
  main: any;
  children: RecycleChild[];
  files: string[];
};

/**
 * Move a record (and optional children/files) into the Recycle Bin, then
 * hard-delete the originals. Runs in a transaction. Returns the bin entry id.
 *
 * NOTE: pass the FULL main row (already fetched) so we snapshot real data.
 */
export async function recycleDelete(input: RecycleInput): Promise<number> {
  const { moduleKey, moduleLabel, table, id, label, auth } = input;
  const children = input.children || [];
  const files = (input.files || []).filter((f): f is string => !!f);

  // Fetch the main row to snapshot.
  const main = await db(table).where({ id }).first();
  if (!main) throw new Error('Record not found.');

  const payload: Payload = { main, children, files };

  const binId = await db.transaction(async (trx) => {
    const [insertedId] = await trx('recycle_bin').insert({
      module_key: moduleKey,
      module_label: moduleLabel || null,
      source_table: table,
      record_id: id,
      label: label || `#${id}`,
      payload: JSON.stringify(payload),
      file_count: files.length,
      deleted_by: auth?.userId ?? null,
    });

    // Delete children first (FK-safe), then the main row.
    for (const child of children) {
      // Each child set is keyed by whatever the caller already filtered on;
      // we delete by the ids present in the snapshot to stay precise.
      const ids = child.rows.map((r: any) => r.id).filter((v: any) => v != null);
      if (ids.length) await trx(child.table).whereIn('id', ids).delete();
    }
    await trx(table).where({ id }).delete();
    return insertedId;
  });

  // Audit + activity log (best-effort; never blocks the delete).
  if (input.req) {
    await logAudit(input.req, {
      action: 'DELETE',
      module: moduleLabel || moduleKey,
      target: label || `#${id}`,
      description: `Deleted ${label || `${table} #${id}`} (moved to Recycle Bin)`,
      before: main,
    });
  }

  return binId as number;
}

/** Restore a bin entry back to its origin table (and children). Removes the bin row. */
export async function recycleRestore(binId: number): Promise<void> {
  const entry = await db('recycle_bin').where({ id: binId }).first();
  if (!entry) throw new Error('Recycle bin entry not found.');

  let payload: Payload;
  try { payload = JSON.parse(entry.payload); }
  catch { throw new Error('Corrupted recycle bin payload.'); }

  await db.transaction(async (trx) => {
    // Re-insert main row (keeps original id so children FKs line up).
    await trx(entry.source_table).insert(reviveRow(payload.main));
    for (const child of payload.children || []) {
      if (child.rows?.length) await trx(child.table).insert(child.rows.map(reviveRow));
    }
    await trx('recycle_bin').where({ id: binId }).delete();
  });
}

// JSON.stringify turns MySQL DATE/DATETIME/TIMESTAMP values into ISO-8601
// strings ending in "Z" (UTC). MySQL can't insert that format directly, so we
// convert them back to a "YYYY-MM-DD HH:MM:SS" wall-clock string in the DB
// timezone (+08:00) before re-inserting.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const TZ_OFFSET_MS = 8 * 60 * 60 * 1000; // +08:00

function reviveRow<T extends Record<string, any>>(row: T): T {
  const out: Record<string, any> = { ...row };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (typeof v === 'string' && ISO_DATE.test(v)) {
      const local = new Date(new Date(v).getTime() + TZ_OFFSET_MS);
      out[k] = local.toISOString().slice(0, 19).replace('T', ' ');
    }
  }
  return out as T;
}

/** Permanently delete a bin entry — also removes its files from disk. */
export async function recyclePurge(binId: number): Promise<void> {
  const entry = await db('recycle_bin').where({ id: binId }).first();
  if (!entry) return;
  let payload: Payload | null = null;
  try { payload = JSON.parse(entry.payload); } catch { /* ignore */ }
  (payload?.files || []).forEach(f => deleteUpload(f));
  await db('recycle_bin').where({ id: binId }).delete();
}

/** Auto-purge entries older than the configured retention (days). 0 = never. */
export async function recycleAutoPurge(): Promise<number> {
  const row = await db('config_settings').where({ module: 'recycle_bin', key: 'retention_days' }).first();
  const days = parseInt(row?.value);
  if (!days || days <= 0) return 0; // never
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const stale = await db('recycle_bin').where('deleted_at', '<', cutoff).select('id');
  for (const s of stale) await recyclePurge(s.id);
  return stale.length;
}

/**
 * Convenience wrapper for API DELETE handlers: resolves the current user
 * from the request, then snapshots + deletes. Keeps call sites to one line.
 */
export async function recycleFromReq(
  req: NextApiRequest,
  input: Omit<RecycleInput, 'auth'>,
): Promise<number> {
  const auth = await getAuth(req).catch(() => null);
  return recycleDelete({ ...input, auth, req });
}

/** Pick the first non-empty field from a row, for a friendly bin label. */
export function pickLabel(row: any, fields: string[], fallbackId?: number): string {
  for (const f of fields) {
    const v = row?.[f];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return `#${fallbackId ?? row?.id ?? ''}`;
}
