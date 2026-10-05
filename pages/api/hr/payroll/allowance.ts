import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq } from '@/lib/recycleBin';

const TABLE = 'hr_allowances';
const num = (v: any) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.payroll.allowance'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(`${TABLE} as a`)
        .select('a.*', 'e.full_name as employee_name', 'e.employee_id as employee_code',
          db.raw('(a.housing + a.transport + a.meal + a.other_allowance) as total'))
        .leftJoin('hr_employees as e', 'e.id', 'a.employee_id')
        .orderBy('a.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.employee_id) return res.status(400).json({ success: false, message: 'Employee is required.' });
    try {
      const total = num(b.housing) + num(b.transport) + num(b.meal) + num(b.other_allowance);
      const [id] = await db(TABLE).insert({
        employee_id: b.employee_id,
        housing: num(b.housing), transport: num(b.transport), meal: num(b.meal), other_allowance: num(b.other_allowance),
        name: 'Monthly Allowance', amount: total, frequency: 'Monthly',
        effective_date: b.effective_date || null, remarks: b.remarks?.trim() || null,
        status: b.status || 'Active',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const b = req.body || {};
    try {
      const total = num(b.housing) + num(b.transport) + num(b.meal) + num(b.other_allowance);
      await db(TABLE).where({ id }).update({
        employee_id: b.employee_id,
        housing: num(b.housing), transport: num(b.transport), meal: num(b.meal), other_allowance: num(b.other_allowance),
        amount: total, effective_date: b.effective_date || null, remarks: b.remarks?.trim() || null,
        status: b.status || 'Active',
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    try {
      const row = await db(`${TABLE} as a`).select('a.*', 'e.full_name as employee_name').leftJoin('hr_employees as e', 'e.id', 'a.employee_id').where('a.id', id).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      await recycleFromReq(req, { moduleKey: 'hr.payroll.allowance', moduleLabel: 'Allowance', table: TABLE, id, label: `Allowance: ${row.employee_name || `#${id}`}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
