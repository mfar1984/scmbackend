import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission } from '@/lib/serverPermissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }
  if (!(await requirePermission(req, res, 'settings.integration.holidays', 'Create'))) return;
  const { year } = req.body;

  try {
    let deleted = 0;

    if (year) {
      // Clear specific year only
      deleted = await db('public_holidays').where({ year: parseInt(year) }).delete();
    } else {
      // Clear all years
      deleted = await db('public_holidays').delete();
    }

    // Reset last sync if clearing all
    if (!year) {
      await db.raw(
        `INSERT INTO integration_settings (module, \`key\`, value) VALUES ('holidays','last_sync','')
         ON DUPLICATE KEY UPDATE value=''`
      );
    }

    return res.status(200).json({ success: true, deleted });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
