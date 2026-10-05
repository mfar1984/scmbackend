import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db('partner_applications').orderBy('id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
