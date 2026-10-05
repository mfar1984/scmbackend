import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Simple endpoint: returns just id + name for dropdowns
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  try {
    const roles = await db('roles').select('id', 'name').where({ status: 'Active' }).orderBy('name');
    return res.status(200).json({ success: true, data: roles });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
