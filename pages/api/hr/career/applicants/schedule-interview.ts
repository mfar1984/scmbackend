import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import db from '@/lib/db';
import { sendMail } from '@/lib/mailer';

const APP_URL = process.env.APP_PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:3001';

function fmtDate(d: string): string {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-MY', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return d; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const { id, interview_date, interview_time, interview_location, interview_notes, email_profile } = req.body || {};
  const appId = parseInt(id);
  if (isNaN(appId)) return res.status(400).json({ success: false, message: 'Invalid applicant ID.' });
  if (!interview_date) return res.status(400).json({ success: false, message: 'Interview date is required.' });

  try {
    const applicant = await db('hr_applicants').where({ id: appId }).first();
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found.' });
    if (!applicant.email) return res.status(400).json({ success: false, message: 'Applicant has no email address.' });

    const profileKey = email_profile || 'hr';
    const token = crypto.randomBytes(24).toString('hex');

    // Save interview details, set sub-status Pending
    await db('hr_applicants').where({ id: appId }).update({
      status: 'Interview Scheduled',
      interview_date,
      interview_time: interview_time || null,
      interview_location: interview_location || null,
      interview_notes: interview_notes || null,
      interview_substatus: 'Pending',
      interview_token: token,
      interview_confirmed_at: null,
      interview_email_profile: profileKey,
    });

    const confirmUrl = `${APP_URL}/career/confirm-interview?token=${token}`;
    const dateStr = fmtDate(interview_date);
    const timeStr = interview_time ? interview_time : null;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6a1b9a, #8e24aa); padding: 28px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 21px;">Interview Invitation</h1>
          <p style="color: rgba(255,255,255,.85); margin: 6px 0 0; font-size: 14px;">ATLINE SDN BHD</p>
        </div>
        <div style="padding: 28px;">
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">Dear <strong>${applicant.full_name}</strong>,</p>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Thank you for applying for the position of <strong>${applicant.position_applied || 'the role'}</strong>.
            We are pleased to invite you for an interview. The details are as follows:
          </p>
          <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; margin: 18px 0;">
            <table style="width: 100%; font-size: 14px; color: #374151; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #6b7280; width: 120px;">Date</td><td style="padding: 6px 0;"><strong>${dateStr}</strong></td></tr>
              ${timeStr ? `<tr><td style="padding: 6px 0; color: #6b7280;">Time</td><td style="padding: 6px 0;"><strong>${timeStr}</strong></td></tr>` : ''}
              ${interview_location ? `<tr><td style="padding: 6px 0; color: #6b7280;">Location</td><td style="padding: 6px 0;"><strong>${interview_location}</strong></td></tr>` : ''}
            </table>
            ${interview_notes ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #f3f4f6; font-size: 13px; color: #6b7280;">${interview_notes}</div>` : ''}
          </div>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Please confirm your attendance by clicking the button below. Kindly bring along your original certificates,
            IC, and a copy of your resume.
          </p>
          <div style="text-align: center; margin: 26px 0;">
            <a href="${confirmUrl}" style="display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
              ✓ Confirm Attendance
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
            If the button does not work, copy and paste this link into your browser:<br>
            <a href="${confirmUrl}" style="color: #2563eb; word-break: break-all;">${confirmUrl}</a>
          </p>
        </div>
        <div style="padding: 16px; background: #f3f4f6; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; ${new Date().getFullYear()} ATLINE SDN BHD · Human Resources
        </div>
      </div>
    `;

    await sendMail({
      profileKey,
      to: applicant.email,
      subject: `Interview Invitation — ${applicant.position_applied || 'ATLINE SDN BHD'}`,
      html,
    });

    return res.status(200).json({ success: true, message: `Interview email sent to ${applicant.email}.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to schedule interview.' });
  }
}
