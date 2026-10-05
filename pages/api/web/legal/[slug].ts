import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasPermission } from '@/lib/serverPermissions';

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

const TABLE = 'web_legal_pages';
const SLUGS = ['privacy-policy', 'terms-of-service', 'disclaimer'];
const SLUG_PERM: Record<string, string> = {
  'privacy-policy': 'web.legal.privacy',
  'terms-of-service': 'web.legal.terms',
  'disclaimer': 'web.legal.disclaimer',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = String(req.query.slug || '');
  if (!SLUGS.includes(slug)) return res.status(400).json({ success: false, message: 'Invalid page.' });

  if (req.method === 'PUT') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    if (!(await hasPermission(auth, SLUG_PERM[slug], 'Update'))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
  }

  if (req.method === 'GET') {
    try {
      const row = await db(TABLE).where({ slug }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Page not found.' });
      return res.status(200).json({ success: true, data: row });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const b = req.body || {};
    try {
      const exists = await db(TABLE).where({ slug }).first();
      const payload = {
        slug,
        title: b.title?.trim() || (exists?.title || slug),
        content: typeof b.content === 'string' ? b.content : (exists?.content || ''),
        status: b.status === 'Draft' ? 'Draft' : 'Published',
      };
      if (exists) await db(TABLE).where({ slug }).update({ title: payload.title, content: payload.content, status: payload.status });
      else await db(TABLE).insert(payload);
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
