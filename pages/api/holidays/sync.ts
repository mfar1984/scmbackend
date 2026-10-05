import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission } from '@/lib/serverPermissions';

// date-holidays uses numeric codes for Malaysian states
const MY_STATES: Record<string, string> = {
  '01': 'Johor',
  '02': 'Kedah',
  '03': 'Kelantan',
  '04': 'Melaka',
  '05': 'Negeri Sembilan',
  '06': 'Pahang',
  '07': 'Pulau Pinang',
  '08': 'Perak',
  '09': 'Perlis',
  '10': 'Selangor',
  '11': 'Terengganu',
  '12': 'Sabah',
  '13': 'Sarawak',
  '14': 'W.P. Kuala Lumpur',
  '15': 'W.P. Labuan',
  '16': 'W.P. Putrajaya',
};

function getDayName(dateStr: string): string {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days[new Date(dateStr).getDay()];
}

// Extract YYYY-MM-DD from date-holidays date string
// date-holidays returns "2026-01-01 00:00:00" in local time
function parseDate(raw: string): string {
  // Take first 10 chars — always YYYY-MM-DD regardless of timezone
  return String(raw).slice(0, 10);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }
  if (!(await requirePermission(req, res, 'settings.integration.holidays', 'Create'))) return;

  const { year = new Date().getFullYear(), state } = req.body;
  const targetYear = parseInt(String(year));

  try {
    const Holidays = require('date-holidays');
    let synced  = 0;
    let skipped = 0;

    // ── Step 1: Get all national holidays ──────────────────
    const hdNational = new Holidays('MY');
    const nationalHols = hdNational.getHolidays(targetYear);
    const nationalNames = new Set(nationalHols.map((h: any) => h.name));

    for (const h of nationalHols) {
      const date    = parseDate(h.date);
      const dayName = getDayName(date);
      try {
        await db.raw(
          `INSERT INTO public_holidays (date, day_name, name, name_en, type, state_codes, year, is_active)
           VALUES (CAST(? AS DATE), ?, ?, ?, 'national', NULL, ?, 1)
           ON DUPLICATE KEY UPDATE day_name=VALUES(day_name), name=VALUES(name), type='national', state_codes=NULL, is_active=1`,
          [date, dayName, h.name, h.name, targetYear]
        );
        synced++;
      } catch { skipped++; }
    }

    // ── Step 2: Get state-specific holidays ────────────────
    const statesToSync = state ? [state] : Object.keys(MY_STATES);

    for (const stateCode of statesToSync) {
      const hdState   = new Holidays('MY', stateCode);
      const stateHols = hdState.getHolidays(targetYear);

      // Only process holidays NOT in national list
      const stateOnly = stateHols.filter((h: any) => !nationalNames.has(h.name));

      for (const h of stateOnly) {
        const date    = parseDate(h.date);
        const dayName = getDayName(date);

        try {
          // Check if already exists
          const existing = await db('public_holidays')
            .where({ date, name: h.name, year: targetYear })
            .first();

          if (existing) {
            if (existing.type === 'national') continue; // skip — already national

            // Add this state to existing state_codes (avoid duplicates)
            const currentCodes: string[] = existing.state_codes
              ? (typeof existing.state_codes === 'string'
                  ? JSON.parse(existing.state_codes)
                  : existing.state_codes)
              : [];

            if (!currentCodes.includes(stateCode)) {
              currentCodes.push(stateCode);
              await db('public_holidays')
                .where({ id: existing.id })
                .update({ state_codes: JSON.stringify(currentCodes), is_active: 1 });
              synced++;
            }
          } else {
            // Insert new regional holiday with only this state
            await db.raw(
              `INSERT INTO public_holidays (date, day_name, name, name_en, type, state_codes, year, is_active)
               VALUES (CAST(? AS DATE), ?, ?, ?, 'regional', ?, ?, 1)`,
              [date, dayName, h.name, h.name, JSON.stringify([stateCode]), targetYear]
            );
            synced++;
          }
        } catch { skipped++; }
      }
    }

    // ── Update last sync time ──────────────────────────────
    await db.raw(
      `INSERT INTO integration_settings (module, \`key\`, value) VALUES ('holidays','last_sync',?)
       ON DUPLICATE KEY UPDATE value=VALUES(value)`,
      [new Date().toISOString()]
    );

    // ── Return all holidays for this year ──────────────────
    const holidays = await db('public_holidays')
      .where({ year: targetYear, is_active: 1 })
      .orderBy('date', 'asc');

    const national = holidays.filter((h: any) => h.type === 'national').length;
    const regional = holidays.filter((h: any) => h.type === 'regional').length;

    return res.status(200).json({
      success: true,
      synced,
      skipped,
      year:     targetYear,
      total:    holidays.length,
      national,
      regional,
      holidays,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
