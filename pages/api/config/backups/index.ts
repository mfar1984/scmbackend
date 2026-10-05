import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { createBackup, applyRetention } from '@/lib/backup/engine';

// GET  → list backup history
// POST → run a manual backup now
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db('backups').orderBy('created_at', 'desc').limit(100);
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    try {
      const result = await createBackup('Manual');
      // Best-effort retention cleanup using configured days
      const retRow = await db('config_settings').where({ module: 'backup', key: 'retention' }).first();
      const days = parseInt(retRow?.value || '0');
      if (days > 0) { try { await applyRetention(days); } catch { /* ignore */ } }
      return res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Backup failed.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
