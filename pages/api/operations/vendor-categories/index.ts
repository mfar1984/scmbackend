import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrudAny } from '@/lib/serverPermissions';

const TABLE = 'web_vendor_categories';
const PERMS = ['ops.procurement', 'web.resources.vendors'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrudAny(req, res, PERMS))) return;

  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE).select('*').orderBy('sort_order', 'asc').orderBy('name', 'asc');
      // attach how many vendors use each category
      const counts = await db('ops_vendors').select('category').count({ c: 'id' }).groupBy('category');
      const map: Record<string, number> = {};
      counts.forEach((r: any) => { if (r.category) map[r.category] = Number(r.c); });
      return res.status(200).json({ success: true, data: rows.map((r: any) => ({ ...r, vendor_count: map[r.name] || 0 })) });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.name?.trim()) return res.status(400).json({ success: false, message: 'Category name is required.' });
    try {
      const dup = await db(TABLE).where({ name: b.name.trim() }).first();
      if (dup) return res.status(409).json({ success: false, message: 'A category with this name already exists.' });
      const maxOrder = await db(TABLE).max({ m: 'sort_order' }).first();
      const [id] = await db(TABLE).insert({
        name: b.name.trim(),
        short_label: b.short_label?.trim() || b.name.trim(),
        icon: b.icon?.trim() || 'bi-clipboard-check',
        description: b.description?.trim() || null,
        sort_order: b.sort_order != null ? parseInt(b.sort_order) : (Number((maxOrder as any)?.m) || 0) + 1,
        status: b.status === 'Inactive' ? 'Inactive' : 'Active',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
