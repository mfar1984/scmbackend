import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

/**
 * Determines the day type for a given date and returns the suggested
 * overtime rate from settings.
 *
 * Day type resolution order:
 *   1. Public holiday  (public_holidays / custom_holidays) -> applies_to 'holiday'
 *   2. Weekend (Sat/Sun)                                   -> applies_to 'rest_day'
 *   3. Otherwise normal working day                        -> applies_to 'normal'
 *
 * GET /api/hr/overtime/day-check?date=2026-05-30[&state=SGR]
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const dateStr = req.query.date as string;
  if (!dateStr) return res.status(400).json({ success: false, message: 'Date is required.' });

  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return res.status(400).json({ success: false, message: 'Invalid date.' });

  try {
    // resolve the default state for holiday filtering
    let state = (req.query.state as string) || '';
    if (!state) {
      const s = await db('integration_settings').where({ module: 'holidays', key: 'default_state' }).first();
      state = s?.value || 'SGR';
    }

    const year = d.getFullYear();
    const dow = d.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dow === 0 || dow === 6;

    // ── Check public holidays ──
    let holidayName: string | null = null;
    const phs = await db('public_holidays').where({ date: dateStr, is_active: 1 });
    for (const h of phs) {
      if (h.type === 'national') { holidayName = h.name_en || h.name; break; }
      if (h.type === 'regional' && h.state_codes) {
        try {
          const codes = typeof h.state_codes === 'string' ? JSON.parse(h.state_codes) : h.state_codes;
          if (Array.isArray(codes) && codes.includes(state)) { holidayName = h.name_en || h.name; break; }
        } catch { /* ignore */ }
      }
    }
    // ── Check custom holidays (date range) ──
    if (!holidayName) {
      const ch = await db('custom_holidays')
        .where('start_date', '<=', dateStr)
        .andWhere('end_date', '>=', dateStr)
        .first();
      if (ch) holidayName = ch.name;
    }

    let dayType: string; let appliesTo: string; let label: string; let badge: 'holiday' | 'weekend' | 'normal';
    if (holidayName) {
      dayType = 'Public Holiday'; appliesTo = 'holiday'; label = holidayName; badge = 'holiday';
    } else if (isWeekend) {
      dayType = 'Weekend'; appliesTo = 'rest_day'; label = 'Weekend Day'; badge = 'weekend';
    } else {
      dayType = 'Normal Day'; appliesTo = 'normal'; label = 'Normal Working Day'; badge = 'normal';
    }

    // ── Find suggested rate ──
    let rate = await db('hr_overtime_rates').where({ applies_to: appliesTo, status: 'Active' }).first();
    // fallback: any active rate
    if (!rate) rate = await db('hr_overtime_rates').where({ status: 'Active' }).orderBy('multiplier', 'asc').first();

    return res.status(200).json({
      success: true,
      date: dateStr,
      year,
      day_type: dayType,
      day_label: label,
      badge,
      holiday_name: holidayName,
      suggested_rate: rate ? { id: rate.id, name: rate.name, multiplier: rate.multiplier } : null,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
