import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';

const TABLE = 'ops_clients';
const num = (v: any) => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? null : n; };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'ops.business_dev.clients'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(`${TABLE} as c`)
        .select('c.*',
          db.raw('(SELECT COUNT(*) FROM ops_leads l WHERE l.client_id = c.id) AS lead_count'),
          db.raw('(SELECT COUNT(*) FROM ops_proposals p WHERE p.client_id = c.id) AS proposal_count'))
        .orderBy('c.company', 'asc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.company?.trim()) return res.status(400).json({ success: false, message: 'Company name is required.' });
    try {
      const [id] = await db(TABLE).insert({
        company: b.company.trim(), industry: b.industry?.trim() || null, sector: b.sector || null,
        contact_person: b.contact_person?.trim() || null, designation: b.designation?.trim() || null,
        email: b.email?.trim() || null, phone: b.phone?.trim() || null, address: b.address?.trim() || null,
        website: b.website?.trim() || null, potential_value: num(b.potential_value),
        status: b.status || 'Prospect', last_contact: b.last_contact || null, notes: b.notes?.trim() || null,
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
