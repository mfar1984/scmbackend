// Resolve the logged-in staff user + their linked employee_id from the request.
// Used by all /api/ess/* endpoints so a staff member can only ever access
// their own records (employee_id comes from the session, never the client).
import type { NextApiRequest } from 'next';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'atline-secret';
const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

export type EssSession = {
  userId: number;
  name: string;
  email: string;
  userType: string;
  employeeId: number | null;
};

export async function getEssSession(req: NextApiRequest): Promise<EssSession | null> {
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

  // Re-read employee_id from DB (authoritative, in case it changed after login)
  const user = await db('users').where({ id: payload.id }).select('user_type', 'employee_id', 'name', 'email').first();
  if (!user) return null;

  return {
    userId: payload.id,
    name: user.name,
    email: user.email,
    userType: user.user_type,
    employeeId: user.employee_id ?? null,
  };
}
