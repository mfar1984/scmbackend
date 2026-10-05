import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  res.setHeader('Access-Control-Allow-Origin', '*');

  const token = String(req.query.token || '');
  if (!token) return res.status(400).json({ success: false, message: 'Missing token.' });

  try {
    const log = await db('web_download_logs').where({ token, kind: 'tender' }).first();
    if (!log) return res.status(404).json({ success: false, message: 'Invalid or expired link.' });

    const t = await db('web_tenders').where({ id: log.download_id, status: 'Active' }).first();
    if (!t) return res.status(404).json({ success: false, message: 'Tender no longer available.' });

    if (!log.verified) await db('web_download_logs').where({ id: log.id }).update({ verified: 1 });

    return res.status(200).json({
      success: true,
      title: t.title,
      file_name: t.file_name,
      url: `/api/public/tenders/${log.download_id}?token=${token}`,
    });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
