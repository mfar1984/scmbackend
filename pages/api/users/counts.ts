import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Returns count per user_type for tab badges
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  try {
    const rows = await db('users')
      .select('user_type')
      .count('id as count')
      .groupBy('user_type');

    const counts: Record<string, number> = {
      administrator: 0,
      staff: 0,
      client: 0,
    };

    for (const row of rows) {
      const type = row.user_type as string;
      if (type in counts) counts[type] = Number(row.count);
    }

    return res.status(200).json({ success: true, data: counts });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
