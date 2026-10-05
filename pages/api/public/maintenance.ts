import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Public maintenance status for the website. CORS open.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const rows = await db('config_settings').where({ module: 'maintenance' }).select('key', 'value');
    const m: Record<string, string> = {};
    for (const r of rows) m[r.key] = r.value || '';
    return res.status(200).json({
      success: true,
      data: {
        enabled: m.maintenance_mode === '1',
        message: m.maint_message || 'We are currently performing scheduled maintenance. We will be back shortly.',
        allow_ip: (m.maint_allow_ip || '').split(',').map(s => s.trim()).filter(Boolean),
      },
    });
  } catch (err: any) {
    // On error, never block the site
    return res.status(200).json({ success: true, data: { enabled: false, message: '', allow_ip: [] } });
  }
}
