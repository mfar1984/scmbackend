import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';
import { logAudit } from '@/lib/logger';

const TABLE = 'ops_clients';
const num = (v: any) => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? null : n; };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'ops.business_dev.clients'))) return;
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  if (req.method === 'GET') {
    try {
      const c = await db(TABLE).where({ id }).first();
      if (!c) return res.status(404).json({ success: false, message: 'Client not found.' });
      const leads = await db('ops_leads').where({ client_id: id }).select('id', 'title', 'stage', 'estimated_value', 'next_follow_up').orderBy('id', 'desc');
      const proposals = await db('ops_proposals').where({ client_id: id }).select('id', 'title', 'status', 'value', 'issued_date').orderBy('id', 'desc');
      return res.status(200).json({ success: true, data: { ...c, leads, proposals } });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const b = req.body || {};
    try {
      const exists = await db(TABLE).where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Client not found.' });
      const upd: Record<string, any> = {};
      if (b.company !== undefined) upd.company = b.company?.trim() || exists.company;
      if (b.industry !== undefined) upd.industry = b.industry?.trim() || null;
      if (b.sector !== undefined) upd.sector = b.sector || null;
      if (b.contact_person !== undefined) upd.contact_person = b.contact_person?.trim() || null;
      if (b.designation !== undefined) upd.designation = b.designation?.trim() || null;
      if (b.email !== undefined) upd.email = b.email?.trim() || null;
      if (b.phone !== undefined) upd.phone = b.phone?.trim() || null;
      if (b.address !== undefined) upd.address = b.address?.trim() || null;
      if (b.website !== undefined) upd.website = b.website?.trim() || null;
      if (b.potential_value !== undefined) upd.potential_value = num(b.potential_value);
      if (b.status !== undefined) upd.status = b.status;
      if (b.last_contact !== undefined) upd.last_contact = b.last_contact || null;
      if (b.notes !== undefined) upd.notes = b.notes?.trim() || null;
      await db(TABLE).where({ id }).update(upd);
      await logAudit(req, {
        action: 'UPDATE', module: 'Clients',
        target: `Client: ${exists.company || `#${id}`}`,
        description: `Updated client ${exists.company || `#${id}`}`,
        before: exists, after: { ...exists, ...upd },
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Client not found.' });
      await recycleFromReq(req, { moduleKey: 'ops.business_dev.clients', moduleLabel: 'Clients', table: TABLE, id, label: `Client: ${pickLabel(row, ['company'], id)}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
