import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission } from '@/lib/serverPermissions';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

const TABLE = 'web_news';
const PERM = 'web.news';

function slugify(s: string): string {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || 'article';
}

async function uniqueSlug(base: string, ignoreId?: number): Promise<string> {
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const row = await db(TABLE).where({ slug }).first();
    if (!row || (ignoreId && row.id === ignoreId)) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

const toJson = (v: any) => {
  if (v == null) return null;
  if (typeof v === 'string') return v;          // already JSON string
  try { return JSON.stringify(v); } catch { return null; }
};

/** Estimate reading time from intro + section bodies (~200 words/min). */
export function computeReadTime(intro: any, sections: any): string {
  let text = String(intro || '');
  const secs = Array.isArray(sections) ? sections : (() => { try { return JSON.parse(sections || '[]'); } catch { return []; } })();
  for (const s of secs) {
    const body = Array.isArray(s?.body) ? s.body.join(' ') : String(s?.body || '');
    text += ' ' + body;
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE)
        .select('id', 'slug', 'category', 'title', 'excerpt', 'author', 'article_date',
          'read_time', 'image', 'tags', 'status', 'is_featured', 'sort_order', 'posted_date', 'updated_at')
        .orderBy([{ column: 'is_featured', order: 'desc' }, { column: 'article_date', order: 'desc' }, { column: 'id', order: 'desc' }]);
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, PERM, 'Create'))) return;
    try {
      const b = req.body || {};
      if (!b.title?.trim()) return res.status(400).json({ success: false, message: 'Title is required.' });
      const base = slugify(b.slug?.trim() || b.title);
      const slug = await uniqueSlug(base);
      const articleDate = b.article_date || todayStr();

      const [id] = await db(TABLE).insert({
        slug,
        category: b.category?.trim() || null,
        title: b.title.trim(),
        excerpt: b.excerpt?.trim() || null,
        author: b.author?.trim() || null,
        article_date: articleDate,
        read_time: b.read_time?.trim() || computeReadTime(b.intro, b.sections),
        image: b.image?.trim() || null,
        intro: b.intro?.trim() || null,
        sections: toJson(b.sections),
        gallery: toJson(b.gallery),
        tags: Array.isArray(b.tags) ? b.tags.join(',') : (b.tags?.trim() || null),
        status: b.status === 'Draft' ? 'Draft' : 'Published',
        is_featured: b.is_featured ? 1 : 0,
        sort_order: parseInt(b.sort_order) || 0,
        posted_date: b.posted_date || articleDate,
      });
      return res.status(201).json({ success: true, id, slug });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
