import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrudAny } from '@/lib/serverPermissions';

const TABLE = 'ops_vendors';
const PERMS = ['ops.procurement', 'web.resources.vendors'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrudAny(req, res, PERMS))) return;
  if (req.method === 'GET') {
    // ?available=1 → approved/active supplier registrations not yet imported as vendors
    if (req.query.available) {
      try {
        const imported = await db(TABLE).whereNotNull('supplier_id').pluck('supplier_id');
        const rows = await db('supplier_registrations')
          .whereIn('status', ['Approved', 'Active'])
          .modify(qb => { if (imported.length) qb.whereNotIn('id', imported); })
          .select('id', 'company_name', 'services', 'email', 'office_phone', 'mobile', 'director_name', 'address', 'state')
          .orderBy('company_name', 'asc');
        return res.status(200).json({ success: true, data: rows });
      } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
    }
    try {
      const rows = await db(TABLE).select('*').orderBy('name', 'asc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    // import from a supplier registration
    if (b.supplier_id) {
      try {
        const s = await db('supplier_registrations').where({ id: parseInt(b.supplier_id) }).first();
        if (!s) return res.status(404).json({ success: false, message: 'Supplier registration not found.' });
        const dup = await db(TABLE).where({ supplier_id: s.id }).first();
        if (dup) return res.status(409).json({ success: false, message: 'This supplier is already a vendor.' });
        const [id] = await db(TABLE).insert({
          source: 'Registration', supplier_id: s.id, name: s.company_name,
          category: s.services ? String(s.services).split(',')[0].trim() : null,
          contact_person: s.director_name || null, phone: s.office_phone || s.mobile || null,
          fax: s.fax || null,
          email: s.email || null, address: [s.address, s.city, s.state].filter(Boolean).join(', ') || null,
          state: s.state || null,
          status: 'Active',
        });
        return res.status(201).json({ success: true, id });
      } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
    }
    // manual create
    if (!b.name?.trim()) return res.status(400).json({ success: false, message: 'Vendor name is required.' });
    try {
      const [id] = await db(TABLE).insert({
        source: 'Manual', name: b.name.trim(), category: b.category?.trim() || null,
        manufacturer: b.manufacturer?.trim() || null,
        contact_person: b.contact_person?.trim() || null, phone: b.phone?.trim() || null,
        fax: b.fax?.trim() || null,
        email: b.email?.trim() || null, address: b.address?.trim() || null,
        state: b.state?.trim() || null,
        expiry_date: b.expiry_date?.trim() || null,
        status: b.status || 'Active',
        published: b.published === false || b.published === 0 ? 0 : 1,
        notes: b.notes?.trim() || null,
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
