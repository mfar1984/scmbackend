import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq } from '@/lib/recycleBin';

const TABLE = 'hr_commissions';
const VALID = ['Pending', 'Approved', 'Paid'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.payroll.commission'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(`${TABLE} as a`)
        .select('a.*', 'e.full_name as employee_name', 'e.employee_id as employee_code', 'p.name as period_name')
        .leftJoin('hr_employees as e', 'e.id', 'a.employee_id')
        .leftJoin('hr_payroll_periods as p', 'p.id', 'a.period_id')
        .orderBy('a.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const { employee_id, period_id, commission_type, amount, remarks, status } = req.body;
    if (!employee_id) return res.status(400).json({ success: false, message: 'Employee is required.' });
    if (!period_id) return res.status(400).json({ success: false, message: 'Payroll period is required.' });
    if (!(parseFloat(amount) > 0)) return res.status(400).json({ success: false, message: 'A valid amount is required.' });
    try {
      const [id] = await db(TABLE).insert({
        employee_id, period_id,
        description: commission_type || 'Commission', commission_type: commission_type || 'Sales Commission',
        amount: amount || 0, remarks: remarks?.trim() || null,
        status: VALID.includes(status) ? status : 'Pending',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const { employee_id, period_id, commission_type, amount, remarks, status } = req.body;
    try {
      await db(TABLE).where({ id }).update({
        employee_id, period_id: period_id || null,
        description: commission_type || 'Commission', commission_type: commission_type || 'Sales Commission',
        amount: amount || 0, remarks: remarks?.trim() || null,
        status: VALID.includes(status) ? status : 'Pending',
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
      await recycleFromReq(req, { moduleKey: 'hr.payroll.commission', moduleLabel: 'Commission', table: TABLE, id, label: `Commission: ${row.employee_name || `#${id}`}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
