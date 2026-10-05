import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

const TABLE = 'ops_proposals';
const num = (v: any) => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? null : n; };
const cid = (v: any) => { const n = parseInt(String(v)); return isNaN(n) ? null : n; };
const validDoc = (v: any) => (typeof v === 'string' && v.startsWith('data:') && v.length < 18_000_000) ? v : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'ops.business_dev.proposals'))) return;
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  // serve attached proposal document: ?doc=1
  if (req.method === 'GET' && req.query.doc) {
    try {
      const row = await db(TABLE).where({ id }).select('doc_data', 'doc_name', 'doc_mime').first();
      if (!row?.doc_data || !String(row.doc_data).startsWith('data:')) return res.status(404).send('Not found.');
      const m = String(row.doc_data).match(/^data:([^;]+);base64,([\s\S]*)$/);
      if (!m) return res.status(422).send('Invalid.');
      const buf = Buffer.from(m[2], 'base64');
      res.setHeader('Content-Type', row.doc_mime || m[1]);
      res.setHeader('Content-Disposition', `inline; filename="${(row.doc_name || 'proposal.pdf').replace(/"/g, '')}"`);
      res.setHeader('Content-Length', buf.length);
      return res.status(200).send(buf);
    } catch { return res.status(500).send('Error.'); }
  }

  if (req.method === 'GET') {
    try {
      const p = await db(`${TABLE} as p`).leftJoin('ops_clients as c', 'p.client_id', 'c.id')
        .select('p.*', 'c.company as client_company', 'c.email as client_email_db').where('p.id', id).first();
      if (!p) return res.status(404).json({ success: false, message: 'Proposal not found.' });
      const has_doc = !!p.doc_data;
      delete p.doc_data;
      return res.status(200).json({ success: true, data: { ...p, has_doc } });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const b = req.body || {};
    try {
      const exists = await db(TABLE).where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Proposal not found.' });
      const upd: Record<string, any> = {};
      if (b.ref_no !== undefined) upd.ref_no = b.ref_no?.trim() || null;
      if (b.title !== undefined) upd.title = b.title?.trim() || exists.title;
      if (b.client_id !== undefined) upd.client_id = cid(b.client_id);
      if (b.client_name !== undefined) upd.client_name = b.client_name?.trim() || null;
      if (b.contact_person !== undefined) upd.contact_person = b.contact_person?.trim() || null;
      if (b.contact_email !== undefined) upd.contact_email = b.contact_email?.trim() || null;
      if (b.lead_id !== undefined) upd.lead_id = cid(b.lead_id);
      if (b.summary !== undefined) upd.summary = b.summary?.trim() || null;
      if (b.scope !== undefined) upd.scope = b.scope?.trim() || null;
      if (b.value !== undefined) upd.value = num(b.value);
      if (b.issued_date !== undefined) upd.issued_date = b.issued_date || null;
      if (b.valid_until !== undefined) upd.valid_until = b.valid_until || null;
      if (b.status !== undefined) upd.status = b.status;
      if (b.notes !== undefined) upd.notes = b.notes?.trim() || null;
      if (b.doc_data !== undefined) {
        const doc = validDoc(b.doc_data);
        upd.doc_data = doc;
        upd.doc_name = doc ? (b.doc_name?.trim() || 'proposal.pdf') : null;
        upd.doc_mime = doc ? ((String(doc).match(/^data:([^;]+);/) || [])[1] || 'application/octet-stream') : null;
      }
      await db(TABLE).where({ id }).update(upd);
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Proposal not found.' });
      await recycleFromReq(req, { moduleKey: 'ops.business_dev.proposals', moduleLabel: 'Proposals', table: TABLE, id, label: `Proposal: ${pickLabel(row, ['title', 'ref_no'], id)}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
