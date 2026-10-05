import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission } from '@/lib/serverPermissions';

const TABLE = 'ops_tenders';
const num = (v: any) => { const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? 0 : n; };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST' && !(await requirePermission(req, res, 'ops.tender.list', 'Create'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(`${TABLE} as t`)
        .select('t.*', db.raw('(SELECT COUNT(*) FROM ops_tender_documents d WHERE d.tender_id = t.id) AS doc_count'),
          db.raw("(t.compiled_doc LIKE 'data:%') AS has_compiled"))
        .orderBy('t.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.name?.trim()) return res.status(400).json({ success: false, message: 'Tender name is required.' });
    if (!b.ref_no?.trim()) return res.status(400).json({ success: false, message: 'Reference number is required.' });
    try {
      const dup = await db(TABLE).where({ ref_no: b.ref_no.trim() }).first();
      if (dup) return res.status(409).json({ success: false, message: 'A tender with this reference number already exists.' });
      const [id] = await db(TABLE).insert({
        ref_no: b.ref_no.trim(), name: b.name.trim(), agency: b.agency?.trim() || null,
        category: b.category || null, procurement_method: b.procurement_method || null,
        description: b.description?.trim() || null, closing_date: b.closing_date || null,
        closing_time: b.closing_time || null, briefing_date: b.briefing_date || null,
        estimated_value: num(b.estimated_value), document_fee: b.document_fee ? num(b.document_fee) : null,
        tender_deposit: b.tender_deposit ? num(b.tender_deposit) : null,
        assigned_to: b.assigned_to?.trim() || null,
        contact_person: b.contact_person?.trim() || null, contact_designation: b.contact_designation?.trim() || null,
        contact_phone: b.contact_phone?.trim() || null, contact_email: b.contact_email?.trim() || null,
        agency_address: b.agency_address?.trim() || null,
        stage: b.stage || 'Draft',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
