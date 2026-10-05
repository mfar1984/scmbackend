import type { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import db from './db';

/**
 * Centralised logging helpers (server-side). Never throw — logging must never
 * break the request it is recording. Two streams:
 *
 *  • activity_logs — everything: navigation, reads, creates, edits, deletes,
 *    exports, logins. High-volume operational trail.
 *  • audit_logs    — significant data-changing actions with before/after, for
 *    the per-user audit trail (CREATE/UPDATE/DELETE/APPROVE/REJECT/EXPORT/…).
 */

const JWT_SECRET = process.env.JWT_SECRET || 'atline-secret';

export type Actor = {
  userId: number | null;
  name: string;
  email: string;
  role: string;
  userType: string;
  ip: string;
  portal: 'admin' | 'ess';
};

export function getClientIp(req: NextApiRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Resolve the acting user from the request cookie (best-effort, no throw).
 * Reads the JWT then looks up the live user for name/role/type.
 */
export async function resolveActor(req: NextApiRequest): Promise<Actor> {
  const ip = getClientIp(req);
  const fallback: Actor = { userId: null, name: 'system', email: '', role: '', userType: '', ip, portal: 'admin' };
  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies['atline_token'];
    if (!token) return fallback;
    let payload: any;
    try { payload = jwt.verify(token, JWT_SECRET); } catch { return fallback; }
    const user = await db('users as u')
      .select('u.id', 'u.name', 'u.email', 'u.user_type', 'r.name as role')
      .leftJoin('roles as r', 'r.id', 'u.role_id')
      .where('u.id', payload.id)
      .first();
    if (!user) return { ...fallback, userId: payload.id ?? null };
    return {
      userId: user.id,
      name: user.name || user.email || 'user',
      email: user.email || '',
      role: user.role || (user.user_type === 'staff' ? 'Staff' : ''),
      userType: user.user_type || '',
      ip,
      portal: user.user_type === 'staff' ? 'ess' : 'admin',
    };
  } catch {
    return fallback;
  }
}

export type ActivityLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export type ActivityInput = {
  level?: ActivityLevel;
  category: string;     // e.g. 'Leave', 'Auth', 'Web Tools', 'Navigation'
  message: string;
  details?: string | null;
  path?: string | null; // page/link involved
  actor?: Actor;        // pre-resolved actor (optional)
};

/** Write an activity log row. Resolves the actor from req if not provided. */
export async function logActivity(req: NextApiRequest | null, input: ActivityInput): Promise<void> {
  try {
    const actor = input.actor || (req ? await resolveActor(req) : null);
    await db('activity_logs').insert({
      level: input.level || 'INFO',
      category: input.category || 'System',
      user: actor?.name || 'system',
      user_id: actor?.userId ?? null,
      ip: actor?.ip || null,
      path: input.path ?? null,
      portal: actor?.portal ?? null,
      message: input.message,
      details: input.details ?? null,
    });
  } catch { /* logging must never break the request */ }
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'APPROVE' | 'REJECT';

export type AuditInput = {
  action: AuditAction;
  module: string;       // friendly module label e.g. 'Leave', 'Users'
  target: string;       // what was acted on e.g. 'Leave: ATL-L-0007'
  description: string;
  before?: any;
  after?: any;
  actor?: Actor;
};

/**
 * Write an audit row AND a matching activity row (so the activity stream is a
 * superset). Resolves the actor from req if not provided.
 */
export async function logAudit(req: NextApiRequest | null, input: AuditInput): Promise<void> {
  try {
    const actor = input.actor || (req ? await resolveActor(req) : null);
    await db('audit_logs').insert({
      action: input.action,
      module: input.module,
      user: actor?.name || 'system',
      user_id: actor?.userId ?? null,
      user_role: actor?.role || null,
      ip: actor?.ip || null,
      target: input.target,
      description: input.description,
      before_data: input.before ? JSON.stringify(sanitize(input.before)) : null,
      after_data: input.after ? JSON.stringify(sanitize(input.after)) : null,
    });
    // Mirror into activity stream.
    await logActivity(null, {
      level: input.action === 'DELETE' ? 'WARN' : 'INFO',
      category: input.module,
      message: input.description,
      details: input.target,
      actor: actor || undefined,
    });
  } catch { /* never throw */ }
}

// Strip heavy/sensitive fields from before/after snapshots so audit rows stay
// small and never leak secrets or base64 blobs.
const HIDE = /password|token|secret|doc_data|file_data|compiled_doc|image_path|file_path|cover_path|payment_proof|receipt|document|^doc_|_data$/i;

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (HIDE.test(k)) continue;
    if (typeof v === 'string' && v.length > 300) { out[k] = v.slice(0, 300) + '…'; continue; }
    out[k] = v;
  }
  return out;
}
