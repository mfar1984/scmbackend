import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

const TABLE = 'hr_leave_types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE).orderBy('name', 'asc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const { name, code, color, days_per_year, paid, gender_eligibility, carry_forward, requires_approval, allow_half_day, requires_document, description, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required.' });
    try {
      const dup = await db(TABLE).where({ name: name.trim() }).first();
      if (dup) return res.status(409).json({ success: false, message: 'Leave type already exists.' });
      const [id] = await db(TABLE).insert({
        name: name.trim(), code: code?.trim() || null, color: color || '#3b82f6',
        days_per_year: days_per_year || 0,
        paid: paid || 'Paid',
        gender_eligibility: ['All', 'Male', 'Female'].includes(gender_eligibility) ? gender_eligibility : 'All',
        carry_forward: carry_forward ? 1 : 0,
        requires_approval: requires_approval ? 1 : 0, allow_half_day: allow_half_day ? 1 : 0,
        requires_document: requires_document ? 1 : 0,
        description: description?.trim() || null, status: status || 'Active',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const { name, code, color, days_per_year, paid, gender_eligibility, carry_forward, requires_approval, allow_half_day, requires_document, description, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required.' });
    try {
      await db(TABLE).where({ id }).update({
        name: name.trim(), code: code?.trim() || null, color: color || '#3b82f6',
        days_per_year: days_per_year || 0,
        paid: paid || 'Paid',
        gender_eligibility: ['All', 'Male', 'Female'].includes(gender_eligibility) ? gender_eligibility : 'All',
        carry_forward: carry_forward ? 1 : 0,
        requires_approval: requires_approval ? 1 : 0, allow_half_day: allow_half_day ? 1 : 0,
        requires_document: requires_document ? 1 : 0,
        description: description?.trim() || null, status: status || 'Active',
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      await recycleFromReq(req, { moduleKey: 'hr.leave.settings.types', moduleLabel: 'Leave Types', table: TABLE, id, label: `Leave Type: ${pickLabel(row, ['name'], id)}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
