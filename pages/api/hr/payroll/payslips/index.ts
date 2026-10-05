import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// List all generated payslips (optionally filter by year/period/status).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  try {
    const q = db('hr_payslips as ps')
      .leftJoin('hr_payroll_periods as pe', 'pe.id', 'ps.period_id')
      .select(
        'ps.id', 'ps.payslip_no', 'ps.period_id', 'ps.employee_code', 'ps.employee_name',
        'ps.department_name', 'ps.basic_salary', 'ps.gross_salary', 'ps.total_deductions',
        'ps.net_salary', 'ps.status',
        'pe.name as period_name', 'pe.year as period_year',
      )
      .orderBy('ps.id', 'desc');

    if (req.query.period_id) q.where('ps.period_id', parseInt(req.query.period_id as string));
    if (req.query.year) q.where('pe.year', parseInt(req.query.year as string));
    if (req.query.status && req.query.status !== 'All') q.where('ps.status', req.query.status as string);

    const rows = await q;
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
