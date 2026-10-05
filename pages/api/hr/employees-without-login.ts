import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Active employees (with an email) that do NOT yet have a staff login account.
// Used by the "Add Staff Login" picker so accounts are always imported from
// the single source of truth (hr_employees) — never typed manually.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  try {
    const rows = await db('hr_employees as e')
      .select('e.id', 'e.employee_id', 'e.full_name', 'e.email', 'd.name as department_name', 'p.name as position_name')
      .leftJoin('hr_departments as d', 'd.id', 'e.department_id')
      .leftJoin('hr_positions as p', 'p.id', 'e.position_id')
      .whereNotExists(function () {
        this.select('*').from('users as u').whereRaw('u.employee_id = e.id');
      })
      .where('e.status', 'Active')
      .orderBy('e.full_name', 'asc');
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
