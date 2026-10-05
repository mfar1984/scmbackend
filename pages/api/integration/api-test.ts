import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const { test_type } = req.body;

  try {
    // Load API settings from DB
    const rows = await db('integration_settings').where({ module: 'api' }).select('key', 'value');
    const s: Record<string, string> = {};
    for (const row of rows) s[row.key] = row.value || '';

    // ── Test: Verify API Key ──────────────────────────────
    if (test_type === 'api_key') {
      const { api_key } = req.body;
      if (!s.api_key) {
        return res.status(400).json({ success: false, message: 'No API key configured. Generate and save one first.' });
      }
      const match = api_key === s.api_key;
      return res.status(200).json({
        success: match,
        message: match
          ? 'API key is valid. Authentication successful.'
          : 'API key does not match. Authentication failed.',
        details: {
          key_length:  s.api_key.length,
          key_prefix:  s.api_key.substring(0, 9) + '...',
          tested_at:   new Date().toISOString(),
        },
      });
    }

    // ── Test: CORS Headers ────────────────────────────────
    if (test_type === 'cors') {
      const { origin } = req.body;
      const allowedOrigins = (s.allowed_origins || '').split('\n').map((o: string) => o.trim()).filter(Boolean);
      const corsEnabled    = s.cors_enabled !== '0';

      if (!corsEnabled) {
        return res.status(200).json({ success: false, message: 'CORS is disabled. All cross-origin requests will be blocked.' });
      }

      const isAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);
      return res.status(200).json({
        success: isAllowed,
        message: isAllowed
          ? `Origin "${origin}" is allowed.`
          : `Origin "${origin}" is NOT in the allowed origins list.`,
        details: {
          cors_enabled:    corsEnabled,
          allowed_origins: allowedOrigins,
          tested_origin:   origin,
        },
      });
    }

    // ── Test: Webhook Signature ───────────────────────────
    if (test_type === 'webhook_signature') {
      const { payload } = req.body;
      if (!s.webhook_secret) {
        return res.status(400).json({ success: false, message: 'No webhook secret configured. Generate and save one first.' });
      }

      const body      = JSON.stringify(payload || { event: 'test', timestamp: Date.now() });
      const signature = 'sha256=' + crypto.createHmac('sha256', s.webhook_secret).update(body).digest('hex');

      return res.status(200).json({
        success: true,
        message: 'Webhook signature generated successfully.',
        details: {
          payload:   JSON.parse(body),
          signature,
          header:    'X-ATLINE-Signature',
          algorithm: 'HMAC-SHA256',
          usage:     `Set header: X-ATLINE-Signature: ${signature}`,
        },
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid test_type.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
