import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';

const TABLE = 'hr_kpi_templates';
const num = (v: any) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.kpi.templates'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(`${TABLE} as t`)
        .select('t.*',
          db.raw('(SELECT COUNT(*) FROM hr_kpi_template_items i WHERE i.template_id = t.id) AS item_count'),
          db.raw('(SELECT COALESCE(SUM(i.weight),0) FROM hr_kpi_template_items i WHERE i.template_id = t.id) AS total_weight'))
        .orderBy('t.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.name?.trim()) return res.status(400).json({ success: false, message: 'Template name is required.' });
    const items = Array.isArray(b.items) ? b.items : [];
    if (items.length === 0) return res.status(400).json({ success: false, message: 'Add at least one competency.' });
    try {
      const result = await db.transaction(async (trx) => {
        const [id] = await trx(TABLE).insert({ name: b.name.trim(), description: b.description?.trim() || null, status: b.status || 'Active' });
        let order = 0;
        for (const it of items) {
          await trx('hr_kpi_template_items').insert({
            template_id: id, competency_id: it.competency_id || null,
            competency_name: it.competency_name?.trim() || null, weight: num(it.weight), sort_order: order++,
          });
        }
        return { id };
      });
      return res.status(201).json({ success: true, ...result });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
