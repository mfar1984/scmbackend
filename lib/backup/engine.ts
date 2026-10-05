import fs from 'fs';
import path from 'path';
import db from '@/lib/db';
import { UPLOAD_ROOT } from '@/lib/uploads';
import { generateSqlDump, restoreSqlDump } from './dump';
import { ensureBackupDir, localPath, pushToStorage, fetchArchive, removeArchive, validateStorage } from './storage';
import { writeZip, type ZipInput } from './zip';

/**
 * Creates a full backup: database SQL dump + the uploads/ folder, zipped,
 * then stored to the configured destination (local / r2 / ftp). Records
 * the result in the `backups` table.
 */

/** Recursively collect all files under a directory (absolute paths). */
function walkFiles(dir: string): string[] {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile()) out.push(full);
    }
  }
  return out;
}

export async function createBackup(type: 'Auto' | 'Manual' = 'Manual'): Promise<{ id: number; file_name: string }> {
  const storageRow = await db('config_settings').where({ module: 'backup', key: 'storage' }).first();
  const storage = storageRow?.value || 'local';

  const cfgErr = await validateStorage(storage);
  if (cfgErr) throw new Error(cfgErr);

  ensureBackupDir();
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const fileName = `backup_${stamp}_${type.toLowerCase()}.zip`;
  const absZip = localPath(fileName);

  // Insert a "Running" record up-front
  const [id] = await db('backups').insert({
    file_name: fileName, storage, type, status: 'Running', size_bytes: 0,
  });

  try {
    // 1) Generate SQL dump (kept in memory as a zip entry)
    const sql = await generateSqlDump();

    // 2) Build the ZIP: database.sql + every file under uploads/
    //    Uses our own dependency-free ZIP writer (no archiver).
    const entries: ZipInput[] = [{ name: 'database.sql', data: Buffer.from(sql, 'utf8') }];
    if (fs.existsSync(UPLOAD_ROOT)) {
      for (const abs of walkFiles(UPLOAD_ROOT)) {
        const rel = path.relative(UPLOAD_ROOT, abs).split(path.sep).join('/');
        entries.push({ name: `uploads/${rel}`, absPath: abs });
      }
    }
    await writeZip(absZip, entries);

    const size = fs.statSync(absZip).size;

    // 3) Push to remote storage if configured. For remote storage we do NOT
    //    keep a local copy (saves disk on shared hosting) — the working zip
    //    is deleted after a successful upload, and file_path is left null.
    let filePath: string | null = path.posix.join('backups', fileName);
    if (storage !== 'local') {
      await pushToStorage(storage, fileName, absZip);
      try { fs.unlinkSync(absZip); } catch { /* ignore */ }
      filePath = null;
    }

    await db('backups').where({ id }).update({ status: 'Complete', size_bytes: size, file_path: filePath });
    return { id, file_name: fileName };
  } catch (err: any) {
    await db('backups').where({ id }).update({ status: 'Failed', note: (err.message || 'Backup failed').slice(0, 240) });
    try { fs.unlinkSync(absZip); } catch { /* ignore */ }
    throw err;
  }
}

/** Apply retention policy — delete backups older than N days (and their files). */
export async function applyRetention(days: number): Promise<number> {
  if (!days || days <= 0) return 0;
  const cutoff = new Date(Date.now() - days * 86400000);
  const old = await db('backups').where('created_at', '<', cutoff);
  for (const b of old) {
    try { await removeArchive(b.storage, b.file_name, b.file_path); } catch { /* ignore */ }
  }
  return db('backups').where('created_at', '<', cutoff).delete();
}

/** Restore the database from a stored backup archive. */
export async function restoreBackup(id: number): Promise<void> {
  const b = await db('backups').where({ id }).first();
  if (!b) throw new Error('Backup not found.');
  if (b.status !== 'Complete') throw new Error('Cannot restore an incomplete backup.');

  const buf = await fetchArchive(b.storage, b.file_name, b.file_path);

  // Extract database.sql from the zip in-memory
  const unzipper = await getZipReader(buf);
  const sql = unzipper('database.sql');
  if (!sql) throw new Error('database.sql not found inside the backup archive.');
  await restoreSqlDump(sql.toString('utf8'));
}

/**
 * Minimal ZIP reader (no extra dep) — extracts a single stored/deflated entry.
 * Uses Node's zlib for deflate. Good enough to pull database.sql back out.
 */
async function getZipReader(buf: Buffer): Promise<(name: string) => Buffer | null> {
  const zlib = await import('zlib');
  // Find End of Central Directory record
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Invalid ZIP archive.');
  const cdOffset = buf.readUInt32LE(eocd + 16);
  const cdCount = buf.readUInt16LE(eocd + 10);

  const entries: Record<string, { offset: number; method: number; compSize: number }> = {};
  let p = cdOffset;
  for (let n = 0; n < cdCount; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    entries[name] = { offset: localOffset, method, compSize };
    p += 46 + nameLen + extraLen + commentLen;
  }

  return (name: string): Buffer | null => {
    const e = entries[name];
    if (!e) return null;
    // Parse local file header to find data start
    const lh = e.offset;
    if (buf.readUInt32LE(lh) !== 0x04034b50) return null;
    const nameLen = buf.readUInt16LE(lh + 26);
    const extraLen = buf.readUInt16LE(lh + 28);
    const dataStart = lh + 30 + nameLen + extraLen;
    const comp = buf.subarray(dataStart, dataStart + e.compSize);
    if (e.method === 0) return Buffer.from(comp);          // stored
    if (e.method === 8) return zlib.inflateRawSync(comp);  // deflate
    throw new Error(`Unsupported ZIP compression method: ${e.method}`);
  };
}
