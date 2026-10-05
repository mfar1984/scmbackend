import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { recycleRestore, recyclePurge } from '@/lib/recycleBin';

const PERM = 'settings.integration.recycle_bin';

// POST (?action=restore) → restore the record (Update).
// DELETE → permanently delete + remove its files (Delete).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  const auth = await getAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });

  if (req.method === 'POST') {
    if (!(await hasPermission(auth, PERM, 'Update'))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to restore.' });
    }
    try {
      await recycleRestore(id);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      // Don't leak the raw SQL/knex query into the UI.
      const clean = /duplicate/i.test(err?.code || err?.message || '')
        ? 'A record with the same ID already exists, so it cannot be restored.'
        : 'Restore failed. The original data could not be re-created.';
      return res.status(500).json({ success: false, message: clean });
    }
  }

  if (req.method === 'DELETE') {
    if (!(await hasPermission(auth, PERM, 'Delete'))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to permanently delete.' });
    }
    try {
      await recyclePurge(id);
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
