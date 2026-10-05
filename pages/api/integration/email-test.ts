import type { NextApiRequest, NextApiResponse } from 'next';
import { sendMail, resolveProfile } from '@/lib/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const { to, profile } = req.body;
  if (!to?.trim()) {
    return res.status(400).json({ success: false, message: 'Recipient email is required.' });
  }

  try {
    const p = await resolveProfile(profile || null);

    await sendMail({
      profileKey: profile || null,
      to: to.trim(),
      subject: 'ATLINE Admin — SMTP Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">SMTP Test Successful</h1>
          </div>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            This is a test email from the <strong>${p.name}</strong> profile in the ATLINE Admin Panel.
          </p>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Your SMTP configuration is working correctly.
          </p>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 20px;">
            <p style="margin: 0; font-size: 13px; color: #6b7280;">
              <strong>Profile:</strong> ${p.name}<br>
              <strong>Host:</strong> ${p.smtp_host}<br>
              <strong>Port:</strong> ${p.smtp_port}<br>
              <strong>From:</strong> ${p.from_email || p.smtp_user}
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">
            &copy; ${new Date().getFullYear()} ATLINE SDN BHD · Admin Panel
          </p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: `Test email sent to ${to} via ${p.name}.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to send test email.' });
  }
}
