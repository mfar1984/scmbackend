import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq } from '@/lib/recycleBin';

const TABLE = 'hr_loans';
const VALID = ['Active', 'Completed', 'Cancelled'];

async function nextRef(): Promise<string> {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `LON-${ymd}-`;
  const last = await db(TABLE).where('loan_number', 'like', `${prefix}%`).orderBy('id', 'desc').first();
  let seq = 1;
  if (last?.loan_number) { const n = parseInt(String(last.loan_number).split('-').pop() || '0'); if (!isNaN(n)) seq = n + 1; }
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.payroll.loan'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(`${TABLE} as a`)
        .select('a.*', 'e.full_name as employee_name', 'e.employee_id as employee_code',
          db.raw('GREATEST(a.amount - (a.monthly_deduction * a.paid_installments), 0) as balance'))
        .leftJoin('hr_employees as e', 'e.id', 'a.employee_id')
        .orderBy('a.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.employee_id) return res.status(400).json({ success: false, message: 'Employee is required.' });
    const amount = parseFloat(b.amount) || 0;
    const installments = parseInt(b.total_installments) || 0;
    if (amount <= 0) return res.status(400).json({ success: false, message: 'A valid loan amount is required.' });
    if (installments <= 0) return res.status(400).json({ success: false, message: 'Total installments must be at least 1.' });
    try {
      const loan_number = await nextRef();
      const monthly = r2(amount / installments);
      const [id] = await db(TABLE).insert({
        loan_number, employee_id: b.employee_id,
        loan_type: b.loan_type?.trim() || 'Staff Loan',
        amount, monthly_deduction: monthly,
        total_installments: installments, paid_installments: 0,
        start_date: b.start_date || null, remarks: b.remarks?.trim() || null,
        status: 'Active',
      });
      return res.status(201).json({ success: true, id, loan_number });
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
      // allow re-setting amount/installments only while no installment paid
      if (b.amount != null && b.total_installments != null) {
        const amount = parseFloat(b.amount) || 0;
        const inst = parseInt(b.total_installments) || 1;
        update.amount = amount; update.total_installments = inst;
        update.monthly_deduction = r2(amount / inst);
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
      await recycleFromReq(req, { moduleKey: 'hr.payroll.loan', moduleLabel: 'Loan', table: TABLE, id, label: `Loan: ${row.loan_number || `#${id}`}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
