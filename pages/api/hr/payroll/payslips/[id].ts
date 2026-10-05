import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Single payslip with full detail + period + company info (for view & A5 print).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  try {
    const ps = await db('hr_payslips as ps')
      .leftJoin('hr_payroll_periods as pe', 'pe.id', 'ps.period_id')
      .select('ps.*', 'pe.name as period_name', 'pe.month as period_month', 'pe.year as period_year', 'pe.pay_date as period_pay_date')
      .where('ps.id', id)
      .first();
    if (!ps) return res.status(404).json({ success: false, message: 'Payslip not found.' });

    // Company info from config_settings (general module)
    const cfgRows = await db('config_settings').where('module', 'general').select('key', 'value');
    const cfg: Record<string, string> = {};
    for (const r of cfgRows) cfg[r.key] = r.value || '';

    // Branding logo (optional)
    const logo = await db('config_settings').where({ module: 'branding', key: 'logo' }).first();

    const company = {
      name: cfg.site_name || 'Company',
      reg_no: cfg.reg_no || '',
      address: cfg.address || '',
      phone: cfg.phone || '',
      email: cfg.support_email || cfg.admin_email || '',
      logo: logo?.value || '',
    };

    let earnings: any = null;
    try { earnings = ps.earnings_json ? JSON.parse(ps.earnings_json) : null; } catch { earnings = null; }

    return res.status(200).json({ success: true, data: { ...ps, earnings, company } });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
