import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { recyclePurge } from '@/lib/recycleBin';

const PERM = 'settings.integration.recycle_bin';

// POST → permanently delete ALL bin entries (and their files). Delete required.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const auth = await getAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!(await hasPermission(auth, PERM, 'Delete'))) {
    return res.status(403).json({ success: false, message: 'You do not have permission to empty the recycle bin.' });
  }

  try {
    const rows = await db('recycle_bin').select('id');
    for (const r of rows) await recyclePurge(r.id);
    return res.status(200).json({ success: true, purged: rows.length });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
