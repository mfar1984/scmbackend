import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

const TABLE = 'hr_dropdown_options';
const VALID_CATEGORIES = ['gender', 'marital_status', 'employee_status', 'nationality', 'race', 'religion', 'job_type'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.employee.settings.dropdowns'))) return;
  // ── GET ?category= (optional) ──
  if (req.method === 'GET') {
    try {
      const { category } = req.query;
      let query = db(TABLE).orderBy([{ column: 'category' }, { column: 'sort_order' }]);
      if (category) query = query.where({ category });
      const rows = await query;
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // ── POST ──
  if (req.method === 'POST') {
    const { category, value, sort_order } = req.body;
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category.' });
    }
    if (!value?.trim()) return res.status(400).json({ success: false, message: 'Value is required.' });
    try {
      const [id] = await db(TABLE).insert({
        category, value: value.trim(),
        sort_order: sort_order || 0, status: 'Active',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // ── PUT ?id= ──
  if (req.method === 'PUT') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const { value, sort_order, status } = req.body;
    if (!value?.trim()) return res.status(400).json({ success: false, message: 'Value is required.' });
    try {
      await db(TABLE).where({ id }).update({
        value: value.trim(),
        sort_order: sort_order ?? 0,
        status: status || 'Active',
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // ── DELETE ?id= ──
  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      await recycleFromReq(req, { moduleKey: 'hr.employee.settings.dropdowns', moduleLabel: 'Dropdown Options', table: TABLE, id, label: `Dropdown (${row.category}): ${pickLabel(row, ['value'], id)}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
