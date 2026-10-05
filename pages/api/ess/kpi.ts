import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getEssSession } from '@/lib/essAuth';

// Staff's own KPI results (read-only).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const sess = await getEssSession(req);
  if (!sess) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!sess.employeeId) return res.status(403).json({ success: false, message: 'Account not linked to an employee.' });

  try {
    const rows = await db('hr_kpi_results as r')
      .leftJoin('hr_kpi_periods as p', 'p.id', 'r.period_id')
      .leftJoin('hr_kpi_assignments as a', 'a.id', 'r.assignment_id')
      .leftJoin('hr_kpi_templates as t', 't.id', 'a.template_id')
      .select('r.id', 'r.final_score', 'r.grade', 'r.grade_label', 'r.reviewer_remarks', 'r.created_at',
        'p.name as period_name', 't.name as template_name')
      .where('r.employee_id', sess.employeeId)
      .orderBy('r.id', 'desc');
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
