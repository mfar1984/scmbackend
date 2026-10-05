import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getSchema } from '@/lib/webContentSchema';
import { PAGE_DEFAULTS } from '@/lib/webContentDefaults';
import { webModuleKey } from '@/lib/webPermMap';
import { getAuth, hasPermission } from '@/lib/serverPermissions';

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };

const TABLE = 'web_page_content';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const parts = req.query.slug as string[] | undefined;
  const slug = (parts || []).join('/');
  const schema = getSchema(slug);
  if (!schema) return res.status(404).json({ success: false, message: 'Unknown page.' });

  // Editing requires Update on the mapped module (tender/download use their own keys).
  if (req.method === 'PUT' || req.method === 'DELETE') {
    const modKey = webModuleKey(slug)
      || (slug === 'business/tender' ? 'web.business.tender.content' : '')
      || (slug === 'resources/download' ? 'web.resources.download.content' : '');
    if (modKey) {
      const auth = await getAuth(req);
      if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
      if (!(await hasPermission(auth, modKey, 'Update'))) {
        return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
      }
    }
  }

  if (req.method === 'GET') {
    try {
      const row = await db(TABLE).where({ slug }).first();
      let content = PAGE_DEFAULTS[slug] || {};
      let status = 'Published';
      let updatedAt: any = null;
      if (row?.content) {
        try { content = JSON.parse(row.content); } catch { /* fallback to defaults */ }
        status = row.status || 'Published';
        updatedAt = row.updated_at;
      }
      return res.status(200).json({ success: true, schema, data: content, status, updated_at: updatedAt, seeded: !row });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const b = req.body || {};
    const content = typeof b.content === 'object' && b.content ? b.content : {};
    const status = b.status === 'Draft' ? 'Draft' : 'Published';
    try {
      const json = JSON.stringify(content);
      const exists = await db(TABLE).where({ slug }).first();
      if (exists) await db(TABLE).where({ slug }).update({ content: json, status });
      else await db(TABLE).insert({ slug, content: json, status });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // Restore defaults
  if (req.method === 'DELETE') {
    try {
      await db(TABLE).where({ slug }).delete();
      return res.status(200).json({ success: true, data: PAGE_DEFAULTS[slug] || {} });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
