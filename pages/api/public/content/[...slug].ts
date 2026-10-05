import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { PAGE_DEFAULTS } from '@/lib/webContentDefaults';

// Public read-only content for the website. Returns saved JSON if
// Published, otherwise the built-in defaults so the site never breaks.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const parts = req.query.slug as string[] | undefined;
  const slug = (parts || []).join('/');

  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const row = await db('web_page_content').where({ slug }).first();
    let content = PAGE_DEFAULTS[slug] || null;
    if (row?.content && row.status === 'Published') {
      try { content = JSON.parse(row.content); } catch { /* keep defaults */ }
    }
    if (!content) return res.status(404).json({ success: false, message: 'Not found.' });
    return res.status(200).json({ success: true, data: content });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
