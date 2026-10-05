import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── GET (list) ──
  if (req.method === 'GET') {
    try {
      // Exclude heavy base64 document columns from the list payload;
      // expose only filenames + boolean "has" flags for the UI.
      // A document counts as present only if it is a real base64 data URL
      // (legacy rows stored just the filename text, which is not viewable).
      const rows = await db('hr_applicants')
        .select(
          '*',
          db.raw("(doc_passport LIKE 'data:%') AS has_passport"),
          db.raw("(doc_resume LIKE 'data:%') AS has_resume"),
          db.raw("(doc_cover_letter LIKE 'data:%') AS has_cover_letter"),
        )
        .orderBy('id', 'desc');
      // strip the large columns
      const data = rows.map((r: any) => {
        const { doc_passport, doc_resume, doc_cover_letter, ...rest } = r;
        return rest;
      });
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
