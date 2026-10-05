import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

/**
 * PUBLIC endpoint — consumed by the SCM website (port 3000).
 * Returns only Published news articles (summary shape for the list page).
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  try {
    const rows = await db('web_news')
      .where({ status: 'Published' })
      .orderBy([{ column: 'is_featured', order: 'desc' }, { column: 'article_date', order: 'desc' }, { column: 'id', order: 'desc' }]);

    const data = rows.map((r: any) => ({
      slug: r.slug,
      category: r.category || '',
      title: r.title,
      excerpt: r.excerpt || '',
      author: r.author || '',
      date: fmtDate(r.article_date),
      readTime: r.read_time || '',
      image: r.image || '',
      tags: splitTags(r.tags),
      featured: !!r.is_featured,
    }));

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
