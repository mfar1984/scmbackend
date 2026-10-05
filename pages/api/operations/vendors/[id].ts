import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrudAny } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

const TABLE = 'ops_vendors';
const PERMS = ['ops.procurement', 'web.resources.vendors'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrudAny(req, res, PERMS))) return;
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  if (req.method === 'GET') {
    try {
      const v = await db(TABLE).where({ id }).first();
      if (!v) return res.status(404).json({ success: false, message: 'Vendor not found.' });
      // Return expiry_date as a plain YYYY-MM-DD (DB uses +08:00; avoid TZ shift).
      if (v.expiry_date instanceof Date) {
        v.expiry_date = new Date(v.expiry_date.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
      }
      return res.status(200).json({ success: true, data: v });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const b = req.body || {};
    try {
      const exists = await db(TABLE).where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Vendor not found.' });
      const upd: Record<string, any> = {};
      if (b.name !== undefined) upd.name = b.name?.trim() || exists.name;
      if (b.category !== undefined) upd.category = b.category?.trim() || null;
      if (b.manufacturer !== undefined) upd.manufacturer = b.manufacturer?.trim() || null;
      if (b.contact_person !== undefined) upd.contact_person = b.contact_person?.trim() || null;
      if (b.phone !== undefined) upd.phone = b.phone?.trim() || null;
      if (b.fax !== undefined) upd.fax = b.fax?.trim() || null;
      if (b.email !== undefined) upd.email = b.email?.trim() || null;
      if (b.address !== undefined) upd.address = b.address?.trim() || null;
      if (b.state !== undefined) upd.state = b.state?.trim() || null;
      if (b.expiry_date !== undefined) upd.expiry_date = b.expiry_date?.trim() || null;
      if (b.status !== undefined) upd.status = b.status;
      if (b.published !== undefined) upd.published = b.published ? 1 : 0;
      if (b.notes !== undefined) upd.notes = b.notes?.trim() || null;
      await db(TABLE).where({ id }).update(upd);
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Vendor not found.' });
      await recycleFromReq(req, { moduleKey: 'ops.procurement', moduleLabel: 'Procurement Vendors', table: TABLE, id, label: `Vendor: ${pickLabel(row, ['name'], id)}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
