import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

/**
 * POST /api/auth/cleanup
 * Deletes all expired sessions from DB.
 * Can be called manually or via a cron job.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  try {
    const deleted = await db('user_sessions')
      .where('expires_at', '<', new Date())
      .delete();

    return res.status(200).json({
      success: true,
      deleted,
      message: `${deleted} expired session(s) removed.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
