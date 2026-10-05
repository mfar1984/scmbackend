import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { notifyHrSubmission } from '@/lib/notify';
import { requirePermission } from '@/lib/serverPermissions';

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };
const validDoc = (v: any) => (typeof v === 'string' && v.startsWith('data:') && v.length < 8_000_000) ? v : null;

async function nextRef(trx: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `LV-${year}-`;
  const last = await trx('hr_leave_applications').where('reference_no', 'like', `${prefix}%`).orderBy('id', 'desc').first();
  let seq = 1;
  if (last?.reference_no) { const n = parseInt(String(last.reference_no).split('-').pop() || '0'); if (!isNaN(n)) seq = n + 1; }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db('hr_leave_applications as a')
        .select('a.*', 'e.full_name as employee_name', 'e.employee_id as employee_code', 't.name as leave_type_name',
          db.raw("(a.document LIKE 'data:%') AS has_document"))
        .leftJoin('hr_employees as e', 'e.id', 'a.employee_id')
        .leftJoin('hr_leave_types as t', 't.id', 'a.leave_type_id')
        .orderBy('a.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, 'hr.leave.application', 'Create'))) return;
    const b = req.body || {};
    if (!b.employee_id) return res.status(400).json({ success: false, message: 'Employee is required.' });
    try {
      // ── Gender eligibility check (server-side enforcement) ──
      let lt: any = null;
      if (b.leave_type_id) {
        lt = await db('hr_leave_types').where({ id: b.leave_type_id }).first();
        if (lt && lt.gender_eligibility && lt.gender_eligibility !== 'All') {
          const emp = await db('hr_employees').where({ id: b.employee_id }).select('gender', 'full_name').first();
          const empGender = emp?.gender || '';
          if (empGender && empGender !== lt.gender_eligibility) {
            return res.status(400).json({ success: false, message: `${lt.name} is only available for ${lt.gender_eligibility} employees.` });
          }
        }
      }
      // ── Required supporting document enforcement ──
      const doc = validDoc(b.document);
      if (lt && lt.requires_document && !doc) {
        return res.status(400).json({ success: false, message: `${lt.name} requires a supporting document.` });
      }
      const result = await db.transaction(async (trx) => {
        const reference_no = await nextRef(trx);
        const [id] = await trx('hr_leave_applications').insert({
          reference_no,
          employee_id: b.employee_id,
          leave_type_id: b.leave_type_id || null,
          start_date: b.start_date || null,
          end_date: b.end_date || null,
          days: b.days || null,
          reason: b.reason?.trim() || null,
          remarks: b.remarks?.trim() || null,
          document: doc,
          document_name: b.document_name?.trim() || null,
          status: 'Pending',
        });
        return { id, reference_no };
      });
      await notifyHrSubmission({ type: 'leave', employeeId: b.employee_id, refId: result.id, referenceNo: result.reference_no, detail: `${lt?.name || 'Leave'}${b.days ? ` · ${b.days} day(s)` : ''}` });
      return res.status(201).json({ success: true, ...result });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
