import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getEssSession } from '@/lib/essAuth';

// Staff's own payslips. ?id= returns a single payslip with company info (for print).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const sess = await getEssSession(req);
  if (!sess) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!sess.employeeId) return res.status(403).json({ success: false, message: 'Account not linked to an employee.' });

  try {
    if (req.query.id) {
      const id = parseInt(req.query.id as string);
      const ps = await db('hr_payslips as ps')
        .leftJoin('hr_payroll_periods as pe', 'pe.id', 'ps.period_id')
        .select('ps.*', 'pe.name as period_name', 'pe.month as period_month', 'pe.year as period_year', 'pe.pay_date as period_pay_date')
        .where('ps.id', id).andWhere('ps.employee_id', sess.employeeId)
        .first();
      if (!ps) return res.status(404).json({ success: false, message: 'Payslip not found.' });
      // Only allow viewing once the period is Approved/Paid (not draft)
      const cfgRows = await db('config_settings').where('module', 'general').select('key', 'value');
      const cfg: Record<string, string> = {};
      for (const r of cfgRows) cfg[r.key] = r.value || '';
      const logo = await db('config_settings').where({ module: 'branding', key: 'logo' }).first();
      const company = {
        name: cfg.site_name || 'Company', reg_no: cfg.reg_no || '', address: cfg.address || '',
        phone: cfg.phone || '', email: cfg.support_email || cfg.admin_email || '', logo: logo?.value || '',
      };
      let earnings: any = null;
      try { earnings = ps.earnings_json ? JSON.parse(ps.earnings_json) : null; } catch { earnings = null; }
      return res.status(200).json({ success: true, data: { ...ps, earnings, company } });
    }

    // list — only payslips from periods that are Approved/Paid/Closed (hide drafts)
    const rows = await db('hr_payslips as ps')
      .leftJoin('hr_payroll_periods as pe', 'pe.id', 'ps.period_id')
      .select('ps.id', 'ps.payslip_no', 'ps.gross_salary', 'ps.total_deductions', 'ps.net_salary', 'ps.status',
        'pe.name as period_name', 'pe.year as period_year', 'pe.status as period_status')
      .where('ps.employee_id', sess.employeeId)
      .whereIn('pe.status', ['Approved', 'Paid', 'Closed'])
      .orderBy('ps.id', 'desc');
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
