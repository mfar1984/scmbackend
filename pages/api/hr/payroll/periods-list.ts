import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Lightweight payroll period list for dropdowns (excludes Closed periods).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  try {
    const rows = await db('hr_payroll_periods')
      .select('id', 'name', 'status')
      .whereNot('status', 'Closed')
      .orderBy('id', 'desc');
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
