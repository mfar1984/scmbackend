import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

function maskPass(v: string | null): string {
  if (!v) return '';
  if (v.length <= 4) return '****';
  return v.substring(0, 2) + '*'.repeat(Math.min(v.length - 2, 18));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = req.query.key as string;

  // ── GET single ──
  if (req.method === 'GET') {
    try {
      const row = await db('email_profiles').where({ profile_key: key }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Profile not found.' });
      return res.status(200).json({ success: true, data: { ...row, smtp_pass: maskPass(row.smtp_pass) } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── PUT update ──
  if (req.method === 'PUT') {
    const b = req.body || {};
    try {
      const existing = await db('email_profiles').where({ profile_key: key }).first();
      if (!existing) return res.status(404).json({ success: false, message: 'Profile not found.' });

      const update: Record<string, any> = {
        name:            b.name?.trim() || existing.name,
        from_name:       b.from_name?.trim() || null,
        from_email:      b.from_email?.trim() || null,
        reply_to:        b.reply_to?.trim() || null,
        smtp_host:       b.smtp_host?.trim() || null,
        smtp_port:       b.smtp_port?.trim() || '587',
        smtp_encryption: b.smtp_encryption || 'TLS',
        smtp_user:       b.smtp_user?.trim() || null,
        status:          b.status || 'Active',
      };
      // Only overwrite password if a new (non-masked) value provided
      if (typeof b.smtp_pass === 'string' && b.smtp_pass.trim() && !b.smtp_pass.includes('*')) {
        update.smtp_pass = b.smtp_pass;
      }

      await db('email_profiles').where({ profile_key: key }).update(update);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
