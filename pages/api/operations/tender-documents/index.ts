import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };
const TABLE = 'ops_tender_documents';

// POST: upload a document to a tender. GET ?id=: serve. DELETE ?id=: remove.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET' && req.query.id) {
    try {
      const id = parseInt(req.query.id as string);
      const row = await db(TABLE).where({ id }).first();
      if (!row?.file_data || !String(row.file_data).startsWith('data:')) return res.status(404).send('Not found.');
      const m = String(row.file_data).match(/^data:([^;]+);base64,([\s\S]*)$/);
      if (!m) return res.status(422).send('Invalid.');
      const buf = Buffer.from(m[2], 'base64');
      res.setHeader('Content-Type', row.mime_type || m[1]);
      res.setHeader('Content-Disposition', `inline; filename="${(row.file_name || 'document').replace(/"/g, '')}"`);
      res.setHeader('Content-Length', buf.length);
      return res.status(200).send(buf);
    } catch { return res.status(500).send('Error.'); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    const tenderId = parseInt(b.tender_id);
    if (isNaN(tenderId)) return res.status(400).json({ success: false, message: 'Tender is required.' });
    if (!b.file_data || !String(b.file_data).startsWith('data:')) return res.status(400).json({ success: false, message: 'A valid file is required.' });
    if (String(b.file_data).length > 18_000_000) return res.status(400).json({ success: false, message: 'File too large (max ~12MB).' });
    try {
      const mime = (String(b.file_data).match(/^data:([^;]+);/) || [])[1] || 'application/octet-stream';
      const [id] = await db(TABLE).insert({
        tender_id: tenderId, doc_type: b.doc_type || 'General',
        file_name: b.file_name?.trim() || 'document', mime_type: mime, file_data: b.file_data,
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    try {
      await db(TABLE).where({ id }).delete();
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
