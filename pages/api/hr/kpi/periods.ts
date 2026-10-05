import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

const TABLE = 'hr_kpi_periods';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.kpi.periods'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE).orderBy('id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }
  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.name?.trim()) return res.status(400).json({ success: false, message: 'Period name is required.' });
    try {
      const dup = await db(TABLE).where({ name: b.name.trim() }).first();
      if (dup) return res.status(409).json({ success: false, message: 'Period already exists.' });
      const [id] = await db(TABLE).insert({
        name: b.name.trim(), cycle: b.cycle || 'Annual',
        start_date: b.start_date || null, end_date: b.end_date || null,
        status: b.status || 'Open',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }
  if (req.method === 'PUT') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const b = req.body || {};
    try {
      await db(TABLE).where({ id }).update({
        name: b.name?.trim(), cycle: b.cycle || 'Annual',
        start_date: b.start_date || null, end_date: b.end_date || null,
        status: b.status || 'Open',
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
      await recycleFromReq(req, { moduleKey: 'hr.kpi.periods', moduleLabel: 'KPI Periods', table: TABLE, id, label: `KPI Period: ${pickLabel(row, ['name'], id)}` });
      return res.status(200).json({ success: true });
    }
    catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
