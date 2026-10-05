import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';

const TABLE = 'ops_leads';
const num = (v: any) => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? null : n; };
const cid = (v: any) => { const n = parseInt(String(v)); return isNaN(n) ? null : n; };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'ops.business_dev.leads'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(`${TABLE} as l`)
        .leftJoin('ops_clients as c', 'l.client_id', 'c.id')
        .select('l.*', 'c.company as client_company')
        .orderBy('l.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.title?.trim()) return res.status(400).json({ success: false, message: 'Lead title is required.' });
    try {
      const [id] = await db(TABLE).insert({
        title: b.title.trim(), client_id: cid(b.client_id), company: b.company?.trim() || null,
        contact_person: b.contact_person?.trim() || null, email: b.email?.trim() || null, phone: b.phone?.trim() || null,
        source: b.source || 'Referral', estimated_value: num(b.estimated_value), stage: b.stage || 'New',
        assigned_to: b.assigned_to?.trim() || null, next_follow_up: b.next_follow_up || null,
        description: b.description?.trim() || null, lost_reason: b.lost_reason?.trim() || null,
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
