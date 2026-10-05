import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// DB uses timezone +08:00 → shift a DATE before formatting to avoid off-by-one.
function fmtDate(d: any): string {
  if (!d) return '';
  const dt = (d instanceof Date) ? new Date(d.getTime() + 8 * 3600 * 1000) : new Date(String(d) + 'T00:00:00Z');
  if (isNaN(dt.getTime())) return '';
  return `${String(dt.getUTCDate()).padStart(2, '0')} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

// Public: list active circulars for the website.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const rows = await db('web_circulars')
      .where({ status: 'Active' })
      .select('id', 'no', 'title', 'year', 'release_date', 'effective_date', 'file_path')
      .orderBy('year', 'desc').orderBy('release_date', 'desc').orderBy('id', 'desc');

    const data = rows.map((r: any) => ({
      id: r.id,
      no: r.no,
      title: r.title,
      year: r.year,
      date: fmtDate(r.release_date),          // release date (kept as `date` for sorting/back-compat)
      release_date: fmtDate(r.release_date),
      effective_date: fmtDate(r.effective_date),
      has_file: !!r.file_path, // frontend builds the /api/public/circulars/{id} URL
    }));
    return res.status(200).json({ success: true, data });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
