import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import db from '@/lib/db';

// Live notifications via Server-Sent Events (SSE).
// Holds the connection open and pushes an event whenever a new notification
// arrives or the unread count changes — no client polling/refresh needed.
export const config = { api: { bodyParser: false, responseLimit: false } };

const JWT_SECRET = process.env.JWT_SECRET || 'atline-secret';
const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

async function isAdmin(req: NextApiRequest): Promise<boolean> {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies['atline_token'];
  if (!token) return false;
  try { jwt.verify(token, JWT_SECRET); } catch { return false; }
  const session = await db('user_sessions').where({ token_hash: hashToken(token) }).where('expires_at', '>', new Date()).first();
  return !!session;
}

async function snapshot(): Promise<{ maxId: number; unread: number }> {
  const m = await db('notifications').max('id as m').first();
  const u = await db('notifications').where({ is_read: 0 }).count('id as c').first();
  return { maxId: Number((m as any)?.m || 0), unread: Number((u as any)?.c || 0) };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await isAdmin(req))) { res.status(401).end(); return; }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // disable proxy buffering (nginx/cPanel)
  });
  (res as any).flushHeaders?.();

  let closed = false;
  let last = { maxId: -1, unread: -1 };

  const send = (event: string, data: any) => {
    if (closed) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Initial hello so the client knows the stream is live.
  send('hello', { ok: true });

  const tick = async () => {
    if (closed) return;
    try {
      const snap = await snapshot();
      if (snap.maxId !== last.maxId || snap.unread !== last.unread) {
        const isNew = last.maxId >= 0 && snap.maxId > last.maxId;
        last = snap;
        send('update', { ...snap, isNew });
      }
    } catch { /* ignore transient db errors */ }
  };

  // Poll the DB server-side every 3s and push only on change.
  const pollTimer = setInterval(tick, 3000);
  // Heartbeat comment every 25s to keep the connection alive through proxies.
  const beatTimer = setInterval(() => { if (!closed) res.write(': ping\n\n'); }, 25000);

  await tick(); // prime immediately

  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(pollTimer);
    clearInterval(beatTimer);
    try { res.end(); } catch { /* ignore */ }
  };

  req.on('close', cleanup);
  req.on('error', cleanup);
}
