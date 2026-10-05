import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Public: active vendor service categories (drives website discovery + filters).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const rows = await db('web_vendor_categories')
      .where({ status: 'Active' })
      .select('name', 'short_label', 'icon', 'description')
      .orderBy('sort_order', 'asc').orderBy('name', 'asc');
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
