import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'atline-secret';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Clean up all expired sessions (run opportunistically)
async function cleanupExpiredSessions() {
  try {
    await db('user_sessions').where('expires_at', '<', new Date()).delete();
  } catch { /* silent */ }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  // Cleanup expired sessions on every /me call (lightweight, indexed query)
  cleanupExpiredSessions();

  try {
    const cookies = parse(req.headers.cookie || '');
    const token   = cookies['atline_token'];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const tokenHash = hashToken(token);

    // 1. Verify JWT signature & expiry
    let payload: { id: number; name: string; email: string; role: string; user_type: string; employee_id?: number | null };
    try {
      payload = jwt.verify(token, JWT_SECRET) as typeof payload;
    } catch {
      // JWT invalid or expired — delete session from DB immediately
      await db('user_sessions').where({ token_hash: tokenHash }).delete();
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    // 2. Check session still exists in DB
    const session = await db('user_sessions')
      .where({ token_hash: tokenHash })
      .where('expires_at', '>', new Date())
      .first();

    if (!session) {
      // Session not found or expired — ensure it's deleted
      await db('user_sessions').where({ token_hash: tokenHash }).delete();
      return res.status(401).json({ success: false, message: 'Session expired or logged out.' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id:        payload.id,
        name:      payload.name,
        email:     payload.email,
        role:      payload.role,
        user_type: payload.user_type,
        employee_id: payload.employee_id ?? null,
      },
    });
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
}
