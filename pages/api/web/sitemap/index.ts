import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';

const TABLE = 'web_sitemap_entries';
const FREQS = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

const normLoc = (v: any) => {
  let s = String(v || '').trim();
  if (!s) return '';
  if (!s.startsWith('/') && !/^https?:\/\//i.test(s)) s = '/' + s;
  return s;
};
const normPriority = (v: any) => { let n = parseFloat(String(v)); if (isNaN(n)) n = 0.5; return Math.min(1, Math.max(0, Math.round(n * 10) / 10)); };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'web.legal.sitemap'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE).orderBy('sort_order', 'asc').orderBy('id', 'asc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    const loc = normLoc(b.loc);
    if (!loc) return res.status(400).json({ success: false, message: 'URL path is required.' });
    try {
      const dup = await db(TABLE).where({ loc }).first();
      if (dup) return res.status(409).json({ success: false, message: 'This URL already exists.' });
      const max = await db(TABLE).max('sort_order as m').first();
      const [id] = await db(TABLE).insert({
        loc, changefreq: FREQS.includes(b.changefreq) ? b.changefreq : 'monthly',
        priority: normPriority(b.priority), enabled: b.enabled === false ? 0 : 1,
        sort_order: (max?.m || 0) + 1,
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
