import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { notifyHrSubmission } from '@/lib/notify';
import { requirePermission } from '@/lib/serverPermissions';

async function nextRef(trx: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OT-${year}-`;
  const last = await trx('hr_overtime_applications').where('reference_no', 'like', `${prefix}%`).orderBy('id', 'desc').first();
  let seq = 1;
  if (last?.reference_no) { const n = parseInt(String(last.reference_no).split('-').pop() || '0'); if (!isNaN(n)) seq = n + 1; }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db('hr_overtime_applications as a')
        .select('a.*', 'e.full_name as employee_name', 'e.employee_id as employee_code', 'r.name as ot_rate_name', 'r.multiplier as ot_multiplier')
        .leftJoin('hr_employees as e', 'e.id', 'a.employee_id')
        .leftJoin('hr_overtime_rates as r', 'r.id', 'a.ot_rate_id')
        .orderBy('a.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, 'hr.overtime.application', 'Create'))) return;
    const b = req.body || {};
    if (!b.employee_id) return res.status(400).json({ success: false, message: 'Employee is required.' });
    try {
      const result = await db.transaction(async (trx) => {
        const reference_no = await nextRef(trx);
        const [id] = await trx('hr_overtime_applications').insert({
          reference_no,
          employee_id: b.employee_id,
          project_name: b.project_name?.trim() || null,
          ot_rate_id: b.ot_rate_id || null,
          ot_date: b.ot_date || null,
          start_time: b.start_time || null,
          end_time: b.end_time || null,
          hours: b.hours !== '' && b.hours != null ? b.hours : null,
          day_type: b.day_type || null,
          reason: b.reason?.trim() || null,
          remarks: b.remarks?.trim() || null,
          status: 'Pending',
        });
        return { id, reference_no };
      });
      await notifyHrSubmission({ type: 'overtime', employeeId: b.employee_id, refId: result.id, referenceNo: result.reference_no, detail: `${b.ot_date || ''}${b.hours ? ` · ${b.hours}h` : ''}`.trim() || undefined });
      return res.status(201).json({ success: true, ...result });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
