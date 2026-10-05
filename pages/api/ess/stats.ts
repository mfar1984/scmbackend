import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getEssSession } from '@/lib/essAuth';

// Dashboard stats for the logged-in staff: leave usage donut, monthly leave-days bar,
// claim status counts, and net-pay trend (last 6 payslips).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const sess = await getEssSession(req);
  if (!sess) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!sess.employeeId) return res.status(403).json({ success: false, message: 'Account not linked to an employee.' });

  try {
    const empId = sess.employeeId;
    const year = new Date().getFullYear();
    const yStart = `${year}-01-01`, yEnd = `${year}-12-31`;

    // Leave usage by type (approved this year)
    const leaveByType = await db('hr_leave_applications as a')
      .leftJoin('hr_leave_types as t', 't.id', 'a.leave_type_id')
      .where('a.employee_id', empId).where('a.status', 'Approved')
      .whereBetween('a.start_date', [yStart, yEnd])
      .groupBy('t.id', 't.name', 't.color')
      .select('t.name', 't.color', db.raw('COALESCE(SUM(a.days),0) as days'));

    // Leave days per month (approved)
    const leaveMonthly = await db('hr_leave_applications')
      .where({ employee_id: empId, status: 'Approved' })
      .whereBetween('start_date', [yStart, yEnd])
      .groupByRaw('MONTH(start_date)')
      .select(db.raw('MONTH(start_date) as m'), db.raw('COALESCE(SUM(days),0) as days'));
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const row = leaveMonthly.find((r: any) => Number(r.m) === i + 1);
      return { label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], value: row ? Number(row.days) : 0 };
    });

    // Claim status counts
    const claimStatus = await db('hr_claim_applications')
      .where({ employee_id: empId })
      .groupBy('status').select('status', db.raw('COUNT(*) as cnt'));

    // Net pay trend (last 6 payslips, approved/paid periods)
    const payslips = await db('hr_payslips as ps')
      .leftJoin('hr_payroll_periods as pe', 'pe.id', 'ps.period_id')
      .where('ps.employee_id', empId)
      .whereIn('pe.status', ['Approved', 'Paid', 'Closed'])
      .orderBy('ps.id', 'desc').limit(6)
      .select('ps.net_salary', 'pe.name as period');
    const payTrend = payslips.reverse().map((p: any) => ({ label: String(p.period || '').split(' ')[0].slice(0, 3), value: Number(p.net_salary) }));

    // counts
    const [leaveCnt, claimCnt, otCnt, expCnt] = await Promise.all([
      db('hr_leave_applications').where({ employee_id: empId }).count({ c: '*' }).first(),
      db('hr_claim_applications').where({ employee_id: empId }).count({ c: '*' }).first(),
      db('hr_overtime_applications').where({ employee_id: empId }).count({ c: '*' }).first(),
      db('hr_expense_applications').where({ employee_id: empId }).count({ c: '*' }).first(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        leaveByType: leaveByType.map((r: any) => ({ label: r.name || 'Other', value: Number(r.days), color: r.color || '#3b82f6' })),
        monthly,
        claimStatus: claimStatus.map((r: any) => ({ status: r.status, count: Number(r.cnt) })),
        payTrend,
        counts: { leave: Number(leaveCnt?.c || 0), claim: Number(claimCnt?.c || 0), overtime: Number(otCnt?.c || 0), expense: Number(expCnt?.c || 0) },
      },
    });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
