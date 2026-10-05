import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';

const TABLE = 'hr_kpi_assignments';

async function nextRef(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `KPI-${year}-`;
  const last = await db(TABLE).where('reference_no', 'like', `${prefix}%`).orderBy('id', 'desc').first();
  let seq = 1;
  if (last?.reference_no) { const n = parseInt(String(last.reference_no).split('-').pop() || '0'); if (!isNaN(n)) seq = n + 1; }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.kpi.assignments'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(`${TABLE} as a`)
        .select('a.*',
          'e.full_name as employee_name', 'e.employee_id as employee_code',
          'p.name as period_name', 't.name as template_name',
          'u.name as reviewer_name',
          'r.final_score', 'r.grade', 'r.grade_label')
        .leftJoin('hr_employees as e', 'e.id', 'a.employee_id')
        .leftJoin('hr_kpi_periods as p', 'p.id', 'a.period_id')
        .leftJoin('hr_kpi_templates as t', 't.id', 'a.template_id')
        .leftJoin('users as u', 'u.id', 'a.reviewer_user_id')
        .leftJoin('hr_kpi_results as r', 'r.assignment_id', 'a.id')
        .orderBy('a.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.period_id) return res.status(400).json({ success: false, message: 'KPI period is required.' });
    if (!b.template_id) return res.status(400).json({ success: false, message: 'Template is required.' });
    if (!b.employee_id) return res.status(400).json({ success: false, message: 'Employee is required.' });
    try {
      const dup = await db(TABLE).where({ period_id: b.period_id, employee_id: b.employee_id }).first();
      if (dup) return res.status(409).json({ success: false, message: 'This employee already has an assignment for the period.' });
      const reference_no = await nextRef();
      const [id] = await db(TABLE).insert({
        reference_no, period_id: b.period_id, template_id: b.template_id,
        employee_id: b.employee_id, reviewer_user_id: b.reviewer_user_id || null, status: 'Pending',
      });
      return res.status(201).json({ success: true, id, reference_no });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
