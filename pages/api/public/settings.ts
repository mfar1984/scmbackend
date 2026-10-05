import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Public, read-only site settings for the website (social links, SEO defaults,
// analytics IDs, and basic contact info). CORS open. Never exposes secrets.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const rows = await db('config_settings')
      .whereIn('module', ['social_seo', 'general'])
      .select('module', 'key', 'value');

    const social: Record<string, string> = {};
    const seo: Record<string, string> = {};
    const general: Record<string, string> = {};

    for (const r of rows) {
      const v = (r.value || '').trim();
      if (r.module === 'general') { general[r.key] = v; continue; }
      // social_seo module
      if (['facebook', 'tiktok', 'whatsapp', 'linkedin', 'instagram', 'twitter'].includes(r.key)) social[r.key] = v;
      else seo[r.key] = v;
    }

    return res.status(200).json({
      success: true,
      data: {
        social: {
          facebook:  social.facebook  || '',
          tiktok:    social.tiktok    || '',
          whatsapp:  social.whatsapp  || '',
          linkedin:  social.linkedin  || '',
          instagram: social.instagram || '',
          twitter:   social.twitter   || '',
          email:     general.support_email || '',
          phone:     general.phone || '',
        },
        seo: {
          meta_title:    seo.meta_title || '',
          meta_desc:     seo.meta_desc || '',
          meta_keywords: seo.meta_keywords || '',
          og_image:      seo.og_image || '',
          gsc_code:      seo.gsc_code || '',
        },
        analytics: {
          ga_id:  seo.ga_id || '',
          gtm_id: seo.gtm_id || '',
        },
        site: {
          name:     general.site_name || '',
          url:      general.site_url || '',
          address:  general.address || '',
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
