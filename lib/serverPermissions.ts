import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'atline-secret';

export type AuthInfo = {
  userId: number;
  roleId: number | null;
  role: string;
  isSuperAdmin: boolean;
};

/** Resolve the current authenticated user from the request cookie. */
export async function getAuth(req: NextApiRequest): Promise<AuthInfo | null> {
  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies['atline_token'];
    if (!token) return null;

    let payload: { id: number };
    try {
      payload = jwt.verify(token, JWT_SECRET) as typeof payload;
    } catch {
      return null;
    }

    const user = await db('users')
      .select('users.id', 'users.role_id', 'roles.name as role')
      .leftJoin('roles', 'roles.id', 'users.role_id')
      .where('users.id', payload.id)
      .first();

    if (!user) return null;
    const role = user.role || '';
    return {
      userId: user.id,
      roleId: user.role_id ?? null,
      role,
      isSuperAdmin: role.trim().toLowerCase() === 'super admin',
    };
  } catch {
    return null;
  }
}

/** True if the role has a specific permission on a module key. */
export async function hasPermission(auth: AuthInfo | null, moduleKey: string, perm: string): Promise<boolean> {
  if (!auth) return false;
  if (auth.isSuperAdmin) return true;
  if (!auth.roleId) return false;
  const row = await db('role_permissions')
    .where({ role_id: auth.roleId, module: moduleKey, permission: perm })
    .first();
  return !!row;
}

/** True if the role has `perm` on ANY of the given module keys. */
export async function hasAnyPermission(auth: AuthInfo | null, moduleKeys: string[], perm: string): Promise<boolean> {
  if (!auth) return false;
  if (auth.isSuperAdmin) return true;
  if (!auth.roleId) return false;
  const row = await db('role_permissions')
    .where({ role_id: auth.roleId, permission: perm })
    .whereIn('module', moduleKeys)
    .first();
  return !!row;
}

/**
 * Guard helper for API routes. Returns true if allowed; otherwise writes a
 * 401/403 response and returns false (caller should `return`).
 */
export async function requirePermission(
  req: NextApiRequest,
  res: NextApiResponse,
  moduleKey: string,
  perm: string,
): Promise<boolean> {
  const auth = await getAuth(req);
  if (!auth) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return false;
  }
  if (await hasPermission(auth, moduleKey, perm)) return true;
  res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
  return false;
}

/** Like requirePermission but allows any of several module keys. */
export async function requireAnyPermission(
  req: NextApiRequest,
  res: NextApiResponse,
  moduleKeys: string[],
  perm: string,
): Promise<boolean> {
  const auth = await getAuth(req);
  if (!auth) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return false;
  }
  if (await hasAnyPermission(auth, moduleKeys, perm)) return true;
  res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
  return false;
}

const METHOD_PERM: Record<string, string> = {
  POST: 'Create', PUT: 'Update', PATCH: 'Update', DELETE: 'Delete',
};

/** CRUD guard accepting any of several module keys. GET always allowed. */
export async function guardCrudAny(
  req: NextApiRequest,
  res: NextApiResponse,
  moduleKeys: string[],
): Promise<boolean> {
  if (req.method === 'GET') return true;
  const perm = METHOD_PERM[req.method || ''] || 'Update';
  return requireAnyPermission(req, res, moduleKeys, perm);
}

/**
 * CRUD guard — maps the HTTP method to a permission (POST→Create, PUT/PATCH→
 * Update, DELETE→Delete) and enforces it. GET is always allowed (read is
 * gated at the page level). Returns true if the request may proceed.
 */
export async function guardCrud(
  req: NextApiRequest,
  res: NextApiResponse,
  moduleKey: string,
): Promise<boolean> {
  if (req.method === 'GET') return true;
  const perm = METHOD_PERM[req.method || ''] || 'Update';
  return requirePermission(req, res, moduleKey, perm);
}
