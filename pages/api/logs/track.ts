import type { NextApiRequest, NextApiResponse } from 'next';
import { logActivity, resolveActor } from '@/lib/logger';

/**
 * Lightweight client-side activity beacon. The browser posts the page/link the
 * user navigated to (and optional click context). Identity + IP are resolved
 * server-side from the session cookie, never trusted from the client.
 *
 * Body: { path: string, title?: string, action?: 'navigate' | 'click', label?: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const actor = await resolveActor(req);
  if (!actor.userId) return res.status(200).json({ success: true }); // not logged in → ignore silently

  const b = req.body || {};
  const path = String(b.path || '').slice(0, 255);
  if (!path) return res.status(200).json({ success: true });

  const kind = b.action === 'click' ? 'click' : 'navigate';
  const title = b.title ? String(b.title).slice(0, 160) : '';
  const label = b.label ? String(b.label).slice(0, 160) : '';

  const message = kind === 'click'
    ? `Clicked ${label || 'an element'}`
    : `Visited ${title || path}`;

  await logActivity(null, {
    level: 'INFO',
    category: 'Navigation',
    message,
    path,
    details: kind === 'click' && label ? `Element: ${label}` : null,
    actor,
  });

  return res.status(200).json({ success: true });
}
