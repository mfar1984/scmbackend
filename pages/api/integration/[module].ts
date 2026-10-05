import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasPermission } from '@/lib/serverPermissions';

const ALLOWED_MODULES = ['email', 'api', 'weather', 'holidays', 'payments', 'sms', 'telegram'];

const MODULE_PERM: Record<string, string> = {
  email: 'settings.integration.email',
  api: 'settings.integration.api',
  weather: 'settings.integration.weather',
  holidays: 'settings.integration.holidays',
  payments: 'settings.integration.payments',
  sms: 'settings.integration.sms',
  telegram: 'settings.integration.telegram',
};

// Keys that contain sensitive data — never return plain value, return masked string
const SENSITIVE_KEYS = ['smtp_pass', 'api_key', 'secret_key', 'api_secret', 'webhook_secret', 'collection_id', 'bot_token'];

function maskValue(key: string, value: string): string {
  if (!SENSITIVE_KEYS.includes(key)) return value;
  if (!value) return '';
  // Return masked: show first 4 chars + asterisks
  if (value.length <= 4) return '****';
  return value.substring(0, 4) + '*'.repeat(Math.min(value.length - 4, 20));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const module = req.query.module as string;

  if (!ALLOWED_MODULES.includes(module)) {
    return res.status(400).json({ success: false, message: 'Invalid module.' });
  }

  // ── GET /api/integration/:module ────────────────────────────
  if (req.method === 'GET') {
    try {
      const rows = await db('integration_settings')
        .where({ module })
        .select('key', 'value', 'updated_at');

      // Convert rows to key-value object, masking sensitive fields
      const settings: Record<string, string> = {};
      for (const row of rows) {
        settings[row.key] = maskValue(row.key, row.value || '');
      }

      return res.status(200).json({ success: true, data: settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── PUT /api/integration/:module ────────────────────────────
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
        // Skip masked values — don't overwrite real value with mask
        if (SENSITIVE_KEYS.includes(key) && typeof value === 'string' && value.includes('****')) {
          continue;
        }

        // MySQL upsert: INSERT ... ON DUPLICATE KEY UPDATE
        await db.raw(
          'INSERT INTO `integration_settings` (`module`, `key`, `value`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
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
