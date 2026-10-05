import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq } from '@/lib/recycleBin';

const TABLE = 'hr_advances';
const VALID = ['Pending', 'Approved', 'Rejected', 'Paid'];

async function nextRef(): Promise<string> {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ADV-${ymd}-`;
  const last = await db(TABLE).where('reference_no', 'like', `${prefix}%`).orderBy('id', 'desc').first();
  let seq = 1;
  if (last?.reference_no) { const n = parseInt(String(last.reference_no).split('-').pop() || '0'); if (!isNaN(n)) seq = n + 1; }
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.payroll.advances'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(`${TABLE} as a`)
        .select('a.*', 'e.full_name as employee_name', 'e.employee_id as employee_code',
          db.raw('GREATEST(a.amount - (a.monthly_deduction * a.paid_months), 0) as balance'))
        .leftJoin('hr_employees as e', 'e.id', 'a.employee_id')
        .orderBy('a.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.employee_id) return res.status(400).json({ success: false, message: 'Employee is required.' });
    const amount = parseFloat(b.amount) || 0;
    const months = parseInt(b.repayment_months) || 0;
    if (amount <= 0) return res.status(400).json({ success: false, message: 'A valid advance amount is required.' });
    if (months <= 0) return res.status(400).json({ success: false, message: 'Repayment months must be at least 1.' });
    try {
      const reference_no = await nextRef();
      const monthly = r2(amount / months);
      const [id] = await db(TABLE).insert({
        reference_no, employee_id: b.employee_id,
        amount, repayment_months: months, monthly_deduction: monthly, paid_months: 0,
        request_date: b.start_date || b.request_date || null,
        start_date: b.start_date || null,
        reason: b.reason?.trim() || null, remarks: b.remarks?.trim() || null,
        status: 'Approved',
      });
      return res.status(201).json({ success: true, id, reference_no });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const b = req.body || {};
    try {
      const update: any = {};
      if (b.status && VALID.includes(b.status)) update.status = b.status;
      if (b.remarks !== undefined) update.remarks = b.remarks?.trim() || null;
      if (b.amount != null && b.repayment_months != null) {
        const amount = parseFloat(b.amount) || 0;
        const months = parseInt(b.repayment_months) || 1;
        update.amount = amount; update.repayment_months = months;
        update.monthly_deduction = r2(amount / months);
      }
      await db(TABLE).where({ id }).update(update);
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      await recycleFromReq(req, { moduleKey: 'hr.payroll.advances', moduleLabel: 'Advances', table: TABLE, id, label: `Advance: ${row.reference_no || `#${id}`}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
