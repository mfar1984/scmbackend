import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { computePayslip, getRates, periodRange, monthName } from '@/lib/payroll';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { recycleDelete } from '@/lib/recycleBin';

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };

const TABLE = 'hr_payroll_periods';
const validDoc = (v: any) => (typeof v === 'string' && v.startsWith('data:') && v.length < 11_000_000) ? v : null;

async function nextPayslipNo(trx: any, period: any, seq: number): Promise<string> {
  const y = period.year || new Date().getFullYear();
  const mi = ['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(monthName(period.month)) + 1;
  const mm = String(mi || 0).padStart(2, '0');
  return `PS-${y}${mm}-${String(seq).padStart(3, '0')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  // Lifecycle actions require Approve; deletion requires Delete.
  if (req.method === 'PATCH' || req.method === 'DELETE') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const perm = req.method === 'DELETE' ? 'Delete' : 'Approve';
    if (!(await hasPermission(auth, 'hr.payroll.periods', perm))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
  }

  // ── Serve payment proof: GET ?proof=1 ──
  if (req.method === 'GET' && req.query.proof) {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row?.payment_proof) return res.status(404).send('Not found');
      const m = /^data:([^;]+);base64,([\s\S]*)$/.exec(row.payment_proof);
      if (!m) return res.status(404).send('Invalid');
      const buf = Buffer.from(m[2], 'base64');
      res.setHeader('Content-Type', m[1]);
      res.setHeader('Content-Disposition', `inline; filename="${row.payment_proof_name || 'payment-proof'}"`);
      return res.status(200).send(buf);
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // ── GET single period + its payslips ──
  if (req.method === 'GET') {
    try {
      const period = await db(TABLE).where({ id }).first();
      if (!period) return res.status(404).json({ success: false, message: 'Period not found.' });
      const payslips = await db('hr_payslips').where({ period_id: id }).orderBy('employee_name', 'asc');
      const has_proof = !!period.payment_proof;
      delete period.payment_proof;
      return res.status(200).json({ success: true, data: { ...period, has_proof, payslips } });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // ── PATCH: lifecycle actions ──
  if (req.method === 'PATCH') {
    const action = req.body?.action;
    try {
      const period = await db(TABLE).where({ id }).first();
      if (!period) return res.status(404).json({ success: false, message: 'Period not found.' });

      // ── PROCESS: Draft → Processing, generate payslips ──
      if (action === 'process') {
        if (!['Draft', 'Processing', 'Approved'].includes(period.status)) {
          return res.status(400).json({ success: false, message: 'Paid or closed periods can no longer be processed.' });
        }
        const isReprocess = period.status !== 'Draft';
        const rates = await getRates();
        const range = (period.period_start && period.period_end)
          ? { start: period.period_start, end: period.period_end }
          : periodRange(period.month, period.year);
        const employees = await db('hr_employees as e')
          .leftJoin('hr_departments as d', 'd.id', 'e.department_id')
          .leftJoin('hr_positions as p', 'p.id', 'e.position_id')
          .leftJoin('hr_banks as b', 'b.id', 'e.bank_id')
          .where('e.status', 'Active')
          .select('e.*', 'd.name as department_name', 'p.name as position_name', 'b.name as bank_name');
        if (employees.length === 0) return res.status(400).json({ success: false, message: 'No active employees to process.' });

        await db.transaction(async (trx) => {
          await trx('hr_payslips').where({ period_id: id }).delete();
          let seq = 1;
          for (const emp of employees) {
            const calc = await computePayslip(emp, range, rates, id);
            const payslip_no = await nextPayslipNo(trx, period, seq++);
            await trx('hr_payslips').insert({
              payslip_no, period_id: id, employee_id: emp.id,
              employee_code: emp.employee_id, employee_name: emp.full_name,
              nric_passport: emp.nric_passport, department_name: emp.department_name,
              position_name: emp.position_name, bank_name: emp.bank_name,
              bank_account_no: emp.bank_account_no, epf_no: emp.epf_no,
              socso_no: emp.socso_no, income_tax_no: emp.income_tax_no,
              ...calc, status: 'Draft',
            });
          }
          await trx(TABLE).where({ id }).update({ status: 'Processing', processed_at: trx.fn.now(), approved_at: null, approval_remarks: null });
        });
        return res.status(200).json({ success: true, message: isReprocess ? 'Payroll re-processed successfully (payslips regenerated)' : 'Payroll processed successfully', count: employees.length });
      }

      // ── APPROVE: Processing → Approved ──
      if (action === 'approve') {
        if (period.status !== 'Processing') return res.status(400).json({ success: false, message: 'Only processed periods can be approved.' });
        await db.transaction(async (trx) => {
          await trx(TABLE).where({ id }).update({
            status: 'Approved', approved_at: trx.fn.now(),
            approval_remarks: req.body?.remarks?.trim() || null,
          });
          await trx('hr_payslips').where({ period_id: id }).update({ status: 'Approved' });
        });
        return res.status(200).json({ success: true, message: 'Payroll period approved.' });
      }

      // ── PAY: Approved → Paid ──
      if (action === 'pay') {
        if (period.status !== 'Approved') return res.status(400).json({ success: false, message: 'Only approved periods can be marked as paid.' });
        if (!req.body?.payment_date) return res.status(400).json({ success: false, message: 'Payment date is required.' });
        const proof = validDoc(req.body?.payment_proof);
        if (!proof) return res.status(400).json({ success: false, message: 'Payment proof attachment is required.' });
        await db.transaction(async (trx) => {
          await trx(TABLE).where({ id }).update({
            status: 'Paid', paid_at: trx.fn.now(),
            pay_date: req.body.payment_date,
            payment_reference: req.body?.payment_reference?.trim() || null,
            payment_proof: proof,
            payment_proof_name: req.body?.payment_proof_name?.trim() || null,
            paid_remarks: req.body?.remarks?.trim() || null,
          });
          await trx('hr_payslips').where({ period_id: id }).update({ status: 'Paid' });

          // ── Self-running loans & advances: advance one installment for
          //    employees whose payslip in this period carried a deduction ──
          const slips = await trx('hr_payslips').where({ period_id: id })
            .select('employee_id', 'loan_deduction', 'advance_deduction');
          for (const s of slips) {
            if (parseFloat(s.loan_deduction) > 0) {
              await trx('hr_loans')
                .where({ employee_id: s.employee_id, status: 'Active' })
                .whereRaw('paid_installments < total_installments')
                .increment('paid_installments', 1);
              await trx('hr_loans')
                .where({ employee_id: s.employee_id, status: 'Active' })
                .whereRaw('paid_installments >= total_installments')
                .update({ status: 'Completed' });
            }
            if (parseFloat(s.advance_deduction) > 0) {
              await trx('hr_advances')
                .where({ employee_id: s.employee_id, status: 'Approved' })
                .whereRaw('paid_months < repayment_months')
                .increment('paid_months', 1);
              await trx('hr_advances')
                .where({ employee_id: s.employee_id, status: 'Approved' })
                .whereRaw('paid_months >= repayment_months')
                .update({ status: 'Paid' });
            }
          }
        });
        return res.status(200).json({ success: true, message: 'Payroll marked as paid.' });
      }

      // ── CLOSE: Paid → Closed (lock for audit) ──
      if (action === 'close') {
        if (period.status !== 'Paid') return res.status(400).json({ success: false, message: 'Only paid periods can be closed.' });
        await db(TABLE).where({ id }).update({ status: 'Closed', closed_at: db.fn.now() });
        return res.status(200).json({ success: true, message: 'Payroll period closed and locked.' });
      }

      return res.status(400).json({ success: false, message: 'Unknown action.' });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // ── DELETE: only Draft / Processing ──
  if (req.method === 'DELETE') {
    try {
      const period = await db(TABLE).where({ id }).first();
      if (!period) return res.status(404).json({ success: false, message: 'Period not found.' });
      if (!['Draft', 'Processing'].includes(period.status)) {
        return res.status(400).json({ success: false, message: 'Approved, paid or closed periods cannot be deleted.' });
      }
      const payslips = await db('hr_payslips').where({ period_id: id });
      const auth = await getAuth(req);
      await recycleDelete({
        moduleKey: 'hr.payroll.periods', moduleLabel: 'Payroll Periods', table: TABLE, id,
        label: `Payroll: ${period.name || `${monthName(period.month)} ${period.year}`}`,
        children: [{ table: 'hr_payslips', rows: payslips }],
        auth, req,
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
