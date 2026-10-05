import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Public: list active products for the website catalog.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const rows = await db('web_products').where({ status: 'Active' })
      .select('id', 'title', 'tag', 'category', 'description', 'specs', 'brands', 'icon',
        db.raw("(image_path IS NOT NULL AND image_path <> '') AS has_image"))
      .orderBy('sort_order', 'asc').orderBy('id', 'desc');
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
