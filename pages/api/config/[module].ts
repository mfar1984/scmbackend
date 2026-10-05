import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasPermission } from '@/lib/serverPermissions';

// Branding logos/favicon are stored as base64 data URLs — allow larger payloads.
export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };

const ALLOWED_MODULES = ['general', 'branding', 'social_seo', 'backup', 'maintenance'];

const MODULE_PERM: Record<string, string> = {
  general: 'settings.config.general',
  branding: 'settings.config.branding',
  social_seo: 'settings.config.social_seo',
  backup: 'settings.config.backup',
  maintenance: 'settings.config.maintenance',
};

// Sensitive keys — mask on GET
const SENSITIVE_KEYS = ['s3_secret', 's3_key', 'r2_secret', 'r2_access_key', 'ftp_pass'];

function maskValue(key: string, value: string): string {
  if (!SENSITIVE_KEYS.includes(key)) return value;
  if (!value) return '';
  if (value.length <= 4) return '****';
  return value.substring(0, 4) + '*'.repeat(Math.min(value.length - 4, 20));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const module = req.query.module as string;

  if (!ALLOWED_MODULES.includes(module)) {
    return res.status(400).json({ success: false, message: 'Invalid module.' });
  }

  // ── GET /api/config/:module ──────────────────────────────
  if (req.method === 'GET') {
    try {
      const rows = await db('config_settings').where({ module }).select('key', 'value');
      const settings: Record<string, string> = {};
      for (const row of rows) {
        settings[row.key] = maskValue(row.key, row.value || '');
      }
      return res.status(200).json({ success: true, data: settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── PUT /api/config/:module ──────────────────────────────
  if (req.method === 'PUT') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    if (!(await hasPermission(auth, MODULE_PERM[module], 'Update'))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    const updates = req.body as Record<string, string>;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid request body.' });
    }
    try {
      for (const [key, value] of Object.entries(updates)) {
        // Skip masked sensitive values
        if (SENSITIVE_KEYS.includes(key) && typeof value === 'string' && value.includes('****')) {
          continue;
        }
        await db.raw(
          'INSERT INTO `config_settings` (`module`, `key`, `value`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
          [module, key, value ?? '']
        );
      }
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
