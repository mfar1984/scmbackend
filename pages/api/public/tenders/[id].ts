import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import db from '@/lib/db';
import { resolveUpload } from '@/lib/uploads';

// Public tender document download (streamed from disk).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed.');
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).send('Invalid.');

  try {
    const row = await db('web_tenders').where({ id, status: 'Active' }).first();
    if (!row?.file_path) return res.status(404).send('Document not found.');

    if (row.require_email) {
      const token = String(req.query.token || '');
      if (!token) return res.status(401).send('This document requires email verification.');
      const log = await db('web_download_logs').where({ token, download_id: id, kind: 'tender', verified: 1 }).first();
      if (!log) return res.status(403).send('Invalid or unverified link.');
      await db('web_download_logs').where({ id: log.id }).update({ downloaded_at: db.fn.now() });
    }

    const abs = resolveUpload(row.file_path);
    if (!fs.existsSync(abs)) return res.status(404).send('File missing.');

    await db('web_tenders').where({ id }).increment('download_count', 1);

    const stat = fs.statSync(abs);
    res.setHeader('Content-Type', row.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${(row.file_name || 'tender-document').replace(/"/g, '')}"`);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return fs.createReadStream(abs).pipe(res);
  } catch { return res.status(500).send('Error.'); }
}
