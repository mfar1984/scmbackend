import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getEssSession } from '@/lib/essAuth';

// Active leave types eligible for the logged-in staff's gender.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const sess = await getEssSession(req);
  if (!sess) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!sess.employeeId) return res.status(403).json({ success: false, message: 'Account not linked to an employee.' });

  try {
    const emp = await db('hr_employees').where({ id: sess.employeeId }).select('gender').first();
    const gender = emp?.gender || '';
    const types = await db('hr_leave_types').where('status', 'Active').orderBy('name', 'asc');
    const eligible = types.filter((t: any) => {
      const ge = t.gender_eligibility || 'All';
      if (ge === 'All') return true;
      if (!gender) return true;
      return ge === gender;
    });
    return res.status(200).json({ success: true, data: eligible });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
