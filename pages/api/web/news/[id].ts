import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { recycleDelete } from '@/lib/recycleBin';
import { computeReadTime } from './index';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

const TABLE = 'web_news';
const PERM = 'web.news';

function slugify(s: string): string {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || 'article';
}

async function uniqueSlug(base: string, ignoreId: number): Promise<string> {
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const row = await db(TABLE).where({ slug }).first();
    if (!row || row.id === ignoreId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

const toJson = (v: any) => {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return null; }
};
const parseArr = (v: any) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  if (req.method === 'PUT' || req.method === 'DELETE') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const perm = req.method === 'DELETE' ? 'Delete' : 'Update';
    if (!(await hasPermission(auth, PERM, perm))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
  }

  if (req.method === 'GET') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      return res.status(200).json({
        success: true,
        data: { ...row, sections: parseArr(row.sections), gallery: parseArr(row.gallery), is_featured: !!row.is_featured },
      });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    try {
      const exists = await db(TABLE).where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Not found.' });
      const b = req.body || {};

      const upd: Record<string, any> = {};
      if (b.title !== undefined) upd.title = b.title?.trim() || exists.title;
      if (b.slug !== undefined && b.slug?.trim()) upd.slug = await uniqueSlug(slugify(b.slug), id);
      if (b.category !== undefined) upd.category = b.category?.trim() || null;
      if (b.excerpt !== undefined) upd.excerpt = b.excerpt?.trim() || null;
      if (b.author !== undefined) upd.author = b.author?.trim() || null;
      if (b.article_date !== undefined) upd.article_date = b.article_date || null;
      if (b.read_time !== undefined) upd.read_time = b.read_time?.trim() || computeReadTime(b.intro ?? exists.intro, b.sections ?? exists.sections);
      if (b.image !== undefined) upd.image = b.image?.trim() || null;
      if (b.intro !== undefined) upd.intro = b.intro?.trim() || null;
      if (b.sections !== undefined) upd.sections = toJson(b.sections);
      if (b.gallery !== undefined) upd.gallery = toJson(b.gallery);
      if (b.tags !== undefined) upd.tags = Array.isArray(b.tags) ? b.tags.join(',') : (b.tags?.trim() || null);
      if (b.status !== undefined) upd.status = b.status === 'Draft' ? 'Draft' : 'Published';
      if (b.is_featured !== undefined) upd.is_featured = b.is_featured ? 1 : 0;
      if (b.sort_order !== undefined) upd.sort_order = parseInt(b.sort_order) || 0;
      if (b.posted_date !== undefined) upd.posted_date = b.posted_date || null;

      await db(TABLE).where({ id }).update(upd);
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      const auth = await getAuth(req);
      await recycleDelete({
        moduleKey: PERM, moduleLabel: 'News', table: TABLE, id,
        label: `News: ${row.title || `#${id}`}`,
        auth, req,
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
