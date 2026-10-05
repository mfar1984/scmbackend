import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

const TABLE = 'ops_leads';
const num = (v: any) => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? null : n; };
const cid = (v: any) => { const n = parseInt(String(v)); return isNaN(n) ? null : n; };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'ops.business_dev.leads'))) return;
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  if (req.method === 'GET') {
    try {
      const l = await db(`${TABLE} as l`).leftJoin('ops_clients as c', 'l.client_id', 'c.id')
        .select('l.*', 'c.company as client_company').where('l.id', id).first();
      if (!l) return res.status(404).json({ success: false, message: 'Lead not found.' });
      return res.status(200).json({ success: true, data: l });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const b = req.body || {};
    try {
      const exists = await db(TABLE).where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Lead not found.' });
      const upd: Record<string, any> = {};
      if (b.title !== undefined) upd.title = b.title?.trim() || exists.title;
      if (b.client_id !== undefined) upd.client_id = cid(b.client_id);
      if (b.company !== undefined) upd.company = b.company?.trim() || null;
      if (b.contact_person !== undefined) upd.contact_person = b.contact_person?.trim() || null;
      if (b.email !== undefined) upd.email = b.email?.trim() || null;
      if (b.phone !== undefined) upd.phone = b.phone?.trim() || null;
      if (b.source !== undefined) upd.source = b.source || null;
      if (b.estimated_value !== undefined) upd.estimated_value = num(b.estimated_value);
      if (b.stage !== undefined) upd.stage = b.stage;
      if (b.assigned_to !== undefined) upd.assigned_to = b.assigned_to?.trim() || null;
      if (b.next_follow_up !== undefined) upd.next_follow_up = b.next_follow_up || null;
      if (b.description !== undefined) upd.description = b.description?.trim() || null;
      if (b.lost_reason !== undefined) upd.lost_reason = b.lost_reason?.trim() || null;
      await db(TABLE).where({ id }).update(upd);
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Lead not found.' });
      await recycleFromReq(req, { moduleKey: 'ops.business_dev.leads', moduleLabel: 'Leads', table: TABLE, id, label: `Lead: ${pickLabel(row, ['title', 'company'], id)}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
