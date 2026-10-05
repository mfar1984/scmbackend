import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'atline-secret';
const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

// Identify the logged-in admin (mirrors /api/auth/me).
async function requireAdmin(req: NextApiRequest): Promise<boolean> {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies['atline_token'];
  if (!token) return false;
  try { jwt.verify(token, JWT_SECRET); } catch { return false; }
  const session = await db('user_sessions').where({ token_hash: hashToken(token) }).where('expires_at', '>', new Date()).first();
  return !!session;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await requireAdmin(req))) return res.status(401).json({ success: false, message: 'Not authenticated.' });

  // GET — list recent + unread count + per-type unread counts (for sidebar badges)
  if (req.method === 'GET') {
    try {
      const rows = await db('notifications').orderBy('created_at', 'desc').limit(30);
      const unreadRow = await db('notifications').where({ is_read: 0 }).count('id as c').first();
      const unread = Number((unreadRow as any)?.c || 0);

      const perType = await db('notifications').where({ is_read: 0 }).select('type').count('id as c').groupBy('type');
      const counts: Record<string, number> = {};
      for (const r of perType as any[]) counts[r.type] = Number(r.c);

      return res.status(200).json({ success: true, data: rows, unread, counts });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // PATCH — mark read. Body: { id } to mark one, or { all: true } to mark all.
  if (req.method === 'PATCH') {
    try {
      const b = req.body || {};
      if (b.all) {
        await db('notifications').where({ is_read: 0 }).update({ is_read: 1, read_at: db.fn.now() });
      } else if (b.id) {
        await db('notifications').where({ id: parseInt(b.id) }).update({ is_read: 1, read_at: db.fn.now() });
      } else {
        return res.status(400).json({ success: false, message: 'Provide id or all.' });
      }
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // DELETE — clear all notifications
  if (req.method === 'DELETE') {
    try {
      await db('notifications').delete();
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
