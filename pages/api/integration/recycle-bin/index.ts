import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { recycleAutoPurge } from '@/lib/recycleBin';

const PERM = 'settings.integration.recycle_bin';

// GET: list bin entries (+ usage + retention). Read required.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const auth = await getAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!(await hasPermission(auth, PERM, 'Read'))) {
    return res.status(403).json({ success: false, message: 'You do not have permission to view this page.' });
  }

  try {
    // Opportunistic auto-purge whenever the bin is opened.
    await recycleAutoPurge().catch(() => {});

    const rows = await db('recycle_bin as r')
      .leftJoin('users as u', 'u.id', 'r.deleted_by')
      .select('r.id', 'r.module_key', 'r.module_label', 'r.source_table', 'r.record_id',
        'r.label', 'r.file_count', 'r.deleted_at', 'u.name as deleted_by_name')
      .orderBy('r.deleted_at', 'desc');

    // Approx storage usage (sum of payload byte length).
    const usage = await db('recycle_bin').sum({ bytes: db.raw('LENGTH(payload)') }).first();
    const setting = await db('config_settings').where({ module: 'recycle_bin', key: 'retention_days' }).first();

    return res.status(200).json({
      success: true,
      data: rows,
      usage_bytes: Number((usage as any)?.bytes || 0),
      retention_days: parseInt(setting?.value) || 0,
    });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
