import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── GET /api/holidays?year=2026&state=SGR ──────────────────
  if (req.method === 'GET') {
    const year  = req.query.year  || new Date().getFullYear();
    const state = req.query.state as string | undefined;

    try {
      let query = db('public_holidays')
        .where({ year: Number(year), is_active: 1 })
        .orderBy('date', 'asc');

      const holidays = await query;

      // Filter by state if provided — show national + that state's regional only
      const filtered = state
        ? holidays.filter((h: any) => {
            if (h.type === 'national') return true;
            if (h.type !== 'regional') return false;
            if (!h.state_codes) return false;
            try {
              const codes: string[] = typeof h.state_codes === 'string'
                ? JSON.parse(h.state_codes)
                : h.state_codes;
              return Array.isArray(codes) && codes.includes(state);
            } catch { return false; }
          })
        : holidays;

      // Get last sync time
      const syncRow = await db('integration_settings')
        .where({ module: 'holidays', key: 'last_sync' })
        .first();

      return res.status(200).json({
        success:   true,
        data:      filtered,
        last_sync: syncRow?.value || null,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── DELETE /api/holidays?id=123 ────────────────────────────
  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

    try {
      await db('public_holidays').where({ id }).update({ is_active: 0 });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
