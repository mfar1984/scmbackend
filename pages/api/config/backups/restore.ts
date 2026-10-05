import type { NextApiRequest, NextApiResponse } from 'next';
import { restoreBackup } from '@/lib/backup/engine';

export const config = { api: { responseLimit: false } };

// POST { id } → restore the database from a backup archive.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const id = parseInt(req.body?.id);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid backup ID.' });

  try {
    await restoreBackup(id);
    return res.status(200).json({ success: true, message: 'Database restored successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Restore failed.' });
  }
}
