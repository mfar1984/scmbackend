import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getEssSession } from '@/lib/essAuth';
import { notifyHrSubmission } from '@/lib/notify';
import { logAudit } from '@/lib/logger';

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
  const sess = await getEssSession(req);
  if (!sess) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!sess.employeeId) return res.status(403).json({ success: false, message: 'Your account is not linked to an employee record. Contact HR.' });

  // serve own leave supporting document: ?doc=<leaveId>
  if (req.method === 'GET' && req.query.doc) {
    try {
      const lid = parseInt(req.query.doc as string);
      const row = await db('hr_leave_applications').where({ id: lid, employee_id: sess.employeeId }).select('document', 'document_name').first();
      const dataUrl = row?.document;
      if (!dataUrl || !String(dataUrl).startsWith('data:')) return res.status(404).send('Not found.');
      const m = String(dataUrl).match(/^data:([^;]+);base64,([\s\S]*)$/);
      if (!m) return res.status(422).send('Invalid.');
      const buf = Buffer.from(m[2], 'base64');
      res.setHeader('Content-Type', m[1]);
      res.setHeader('Content-Disposition', `inline; filename="${(row.document_name || 'document').replace(/"/g, '')}"`);
      res.setHeader('Content-Length', buf.length);
      return res.status(200).send(buf);
    } catch { return res.status(500).send('Error.'); }
  }

  if (req.method === 'GET') {
    try {
      const rows = await db('hr_leave_applications as a')
        .select('a.*', 't.name as leave_type_name', 't.color as leave_type_color',
          db.raw("(a.document LIKE 'data:%') AS has_document"))
        .leftJoin('hr_leave_types as t', 't.id', 'a.leave_type_id')
        .where('a.employee_id', sess.employeeId)
        .orderBy('a.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.leave_type_id) return res.status(400).json({ success: false, message: 'Leave type is required.' });
    try {
      const lt = await db('hr_leave_types').where({ id: b.leave_type_id }).first();
      // gender eligibility
      if (lt && lt.gender_eligibility && lt.gender_eligibility !== 'All') {
        const emp = await db('hr_employees').where({ id: sess.employeeId }).select('gender').first();
        if (emp?.gender && emp.gender !== lt.gender_eligibility) {
          return res.status(400).json({ success: false, message: `${lt.name} is only available for ${lt.gender_eligibility} employees.` });
        }
      }
      // required supporting document
      const doc = validDoc(b.document);
      if (lt && lt.requires_document && !doc) {
        return res.status(400).json({ success: false, message: `${lt.name} requires a supporting document (e.g. medical certificate).` });
      }
      // balance enforcement for finite entitlements
      const entitlement = Number(lt?.days_per_year) || 0;
      if (entitlement > 0) {
        const year = new Date(b.start_date || Date.now()).getFullYear();
        const used = await db('hr_leave_applications')
          .where({ employee_id: sess.employeeId, leave_type_id: b.leave_type_id })
          .whereIn('status', ['Approved', 'Pending'])
          .whereBetween('start_date', [`${year}-01-01`, `${year}-12-31`])
          .sum({ total: 'days' }).first();
        const usedDays = parseFloat(used?.total) || 0;
        const remaining = entitlement - usedDays;
        if ((parseFloat(b.days) || 0) > remaining) {
          return res.status(400).json({ success: false, message: `Insufficient balance. You have ${remaining} day(s) of ${lt.name} left this year.` });
        }
      }
      const result = await db.transaction(async (trx) => {
        const reference_no = await nextRef(trx);
        const [id] = await trx('hr_leave_applications').insert({
          reference_no, employee_id: sess.employeeId,
          leave_type_id: b.leave_type_id || null,
          start_date: b.start_date || null, end_date: b.end_date || null,
          days: b.days || null, reason: b.reason?.trim() || null, remarks: b.remarks?.trim() || null,
          document: doc, document_name: b.document_name?.trim() || null,
          status: 'Pending',
        });
        return { id, reference_no };
      });
      const lt2 = await db('hr_leave_types').where({ id: b.leave_type_id }).select('name').first();
      await notifyHrSubmission({ type: 'leave', employeeId: sess.employeeId, refId: result.id, referenceNo: result.reference_no, detail: `${lt2?.name || 'Leave'}${b.days ? ` · ${b.days} day(s)` : ''}` });
      await logAudit(req, { action: 'CREATE', module: 'Leave', target: `Leave: ${result.reference_no}`, description: `Submitted leave application (${lt2?.name || 'Leave'})` });
      return res.status(201).json({ success: true, ...result });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
