import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Lightweight employee list for dropdowns (id, employee_id, full_name).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  try {
    const rows = await db('hr_employees')
      .select('id', 'employee_id', 'full_name', 'basic_salary', 'gender')
      .where('status', 'Active')
      .orderBy('full_name', 'asc');
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
