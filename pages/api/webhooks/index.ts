import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'settings.integration.api'))) return;

  // ── GET /api/webhooks ──────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const rows = await db('webhooks').orderBy('id', 'asc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── POST /api/webhooks ─────────────────────────────────────
  if (req.method === 'POST') {
    const { name, url, events } = req.body;
    if (!name?.trim() || !url?.trim()) {
      return res.status(400).json({ success: false, message: 'Name and URL are required.' });
    }
    try {
      const [id] = await db('webhooks').insert({
        name:   name.trim(),
        url:    url.trim(),
        events: events?.trim() || null,
        status: 'Active',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
