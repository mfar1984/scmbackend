import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getEssSession } from '@/lib/essAuth';

// Leave balance for the logged-in staff, per leave type, for the current year.
// balance = entitlement (days_per_year) - used (approved) - pending
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const sess = await getEssSession(req);
  if (!sess) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!sess.employeeId) return res.status(403).json({ success: false, message: 'Account not linked to an employee.' });

  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const yStart = `${year}-01-01`;
    const yEnd = `${year}-12-31`;

    const emp = await db('hr_employees').where({ id: sess.employeeId }).select('gender').first();
    const gender = emp?.gender || '';

    const types = await db('hr_leave_types').where('status', 'Active').orderBy('name', 'asc');

    const result = [];
    for (const t of types) {
      // gender filter
      const ge = t.gender_eligibility || 'All';
      if (ge !== 'All' && gender && ge !== gender) continue;

      const used = await db('hr_leave_applications')
        .where({ employee_id: sess.employeeId, leave_type_id: t.id, status: 'Approved' })
        .whereBetween('start_date', [yStart, yEnd])
        .sum({ total: 'days' }).first();
      const pending = await db('hr_leave_applications')
        .where({ employee_id: sess.employeeId, leave_type_id: t.id, status: 'Pending' })
        .whereBetween('start_date', [yStart, yEnd])
        .sum({ total: 'days' }).first();

      const entitlement = Number(t.days_per_year) || 0;
      const usedDays = parseFloat(used?.total) || 0;
      const pendingDays = parseFloat(pending?.total) || 0;
      const balance = entitlement > 0 ? entitlement - usedDays - pendingDays : null; // null = unlimited

      result.push({
        leave_type_id: t.id, name: t.name, code: t.code, color: t.color || '#3b82f6',
        paid: t.paid, requires_document: !!t.requires_document, gender_eligibility: ge,
        entitlement, used: usedDays, pending: pendingDays, balance,
        unlimited: entitlement === 0,
      });
    }

    return res.status(200).json({ success: true, year, data: result });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
