import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { parse } from 'cookie';
import db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'atline-secret';
const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

/**
 * Self-service account endpoint — works for ANY logged-in user (administrator,
 * staff, client). Resolves the user from their own session cookie, so a user
 * can only ever read/update their OWN account. No role permission needed.
 *
 * GET → own profile.
 * PUT → update name, phone, email, and optionally password (current password
 *       required to set a new one).
 */
async function resolveUserId(req: NextApiRequest): Promise<number | null> {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies['atline_token'];
  if (!token) return null;
  let payload: any;
  try { payload = jwt.verify(token, JWT_SECRET); } catch { return null; }
  const session = await db('user_sessions')
    .where({ token_hash: hashToken(token) })
    .where('expires_at', '>', new Date())
    .first();
  if (!session) return null;
  return payload.id as number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await resolveUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated.' });

  if (req.method === 'GET') {
    try {
      const u = await db('users as u')
        .select('u.id', 'u.name', 'u.email', 'u.phone', 'u.user_type', 'u.department',
          'u.position', 'u.join_date', 'u.last_login', 'u.created_at', 'u.employee_id',
          'r.name as role')
        .leftJoin('roles as r', 'r.id', 'u.role_id')
        .where('u.id', userId)
        .first();
      if (!u) return res.status(404).json({ success: false, message: 'Account not found.' });
      return res.status(200).json({ success: true, data: u });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const b = req.body || {};
    try {
      const me = await db('users').where({ id: userId }).first();
      if (!me) return res.status(404).json({ success: false, message: 'Account not found.' });

      const upd: Record<string, any> = {};

      if (b.name !== undefined) {
        if (!String(b.name).trim()) return res.status(400).json({ success: false, message: 'Name is required.' });
        upd.name = String(b.name).trim();
      }
      if (b.phone !== undefined) upd.phone = String(b.phone).trim() || null;

      if (b.email !== undefined) {
        const email = String(b.email).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }
        const dup = await db('users').where({ email }).whereNot({ id: userId }).first();
        if (dup) return res.status(409).json({ success: false, message: 'That email is already in use.' });
        upd.email = email;
      }

      // Password change — requires the current password.
      if (b.new_password) {
        const np = String(b.new_password);
        if (np.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        const ok = await bcrypt.compare(String(b.current_password || ''), me.password);
        if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        upd.password = await bcrypt.hash(np, 10);
      }

      if (Object.keys(upd).length === 0) {
        return res.status(400).json({ success: false, message: 'Nothing to update.' });
      }

      await db('users').where({ id: userId }).update(upd);
      return res.status(200).json({ success: true, message: 'Profile updated.' });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
