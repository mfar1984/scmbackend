import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Company-wide HR dashboard stats for the admin backend charts.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  try {
    const year = new Date().getFullYear();
    const yStart = `${year}-01-01`, yEnd = `${year}-12-31`;

    // Headline counts
    const [empCnt, staffLogins, pendingLeave, pendingClaim, pendingOt, pendingExp] = await Promise.all([
      db('hr_employees').where('status', 'Active').count({ c: '*' }).first(),
      db('users').where('user_type', 'staff').count({ c: '*' }).first(),
      db('hr_leave_applications').where('status', 'Pending').count({ c: '*' }).first(),
      db('hr_claim_applications').where('status', 'Pending').count({ c: '*' }).first(),
      db('hr_overtime_applications').where('status', 'Pending').count({ c: '*' }).first(),
      db('hr_expense_applications').where('status', 'Pending').count({ c: '*' }).first(),
    ]);

    // Employees by department (donut)
    const byDept = await db('hr_employees as e')
      .leftJoin('hr_departments as d', 'd.id', 'e.department_id')
      .where('e.status', 'Active')
      .groupBy('d.id', 'd.name')
      .select('d.name', db.raw('COUNT(*) as cnt'));

    // Leave applications per month (bar)
    const leaveMonthly = await db('hr_leave_applications')
      .whereBetween('start_date', [yStart, yEnd])
      .groupByRaw('MONTH(start_date)')
      .select(db.raw('MONTH(start_date) as m'), db.raw('COUNT(*) as cnt'));
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const row = leaveMonthly.find((r: any) => Number(r.m) === i + 1);
      return { label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], value: row ? Number(row.cnt) : 0 };
    });

    // Pending approvals by module (bar)
    const pendingByModule = [
      { label: 'Leave', value: Number(pendingLeave?.c || 0) },
      { label: 'Claim', value: Number(pendingClaim?.c || 0) },
      { label: 'Overtime', value: Number(pendingOt?.c || 0) },
      { label: 'Expense', value: Number(pendingExp?.c || 0) },
    ];

    // Payroll net total per processed period (line) — last 6
    const periods = await db('hr_payroll_periods')
      .whereIn('status', ['Processing', 'Approved', 'Paid', 'Closed'])
      .orderBy('id', 'desc').limit(6)
      .select('id', 'name');
    const payrollTrend = [];
    for (const p of periods.reverse()) {
      const sum = await db('hr_payslips').where('period_id', p.id).sum({ t: 'net_salary' }).first();
      payrollTrend.push({ label: String(p.name || '').split(' ')[0].slice(0, 3), value: Math.round(Number(sum?.t || 0)) });
    }

    // Headcount by employment status
    const byStatus = await db('hr_employees')
      .groupBy('employee_status').select('employee_status', db.raw('COUNT(*) as cnt'));

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          employees: Number(empCnt?.c || 0),
          staffLogins: Number(staffLogins?.c || 0),
          pendingLeave: Number(pendingLeave?.c || 0),
          pendingApprovals: Number(pendingLeave?.c || 0) + Number(pendingClaim?.c || 0) + Number(pendingOt?.c || 0) + Number(pendingExp?.c || 0),
        },
        byDept: byDept.map((r: any) => ({ label: r.name || 'Unassigned', value: Number(r.cnt) })),
        monthly, pendingByModule, payrollTrend,
        byStatus: byStatus.map((r: any) => ({ label: r.employee_status || 'Unknown', value: Number(r.cnt) })),
      },
    });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
