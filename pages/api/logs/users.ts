import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasAnyPermission } from '@/lib/serverPermissions';

/**
 * Lightweight list of users that appear in the logs — used to populate the
 * "filter by user" dropdown on the Activity / Audit pages.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const auth = await getAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!(await hasAnyPermission(auth, ['settings.logs.activity', 'settings.logs.audit'], 'Read'))) {
    return res.status(403).json({ success: false, message: 'You do not have permission.' });
  }
  try {
    const rows = await db('users as u')
      .select('u.id', 'u.name', 'u.email', 'u.user_type', 'r.name as role')
      .leftJoin('roles as r', 'r.id', 'u.role_id')
      .orderBy('u.name', 'asc');
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
