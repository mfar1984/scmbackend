import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Public: list active downloads grouped metadata (no file_data).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const rows = await db('web_downloads').where({ status: 'Active' })
      .select('id', 'category', 'title', 'description', 'file_name', 'mime_type', 'file_size', 'icon', 'require_email')
      .orderBy('sort_order', 'asc').orderBy('id', 'desc');
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
