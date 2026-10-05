import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasPermission } from '@/lib/serverPermissions';

const PERM = 'settings.integration.recycle_bin';
const ALLOWED = [0, 30, 60, 90, 180, 365];

// PUT → update retention (days). Update required.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const auth = await getAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!(await hasPermission(auth, PERM, 'Update'))) {
    return res.status(403).json({ success: false, message: 'You do not have permission to change settings.' });
  }

  const days = parseInt(req.body?.retention_days);
  if (isNaN(days) || !ALLOWED.includes(days)) {
    return res.status(400).json({ success: false, message: 'Invalid retention value.' });
  }

  try {
    const exists = await db('config_settings').where({ module: 'recycle_bin', key: 'retention_days' }).first();
    if (exists) await db('config_settings').where({ module: 'recycle_bin', key: 'retention_days' }).update({ value: String(days) });
    else await db('config_settings').insert({ module: 'recycle_bin', key: 'retention_days', value: String(days) });
    return res.status(200).json({ success: true });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
