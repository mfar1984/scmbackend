import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'atline-secret';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  user_type: string;
};

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Use in getServerSideProps to protect a page.
 * Checks both JWT validity AND active session in DB.
 * Redirects to /login if not authenticated.
 */
export async function requireAuth(
  context: GetServerSidePropsContext,
  callback?: (user: AuthUser) => GetServerSidePropsResult<any>
): Promise<GetServerSidePropsResult<any>> {
  const cookies = parse(context.req.headers.cookie || '');
  const token   = cookies['atline_token'];

  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  try {
    // 1. Verify JWT
    const user = jwt.verify(token, JWT_SECRET) as AuthUser;

    // 2. Verify session exists in DB
    const tokenHash = hashToken(token);
    const session   = await db('user_sessions')
      .where({ token_hash: tokenHash })
      .where('expires_at', '>', new Date())
      .first();

    if (!session) {
      return { redirect: { destination: '/login', permanent: false } };
    }

    if (callback) return callback(user);
    return { props: { user } };
  } catch {
    return { redirect: { destination: '/login', permanent: false } };
  }
}
