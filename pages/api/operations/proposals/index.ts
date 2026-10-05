import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

const TABLE = 'ops_proposals';
const num = (v: any) => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? null : n; };
const cid = (v: any) => { const n = parseInt(String(v)); return isNaN(n) ? null : n; };
const validDoc = (v: any) => (typeof v === 'string' && v.startsWith('data:') && v.length < 18_000_000) ? v : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'ops.business_dev.proposals'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(`${TABLE} as p`)
        .leftJoin('ops_clients as c', 'p.client_id', 'c.id')
        .select('p.id', 'p.ref_no', 'p.title', 'p.client_id', 'p.client_name', 'p.contact_person', 'p.contact_email',
          'p.value', 'p.issued_date', 'p.valid_until', 'p.status', 'p.sent_at', 'p.sent_to', 'p.doc_name',
          'c.company as client_company',
          db.raw("(p.doc_data LIKE 'data:%') AS has_doc"))
        .orderBy('p.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.title?.trim()) return res.status(400).json({ success: false, message: 'Proposal title is required.' });
    try {
      const doc = validDoc(b.doc_data);
      const mime = doc ? ((String(doc).match(/^data:([^;]+);/) || [])[1] || 'application/octet-stream') : null;
      const [id] = await db(TABLE).insert({
        ref_no: b.ref_no?.trim() || null, title: b.title.trim(), client_id: cid(b.client_id),
        client_name: b.client_name?.trim() || null, contact_person: b.contact_person?.trim() || null,
        contact_email: b.contact_email?.trim() || null, lead_id: cid(b.lead_id),
        summary: b.summary?.trim() || null, scope: b.scope?.trim() || null, value: num(b.value),
        issued_date: b.issued_date || null, valid_until: b.valid_until || null,
        status: b.status || 'Draft', notes: b.notes?.trim() || null,
        doc_data: doc, doc_name: doc ? (b.doc_name?.trim() || 'proposal.pdf') : null, doc_mime: mime,
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
