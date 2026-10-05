import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission } from '@/lib/serverPermissions';

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST' && !(await requirePermission(req, res, 'hr.kpi.results', 'Update'))) return;
  // ── GET: list all KPI results ──
  if (req.method === 'GET') {
    try {
      const rows = await db('hr_kpi_results as r')
        .select('r.*',
          'e.full_name as employee_name', 'e.employee_id as employee_code', 'e.basic_salary',
          'p.name as period_name', 'a.reference_no')
        .leftJoin('hr_employees as e', 'e.id', 'r.employee_id')
        .leftJoin('hr_kpi_periods as p', 'p.id', 'r.period_id')
        .leftJoin('hr_kpi_assignments as a', 'a.id', 'r.assignment_id')
        .orderBy('r.final_score', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // ── POST: generate a bonus from a KPI result (action: 'generate_bonus') ──
  if (req.method === 'POST') {
    const b = req.body || {};
    if (b.action !== 'generate_bonus') return res.status(400).json({ success: false, message: 'Unknown action.' });
    const resultId = parseInt(b.result_id);
    if (isNaN(resultId)) return res.status(400).json({ success: false, message: 'Invalid result.' });
    if (!b.period_id) return res.status(400).json({ success: false, message: 'Payroll period is required.' });
    try {
      const result = await db('hr_kpi_results as r')
        .select('r.*', 'e.basic_salary')
        .leftJoin('hr_employees as e', 'e.id', 'r.employee_id')
        .where('r.id', resultId).first();
      if (!result) return res.status(404).json({ success: false, message: 'Result not found.' });
      if (result.bonus_generated) return res.status(409).json({ success: false, message: 'Bonus already generated for this result.' });

      const basic = parseFloat(result.basic_salary) || 0;
      const mult = parseFloat(result.bonus_multiplier) || 0;
      const amount = r2(basic * mult);
      if (amount <= 0) return res.status(400).json({ success: false, message: 'Bonus amount is zero (check basic salary & grade multiplier).' });

      await db.transaction(async (trx) => {
        await trx('hr_bonuses').insert({
          employee_id: result.employee_id, period_id: b.period_id,
          name: 'Performance Bonus', bonus_type: 'Performance Bonus',
          kpi_result_id: resultId, amount, status: 'Approved',
          remarks: `Auto-generated from KPI grade ${result.grade} (${result.final_score}%)`,
        });
        await trx('hr_kpi_results').where({ id: resultId }).update({ bonus_generated: 1 });
      });
      return res.status(201).json({ success: true, amount });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
