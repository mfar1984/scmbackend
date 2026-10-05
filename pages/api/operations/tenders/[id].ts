import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasAnyPermission } from '@/lib/serverPermissions';
import { recycleDelete, pickLabel } from '@/lib/recycleBin';

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };
const TABLE = 'ops_tenders';
const num = (v: any) => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? null : n; };
const validDoc = (v: any) => (typeof v === 'string' && v.startsWith('data:') && v.length < 18_000_000) ? v : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  // Edits can come from List / Evaluation / Awards tabs; deletion is a List action.
  if (req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const perm = req.method === 'DELETE' ? 'Delete' : 'Update';
    const mods = req.method === 'DELETE'
      ? ['ops.tender.list']
      : ['ops.tender.list', 'ops.tender.evaluation', 'ops.tender.awards'];
    if (!(await hasAnyPermission(auth, mods, perm))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
  }

  // serve compiled submission PDF: ?compiled=1
  if (req.method === 'GET' && req.query.compiled) {
    try {
      const row = await db(TABLE).where({ id }).select('compiled_doc', 'compiled_doc_name').first();
      const dataUrl = row?.compiled_doc;
      if (!dataUrl || !String(dataUrl).startsWith('data:')) return res.status(404).send('Not found.');
      const m = String(dataUrl).match(/^data:([^;]+);base64,([\s\S]*)$/);
      if (!m) return res.status(422).send('Invalid.');
      const buf = Buffer.from(m[2], 'base64');
      res.setHeader('Content-Type', m[1]);
      res.setHeader('Content-Disposition', `inline; filename="${(row.compiled_doc_name || 'tender-submission.pdf').replace(/"/g, '')}"`);
      res.setHeader('Content-Length', buf.length);
      return res.status(200).send(buf);
    } catch { return res.status(500).send('Error.'); }
  }

  if (req.method === 'GET') {
    try {
      const t = await db(TABLE).where({ id }).first();
      if (!t) return res.status(404).json({ success: false, message: 'Tender not found.' });
      const has_compiled = !!t.compiled_doc;
      delete t.compiled_doc;
      const documents = await db('ops_tender_documents')
        .where({ tender_id: id })
        .select('id', 'doc_type', 'file_name', 'mime_type', 'uploaded_at')
        .orderBy('id', 'asc');
      return res.status(200).json({ success: true, data: { ...t, has_compiled, documents } });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const b = req.body || {};
    try {
      const exists = await db(TABLE).where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Tender not found.' });

      const upd: Record<string, any> = {};
      // core
      if (b.name !== undefined) upd.name = b.name?.trim() || null;
      if (b.ref_no !== undefined) upd.ref_no = b.ref_no?.trim() || exists.ref_no;
      if (b.agency !== undefined) upd.agency = b.agency?.trim() || null;
      if (b.category !== undefined) upd.category = b.category || null;
      if (b.procurement_method !== undefined) upd.procurement_method = b.procurement_method || null;
      if (b.description !== undefined) upd.description = b.description?.trim() || null;
      if (b.closing_date !== undefined) upd.closing_date = b.closing_date || null;
      if (b.closing_time !== undefined) upd.closing_time = b.closing_time || null;
      if (b.briefing_date !== undefined) upd.briefing_date = b.briefing_date || null;
      if (b.estimated_value !== undefined) upd.estimated_value = num(b.estimated_value) ?? 0;
      if (b.document_fee !== undefined) upd.document_fee = num(b.document_fee);
      if (b.tender_deposit !== undefined) upd.tender_deposit = num(b.tender_deposit);
      if (b.assigned_to !== undefined) upd.assigned_to = b.assigned_to?.trim() || null;
      // agency contact
      if (b.contact_person !== undefined) upd.contact_person = b.contact_person?.trim() || null;
      if (b.contact_designation !== undefined) upd.contact_designation = b.contact_designation?.trim() || null;
      if (b.contact_phone !== undefined) upd.contact_phone = b.contact_phone?.trim() || null;
      if (b.contact_email !== undefined) upd.contact_email = b.contact_email?.trim() || null;
      if (b.agency_address !== undefined) upd.agency_address = b.agency_address?.trim() || null;
      if (b.stage !== undefined) upd.stage = b.stage;
      if (b.submitted_date !== undefined) upd.submitted_date = b.submitted_date || null;
      // evaluation
      if (b.eval_type !== undefined) upd.eval_type = b.eval_type || null;
      if (b.eval_officer !== undefined) upd.eval_officer = b.eval_officer?.trim() || null;
      if (b.eval_status !== undefined) upd.eval_status = b.eval_status || null;
      if (b.technical_score !== undefined) upd.technical_score = num(b.technical_score);
      if (b.financial_score !== undefined) upd.financial_score = num(b.financial_score);
      if (b.eval_remarks !== undefined) upd.eval_remarks = b.eval_remarks?.trim() || null;
      // award
      if (b.contract_no !== undefined) upd.contract_no = b.contract_no?.trim() || null;
      if (b.actual_value !== undefined) upd.actual_value = num(b.actual_value);
      if (b.award_date !== undefined) upd.award_date = b.award_date || null;
      if (b.project_start !== undefined) upd.project_start = b.project_start || null;
      if (b.project_end !== undefined) upd.project_end = b.project_end || null;
      if (b.award_status !== undefined) upd.award_status = b.award_status || null;
      // archive
      if (b.outcome !== undefined) upd.outcome = b.outcome || null;
      if (b.outcome_reason !== undefined) upd.outcome_reason = b.outcome_reason?.trim() || null;
      if (b.reference_price !== undefined) upd.reference_price = num(b.reference_price);
      // compiled doc
      if (b.compiled_doc !== undefined) {
        upd.compiled_doc = validDoc(b.compiled_doc);
        upd.compiled_doc_name = b.compiled_doc_name?.trim() || null;
      }

      await db(TABLE).where({ id }).update(upd);
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Tender not found.' });
      const documents = await db('ops_tender_documents').where({ tender_id: id });
      const auth = await getAuth(req);
      await recycleDelete({
        moduleKey: 'ops.tender.list', moduleLabel: 'Operations Tender', table: TABLE, id,
        label: `Tender: ${pickLabel(row, ['name', 'ref_no'], id)}`,
        children: [{ table: 'ops_tender_documents', rows: documents }],
        auth, req,
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
