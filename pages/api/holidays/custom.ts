import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'settings.integration.holidays'))) return;

  // ── GET /api/holidays/custom?year=2026 ─────────────────────
  if (req.method === 'GET') {
    const year = req.query.year || new Date().getFullYear();
    try {
      const rows = await db('custom_holidays')
        .whereRaw('YEAR(start_date) = ? OR YEAR(end_date) = ?', [year, year])
        .orderBy('start_date', 'asc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── POST /api/holidays/custom ──────────────────────────────
  if (req.method === 'POST') {
    const { start_date, end_date, name, state_codes, notes } = req.body;

    if (!start_date || !name?.trim()) {
      return res.status(400).json({ success: false, message: 'Date and name are required.' });
    }

    try {
      const [id] = await db('custom_holidays').insert({
        start_date,
        end_date:    end_date || start_date,
        name:        name.trim(),
        state_codes: state_codes ? JSON.stringify(state_codes) : null,
        notes:       notes?.trim() || null,
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── DELETE /api/holidays/custom?id=123 ─────────────────────
  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

    try {
      const row = await db('custom_holidays').where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      await recycleFromReq(req, { moduleKey: 'settings.integration.holidays', moduleLabel: 'Public Holidays', table: 'custom_holidays', id, label: `Holiday: ${pickLabel(row, ['name'], id)}` });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
