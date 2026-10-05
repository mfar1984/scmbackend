import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getEssSession } from '@/lib/essAuth';
import { notifyHrSubmission } from '@/lib/notify';
import { logAudit } from '@/lib/logger';

async function nextRef(trx: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OT-${year}-`;
  const last = await trx('hr_overtime_applications').where('reference_no', 'like', `${prefix}%`).orderBy('id', 'desc').first();
  let seq = 1;
  if (last?.reference_no) { const n = parseInt(String(last.reference_no).split('-').pop() || '0'); if (!isNaN(n)) seq = n + 1; }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sess = await getEssSession(req);
  if (!sess) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!sess.employeeId) return res.status(403).json({ success: false, message: 'Account not linked to an employee.' });

  if (req.method === 'GET') {
    try {
      const rows = await db('hr_overtime_applications as o')
        .leftJoin('hr_overtime_rates as r', 'r.id', 'o.ot_rate_id')
        .select('o.*', 'r.name as rate_name', 'r.multiplier')
        .where('o.employee_id', sess.employeeId)
        .orderBy('o.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.ot_date) return res.status(400).json({ success: false, message: 'Date is required.' });
    try {
      const result = await db.transaction(async (trx) => {
        const reference_no = await nextRef(trx);
        const [id] = await trx('hr_overtime_applications').insert({
          reference_no, employee_id: sess.employeeId,
          ot_rate_id: b.ot_rate_id || null, ot_date: b.ot_date || null,
          hours: b.hours || null, start_time: b.start_time || null, end_time: b.end_time || null,
          day_type: b.day_type || null, project_name: b.project_name?.trim() || null,
          reason: b.reason?.trim() || null, remarks: b.remarks?.trim() || null, status: 'Pending',
        });
        return { id, reference_no };
      });
      await notifyHrSubmission({ type: 'overtime', employeeId: sess.employeeId, refId: result.id, referenceNo: result.reference_no, detail: `${b.ot_date || ''}${b.hours ? ` · ${b.hours}h` : ''}`.trim() || undefined });
      await logAudit(req, { action: 'CREATE', module: 'Overtime', target: `Overtime: ${result.reference_no}`, description: `Submitted overtime application` });
      return res.status(201).json({ success: true, ...result });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
