import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

const TABLE = 'hr_kpi_templates';
const num = (v: any) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.kpi.templates'))) return;
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  if (req.method === 'GET') {
    try {
      const tpl = await db(TABLE).where({ id }).first();
      if (!tpl) return res.status(404).json({ success: false, message: 'Template not found.' });
      const items = await db('hr_kpi_template_items').where({ template_id: id }).orderBy('sort_order', 'asc');
      return res.status(200).json({ success: true, data: { ...tpl, items } });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const b = req.body || {};
    if (!b.name?.trim()) return res.status(400).json({ success: false, message: 'Template name is required.' });
    const items = Array.isArray(b.items) ? b.items : [];
    try {
      await db.transaction(async (trx) => {
        await trx(TABLE).where({ id }).update({ name: b.name.trim(), description: b.description?.trim() || null, status: b.status || 'Active' });
        await trx('hr_kpi_template_items').where({ template_id: id }).delete();
        let order = 0;
        for (const it of items) {
          await trx('hr_kpi_template_items').insert({
            template_id: id, competency_id: it.competency_id || null,
            competency_name: it.competency_name?.trim() || null, weight: num(it.weight), sort_order: order++,
          });
        }
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Template not found.' });
      const items = await db('hr_kpi_template_items').where({ template_id: id });
      await recycleFromReq(req, {
        moduleKey: 'hr.kpi.templates', moduleLabel: 'KPI Templates', table: TABLE, id,
        label: `KPI Template: ${pickLabel(row, ['name'], id)}`,
        children: [{ table: 'hr_kpi_template_items', rows: items }],
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
