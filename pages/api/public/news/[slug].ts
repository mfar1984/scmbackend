import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

/**
 * PUBLIC endpoint — full news article by slug (for the SCM website detail page).
 */
function applyCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const fmtDate = (d: any) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const splitTags = (v: string | null) => (v || '').split(',').map(s => s.trim()).filter(Boolean);
const parseArr = (v: any) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const slug = String(req.query.slug || '');
  try {
    const r = await db('web_news').where({ slug, status: 'Published' }).first();
    if (!r) return res.status(404).json({ success: false, message: 'Article not found.' });

    const data = {
      slug: r.slug,
      category: r.category || '',
      title: r.title,
      excerpt: r.excerpt || '',
      author: r.author || '',
      date: fmtDate(r.article_date),
      readTime: r.read_time || '',
      image: r.image || '',
      intro: r.intro || '',
      sections: parseArr(r.sections),
      gallery: parseArr(r.gallery),
      tags: splitTags(r.tags),
    };
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
