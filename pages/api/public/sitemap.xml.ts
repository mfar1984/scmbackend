import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Generates a valid sitemap.xml from enabled web_sitemap_entries.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed.');
  try {
    const gen = await db('config_settings').where({ module: 'general', key: 'site_url' }).first();
    const base = (gen?.value || 'https://atline.com.my').replace(/\/$/, '');
    const rows = await db('web_sitemap_entries').where({ enabled: 1 }).orderBy('sort_order', 'asc');

    const urls = rows.map((r: any) => {
      const loc = /^https?:\/\//i.test(r.loc) ? r.loc : base + r.loc;
      const lastmod = r.updated_at ? new Date(r.updated_at).toISOString().slice(0, 10) : '';
      return `  <url>\n    <loc>${esc(loc)}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <changefreq>${r.changefreq}</changefreq>\n    <priority>${Number(r.priority).toFixed(1)}</priority>\n  </url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(xml);
  } catch (err: any) { return res.status(500).send('Error generating sitemap.'); }
}
