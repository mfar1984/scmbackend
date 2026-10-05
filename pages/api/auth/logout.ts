import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { serialize, parse } from 'cookie';
import db from '@/lib/db';
import { logAudit, resolveActor } from '@/lib/logger';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  try {
    // Get token from cookie
    const cookies = parse(req.headers.cookie || '');
    const token   = cookies['atline_token'];

    if (token) {
      const tokenHash = hashToken(token);

      // ── Audit: logout (resolve actor before deleting the session) ──
      try {
        const actor = await resolveActor(req);
        if (actor.userId) {
          await logAudit(null, { action: 'LOGOUT', module: 'Auth', target: 'System', description: `${actor.name} signed out`, actor });
        }
      } catch { /* never block logout */ }

      // ── Delete session from DB ───────────────────────────
      await db('user_sessions').where({ token_hash: tokenHash }).delete();
    }
  } catch {
    // Silent — still clear cookie even if DB fails
  }

  // Clear the cookie regardless
  res.setHeader('Set-Cookie', serialize('atline_token', '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,
    path:     '/',
  }));

  return res.status(200).json({ success: true });
}
