import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Public read-only endpoint for the website to fetch legal page content.
const SLUGS = ['privacy-policy', 'terms-of-service', 'disclaimer'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const slug = String(req.query.slug || '');
  if (!SLUGS.includes(slug)) return res.status(400).json({ success: false, message: 'Invalid page.' });
  try {
    const row = await db('web_legal_pages').where({ slug, status: 'Published' })
      .select('slug', 'title', 'content', 'updated_at').first();
    if (!row) return res.status(404).json({ success: false, message: 'Not published.' });
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ success: true, data: row });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
