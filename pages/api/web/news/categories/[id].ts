import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasPermission } from '@/lib/serverPermissions';

const TABLE = 'web_news_categories';
const PERM = 'web.news';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  const auth = await getAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  const perm = req.method === 'DELETE' ? 'Delete' : 'Update';
  if (!(await hasPermission(auth, PERM, perm))) {
    return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
  }

  if (req.method === 'PUT') {
    try {
      const exists = await db(TABLE).where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Not found.' });
      const upd: Record<string, any> = {};
      if (req.body?.name !== undefined) {
        const name = (req.body.name || '').trim();
        if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });
        const dup = await db(TABLE).where({ name }).whereNot({ id }).first();
        if (dup) return res.status(409).json({ success: false, message: 'That category already exists.' });
        upd.name = name;
      }
      if (req.body?.sort_order !== undefined) upd.sort_order = parseInt(req.body.sort_order) || 0;
      if (req.body?.status !== undefined) upd.status = req.body.status === 'Inactive' ? 'Inactive' : 'Active';
      await db(TABLE).where({ id }).update(upd);
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      await db(TABLE).where({ id }).delete();
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
