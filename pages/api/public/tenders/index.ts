import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const rows = await db('web_tenders').where({ status: 'Active' })
      .select('id', 'ref_no', 'title', 'category', 'cat_icon', 'sector', 'value', 'issued_date', 'deadline',
        'tender_status', 'description', 'file_name', 'file_size', 'require_email',
        db.raw("(file_path IS NOT NULL AND file_path <> '') AS has_file"))
      .orderBy('sort_order', 'asc').orderBy('id', 'desc');
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
