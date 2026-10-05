import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { periodRange, monthName } from '@/lib/payroll';
import { guardCrud } from '@/lib/serverPermissions';

const TABLE = 'hr_payroll_periods';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.payroll.periods'))) return;
  // ── GET: list periods with payslip aggregates ──
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE)
        .select(
          'hr_payroll_periods.*',
          db.raw('(SELECT COUNT(*) FROM hr_payslips p WHERE p.period_id = hr_payroll_periods.id) AS employee_count'),
          db.raw('(SELECT COALESCE(SUM(p.gross_salary),0) FROM hr_payslips p WHERE p.period_id = hr_payroll_periods.id) AS gross_total'),
          db.raw('(SELECT COALESCE(SUM(p.net_salary),0) FROM hr_payslips p WHERE p.period_id = hr_payroll_periods.id) AS net_total'),
        )
        .orderBy('hr_payroll_periods.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // ── POST: create a Draft period ──
  if (req.method === 'POST') {
    const b = req.body || {};
    const month = b.month;
    const year = b.year;
    if (!month) return res.status(400).json({ success: false, message: 'Month is required.' });
    if (!year) return res.status(400).json({ success: false, message: 'Year is required.' });
    if (!b.pay_date) return res.status(400).json({ success: false, message: 'Payment date is required.' });
    try {
      const mName = monthName(month);
      const dup = await db(TABLE).where({ month: mName, year }).first();
      if (dup) return res.status(409).json({ success: false, message: `A payroll period for ${mName} ${year} already exists.` });
      const range = periodRange(month, year);
      const [id] = await db(TABLE).insert({
        name: `${mName} ${year}`,
        month: mName, year,
        period_start: range.start, period_end: range.end,
        pay_date: b.pay_date || null,
        status: 'Draft',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
