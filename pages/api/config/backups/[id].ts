import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { fetchArchive, removeArchive } from '@/lib/backup/storage';

// GET ?download=1 → stream the archive
// DELETE          → delete a backup (file + record)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  if (req.method === 'GET' && req.query.download) {
    try {
      const b = await db('backups').where({ id }).first();
      if (!b) return res.status(404).send('Not found.');
      const buf = await fetchArchive(b.storage, b.file_name, b.file_path);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${b.file_name}"`);
      res.setHeader('Content-Length', buf.length);
      return res.status(200).send(buf);
    } catch (err: any) { return res.status(500).send(err.message || 'Download failed.'); }
  }

  if (req.method === 'DELETE') {
    try {
      const b = await db('backups').where({ id }).first();
      if (!b) return res.status(404).json({ success: false, message: 'Not found.' });
      try { await removeArchive(b.storage, b.file_name, b.file_path); } catch { /* ignore file errors */ }
      await db('backups').where({ id }).delete();
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
