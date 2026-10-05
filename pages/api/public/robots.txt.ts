import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Serves the admin-configured robots.txt content. Falls back to a sane default.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed.');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  try {
    const gen = await db('config_settings').where({ module: 'general', key: 'site_url' }).first();
    const base = (gen?.value || 'https://atline.com.my').replace(/\/$/, '');
    const row = await db('config_settings').where({ module: 'social_seo', key: 'robots_txt' }).first();
    const fallback = `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml`;
    const content = (row?.value || '').trim() || fallback;
    return res.status(200).send(content);
  } catch {
    return res.status(200).send('User-agent: *\nAllow: /');
  }
}
