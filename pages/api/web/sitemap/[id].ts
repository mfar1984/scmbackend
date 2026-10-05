import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq } from '@/lib/recycleBin';

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
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  if (req.method === 'PUT') {
    const b = req.body || {};
    try {
      const exists = await db(TABLE).where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Entry not found.' });
      const upd: Record<string, any> = {};
      if (b.loc !== undefined) {
        const loc = normLoc(b.loc);
        if (!loc) return res.status(400).json({ success: false, message: 'URL path is required.' });
        const dup = await db(TABLE).where({ loc }).whereNot({ id }).first();
        if (dup) return res.status(409).json({ success: false, message: 'This URL already exists.' });
        upd.loc = loc;
      }
      if (b.changefreq !== undefined) upd.changefreq = FREQS.includes(b.changefreq) ? b.changefreq : 'monthly';
      if (b.priority !== undefined) upd.priority = normPriority(b.priority);
      if (b.enabled !== undefined) upd.enabled = b.enabled ? 1 : 0;
      if (b.sort_order !== undefined) upd.sort_order = parseInt(b.sort_order) || 0;
      await db(TABLE).where({ id }).update(upd);
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Entry not found.' });
      await recycleFromReq(req, { moduleKey: 'web.legal.sitemap', moduleLabel: 'Sitemap', table: TABLE, id, label: `Sitemap: ${row.loc || `#${id}`}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
