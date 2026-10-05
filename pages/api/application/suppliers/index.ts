import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db('supplier_registrations')
        .select(
          '*',
          db.raw("(doc_ssm LIKE 'data:%') AS has_ssm"),
          db.raw("(doc_profile LIKE 'data:%') AS has_profile"),
          db.raw("(doc_mof LIKE 'data:%') AS has_mof"),
          db.raw("(doc_cidb LIKE 'data:%') AS has_cidb"),
          db.raw("(doc_financial LIKE 'data:%') AS has_financial"),
          db.raw("(doc_bank LIKE 'data:%') AS has_bank"),
        )
        .orderBy('id', 'desc');
      // strip heavy base64 columns; keep filenames + flags; parse "other" doc names
      const heavy = ['doc_ssm', 'doc_profile', 'doc_mof', 'doc_cidb', 'doc_financial', 'doc_bank'];
      const data = rows.map((r: any) => {
        const out: any = { ...r };
        for (const h of heavy) delete out[h];
        let otherNames: string[] = [];
        if (r.doc_other) {
          try { otherNames = (JSON.parse(r.doc_other) || []).map((o: any) => o.name).filter(Boolean); } catch { /* ignore */ }
        }
        out.doc_other = undefined;
        out.other_names = otherNames;
        out.has_other = otherNames.length;
        return out;
      });
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
