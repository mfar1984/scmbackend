import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'settings.integration.api'))) return;
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  // ── PATCH /api/webhooks/:id — toggle status ────────────────
  if (req.method === 'PATCH') {
    try {
      const row = await db('webhooks').where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Webhook not found.' });
      const newStatus = row.status === 'Active' ? 'Inactive' : 'Active';
      await db('webhooks').where({ id }).update({ status: newStatus });
      return res.status(200).json({ success: true, status: newStatus });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── DELETE /api/webhooks/:id ───────────────────────────────
  if (req.method === 'DELETE') {
    try {
      await db('webhooks').where({ id }).delete();
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
