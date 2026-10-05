import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrudAny } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

const TABLE = 'web_vendor_categories';
const PERMS = ['ops.procurement', 'web.resources.vendors'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrudAny(req, res, PERMS))) return;
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  if (req.method === 'PUT') {
    const b = req.body || {};
    try {
      const exists = await db(TABLE).where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Category not found.' });
      const upd: Record<string, any> = {};
      if (b.name !== undefined && b.name.trim()) {
        const dup = await db(TABLE).where({ name: b.name.trim() }).whereNot({ id }).first();
        if (dup) return res.status(409).json({ success: false, message: 'Another category already uses this name.' });
        // keep existing vendors in sync when the canonical name changes
        if (b.name.trim() !== exists.name) {
          await db('ops_vendors').where({ category: exists.name }).update({ category: b.name.trim() });
        }
        upd.name = b.name.trim();
      }
      if (b.short_label !== undefined) upd.short_label = b.short_label?.trim() || null;
      if (b.icon !== undefined) upd.icon = b.icon?.trim() || 'bi-clipboard-check';
      if (b.description !== undefined) upd.description = b.description?.trim() || null;
      if (b.sort_order !== undefined) upd.sort_order = parseInt(b.sort_order) || 0;
      if (b.status !== undefined) upd.status = b.status === 'Inactive' ? 'Inactive' : 'Active';
      await db(TABLE).where({ id }).update(upd);
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Category not found.' });
      const inUse = await db('ops_vendors').where({ category: row.name }).count({ c: 'id' }).first();
      if (Number((inUse as any)?.c) > 0) {
        return res.status(409).json({ success: false, message: `Cannot delete — ${(inUse as any).c} vendor(s) use this category. Reassign them first or set the category to Inactive.` });
      }
      await recycleFromReq(req, { moduleKey: 'ops.procurement', moduleLabel: 'Vendor Categories', table: TABLE, id, label: `Category: ${pickLabel(row, ['name'], id)}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
