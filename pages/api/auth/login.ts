import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { logActivity, logAudit } from '@/lib/logger';

const JWT_SECRET  = process.env.JWT_SECRET || 'atline-secret';
const COOKIE_NAME = 'atline_token';
const SESSION_TTL = 60 * 60 * 8; // 8 hours in seconds

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    // Find user with role name
    const user = await db('users')
      .select(
        'users.id', 'users.name', 'users.email', 'users.password',
        'users.status', 'users.user_type', 'users.employee_id',
        'roles.name as role'
      )
      .leftJoin('roles', 'roles.id', 'users.role_id')
      .where('users.email', email.trim().toLowerCase())
      .first();

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your account is inactive or suspended. Please contact administrator.' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await logActivity(null, {
        level: 'WARN', category: 'Auth',
        message: `Failed login attempt for ${email.trim().toLowerCase()}`,
        details: `Incorrect password`,
        actor: { userId: null, name: email.trim().toLowerCase(), email: email.trim().toLowerCase(), role: '', userType: '', ip: getClientIp(req), portal: 'admin' },
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Sign JWT
    const expiresAt = new Date(Date.now() + SESSION_TTL * 1000);
    const token = jwt.sign(
      {
        id:        user.id,
        name:      user.name,
        email:     user.email,
        role:      user.role || 'Staff',
        user_type: user.user_type,
        employee_id: user.employee_id || null,
      },
      JWT_SECRET,
      { expiresIn: SESSION_TTL }
    );

    const tokenHash = hashToken(token);

    // ── Store session in DB ──────────────────────────────────
    // Remove ALL previous sessions for this user (force single session)
    await db('user_sessions').where('user_id', user.id).delete();

    // Insert new session
    await db('user_sessions').insert({
      user_id:    user.id,
      token_hash: tokenHash,
      ip_address: getClientIp(req),
      user_agent: (req.headers['user-agent'] || '').substring(0, 255),
      expires_at: expiresAt,
    });

    // Update last_login
    await db('users').where({ id: user.id }).update({ last_login: new Date() });

    // ── Audit: successful login ──
    const ip = getClientIp(req);
    await logAudit(null, {
      action: 'LOGIN',
      module: 'Auth',
      target: 'System',
      description: `${user.name} signed in`,
      actor: {
        userId: user.id, name: user.name, email: user.email,
        role: user.role || 'Staff', userType: user.user_type, ip,
        portal: user.user_type === 'staff' ? 'ess' : 'admin',
      },
    });

    // Set HttpOnly cookie
    res.setHeader('Set-Cookie', serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   SESSION_TTL,
      path:     '/',
    }));

    return res.status(200).json({
      success: true,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role || 'Staff',
        user_type: user.user_type,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
