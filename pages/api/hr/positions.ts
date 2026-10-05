import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

const TABLE = 'hr_positions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.employee.settings.positions'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE)
        .select('hr_positions.*', 'hr_departments.name as department_name')
        .leftJoin('hr_departments', 'hr_departments.id', 'hr_positions.department_id')
        .orderBy('hr_positions.name', 'asc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const { name, department_id, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Position name is required.' });
    try {
      const [id] = await db(TABLE).insert({
        name: name.trim(),
        department_id: department_id || null,
        status: status || 'Active',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const { name, department_id, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Position name is required.' });
    try {
      await db(TABLE).where({ id }).update({
        name: name.trim(),
        department_id: department_id || null,
        status: status || 'Active',
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      await recycleFromReq(req, { moduleKey: 'hr.employee.settings.positions', moduleLabel: 'Positions', table: TABLE, id, label: `Position: ${pickLabel(row, ['name'], id)}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
