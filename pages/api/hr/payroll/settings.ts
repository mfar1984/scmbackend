import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';

const TABLE = 'hr_payroll_settings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.payroll.settings'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE).select('key', 'value');
      const settings: Record<string, string> = {};
      for (const r of rows) settings[r.key] = r.value || '';
      return res.status(200).json({ success: true, data: settings });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const updates = req.body as Record<string, string>;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid request body.' });
    }
    try {
      for (const [key, value] of Object.entries(updates)) {
        await db.raw(
          'INSERT INTO `hr_payroll_settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
          [key, value ?? '']
        );
      }
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
