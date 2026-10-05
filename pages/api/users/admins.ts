import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Returns administrator accounts for approver dropdowns (id + name + role).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  try {
    const rows = await db('users')
      .select('users.id', 'users.name', 'users.email', 'roles.name as role')
      .leftJoin('roles', 'roles.id', 'users.role_id')
      .where('users.user_type', 'administrator')
      .andWhere('users.status', 'Active')
      .orderBy('users.name', 'asc');
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
