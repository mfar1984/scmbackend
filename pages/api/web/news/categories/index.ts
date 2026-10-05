import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission } from '@/lib/serverPermissions';

const TABLE = 'web_news_categories';
const PERM = 'web.news';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE).select('id', 'name', 'sort_order', 'status', 'created_at', 'updated_at')
        .orderBy([{ column: 'sort_order', order: 'asc' }, { column: 'name', order: 'asc' }]);
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, PERM, 'Create'))) return;
    try {
      const name = (req.body?.name || '').trim();
      if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });
      const existing = await db(TABLE).where({ name }).first();
      if (existing) return res.status(409).json({ success: false, message: 'That category already exists.' });
      const [id] = await db(TABLE).insert({ name, sort_order: parseInt(req.body?.sort_order) || 0 });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
