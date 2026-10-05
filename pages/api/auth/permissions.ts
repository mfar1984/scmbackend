import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'atline-secret';

/**
 * Returns the current user's effective permission matrix, keyed by module key.
 * Super Admin role bypasses all checks (isSuperAdmin = true, full access).
 *
 * Response: { success, role, isSuperAdmin, matrix: { [moduleKey]: { [perm]: true } } }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  try {
    const cookies = parse(req.headers.cookie || '');
    const token   = cookies['atline_token'];
    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated.' });

    let payload: { id: number; role: string };
    try {
      payload = jwt.verify(token, JWT_SECRET) as typeof payload;
    } catch {
      return res.status(401).json({ success: false, message: 'Session expired.' });
    }

    // Load the user's role_id + role name fresh from DB (role may have changed).
    const user = await db('users')
      .select('users.role_id', 'roles.name as role')
      .leftJoin('roles', 'roles.id', 'users.role_id')
      .where('users.id', payload.id)
      .first();

    const roleName = user?.role || payload.role || '';
    const isSuperAdmin = roleName.trim().toLowerCase() === 'super admin';

    if (isSuperAdmin) {
      return res.status(200).json({ success: true, role: roleName, isSuperAdmin: true, matrix: {} });
    }

    const matrix: Record<string, Record<string, boolean>> = {};
    if (user?.role_id) {
      const perms = await db('role_permissions').where({ role_id: user.role_id });
      for (const p of perms) {
        if (!matrix[p.module]) matrix[p.module] = {};
        matrix[p.module][p.permission] = true;
      }
    }

    return res.status(200).json({ success: true, role: roleName, isSuperAdmin: false, matrix });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
