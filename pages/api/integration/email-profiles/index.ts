import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

function maskPass(v: string | null): string {
  if (!v) return '';
  if (v.length <= 4) return '****';
  return v.substring(0, 2) + '*'.repeat(Math.min(v.length - 2, 18));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ── GET (list profiles) ──
  if (req.method === 'GET') {
    try {
      const rows = await db('email_profiles').orderBy('id', 'asc');
      const data = rows.map((r: any) => ({ ...r, smtp_pass: maskPass(r.smtp_pass) }));
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
