import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

const TABLE = 'web_legal_pages';
const SLUGS = ['privacy-policy', 'terms-of-service', 'disclaimer'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE).whereIn('slug', SLUGS).select('id', 'slug', 'title', 'status', 'updated_at');
      // ensure all three present (in case seed missed)
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
