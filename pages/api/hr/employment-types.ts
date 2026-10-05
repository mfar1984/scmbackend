import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

const TABLE = 'hr_employment_types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.employee.settings.employment_types'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE).orderBy('name', 'asc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const { name, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required.' });
    try {
      const dup = await db(TABLE).where({ name: name.trim() }).first();
      if (dup) return res.status(409).json({ success: false, message: 'Already exists.' });
      const [id] = await db(TABLE).insert({ name: name.trim(), status: status || 'Active' });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const { name, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required.' });
    try {
      const dup = await db(TABLE).where({ name: name.trim() }).whereNot({ id }).first();
      if (dup) return res.status(409).json({ success: false, message: 'Name already exists.' });
      await db(TABLE).where({ id }).update({ name: name.trim(), status: status || 'Active' });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      await recycleFromReq(req, { moduleKey: 'hr.employee.settings.employment_types', moduleLabel: 'Employment Types', table: TABLE, id, label: `Employment Type: ${pickLabel(row, ['name'], id)}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
