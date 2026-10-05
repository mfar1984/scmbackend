import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import db from '@/lib/db';
import { sendMail } from '@/lib/mailer';

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Public: a visitor requests a gated download. We email a verification
// link; clicking it verifies the token and unlocks the file.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  res.setHeader('Access-Control-Allow-Origin', '*');

  const b = req.body || {};
  const id = parseInt(b.download_id);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid download.' });
  const email = String(b.email || '').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'A valid email is required.' });

  try {
    const dl = await db('web_downloads').where({ id, status: 'Active' }).first();
    if (!dl) return res.status(404).json({ success: false, message: 'Download not found.' });

    // Non-gated: nothing to verify
    if (!dl.require_email) return res.status(200).json({ success: true, gated: false, url: `/api/public/downloads/${id}` });

    const token = crypto.randomBytes(24).toString('hex');
    await db('web_download_logs').insert({
      download_id: id, kind: 'download', email, name: b.name?.trim() || null, company: b.company?.trim() || null,
      token, verified: 0,
    });

    const webBase = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const verifyUrl = `${webBase}/resources/download/verify?token=${token}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:28px;border-radius:12px;">
        <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:22px;border-radius:10px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:19px;">Confirm Your Download</h1>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:24px;margin-top:16px;color:#374151;font-size:14px;line-height:1.6;">
          <p>Thank you for your interest in <strong>${esc(dl.title)}</strong>.</p>
          <p>Click the button below to verify your email and start your download.</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${verifyUrl}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:500;display:inline-block;">Verify &amp; Download</a>
          </p>
          <p style="font-size:12.5px;color:#6b7280;">If the button doesn't work, copy this link:<br><span style="color:#2563eb;word-break:break-all;">${verifyUrl}</span></p>
        </div>
        <p style="color:#9ca3af;font-size:11px;margin-top:18px;text-align:center;">&copy; ${new Date().getFullYear()} ATLINE SDN BHD</p>
      </div>`;

    await sendMail({ profileKey: null, to: email, subject: `Download: ${dl.title}`, html });
    return res.status(200).json({ success: true, gated: true, message: 'Verification email sent. Please check your inbox.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to process request.' });
  }
}
