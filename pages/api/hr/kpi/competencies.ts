import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

const TABLE = 'hr_kpi_competencies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.kpi.competencies'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE).orderBy('name', 'asc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }
  if (req.method === 'POST') {
    const { name, category, description, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required.' });
    try {
      const dup = await db(TABLE).where({ name: name.trim() }).first();
      if (dup) return res.status(409).json({ success: false, message: 'Competency already exists.' });
      const [id] = await db(TABLE).insert({ name: name.trim(), category: category || 'General', description: description?.trim() || null, status: status || 'Active' });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }
  if (req.method === 'PUT') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const { name, category, description, status } = req.body;
    try {
      await db(TABLE).where({ id }).update({ name: name?.trim(), category: category || 'General', description: description?.trim() || null, status: status || 'Active' });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }
  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      await recycleFromReq(req, { moduleKey: 'hr.kpi.competencies', moduleLabel: 'KPI Competencies', table: TABLE, id, label: `Competency: ${pickLabel(row, ['name'], id)}` });
      return res.status(200).json({ success: true });
    }
    catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
