import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { requirePermission } from '@/lib/serverPermissions';

const TABLE = 'ops_proposals';

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (v: any) => v != null && v !== '' ? `RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '—';
const dateStr = (v: any) => v ? String(v).slice(0, 10) : '—';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  if (!(await requirePermission(req, res, 'ops.business_dev.proposals', 'Update'))) return;

  const b = req.body || {};
  const id = parseInt(b.id);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid proposal.' });

  const to = (b.to || '').trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ success: false, message: 'A valid recipient email is required.' });

  try {
    const p = await db(TABLE).where({ id }).first();
    if (!p) return res.status(404).json({ success: false, message: 'Proposal not found.' });

    const clientName = p.client_name || b.client_name || 'Valued Client';
    const subject = (b.subject || '').trim() || `Proposal: ${p.title}`;
    const intro = (b.message || '').trim();

    const attachments = [];
    if (p.doc_data && String(p.doc_data).startsWith('data:')) {
      attachments.push({ filename: p.doc_name || 'proposal.pdf', content: p.doc_data });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f9fafb; padding: 28px; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 22px 24px; border-radius: 10px; color: #fff;">
          <div style="font-size: 13px; opacity: .85; letter-spacing: .5px;">ATLINE SDN BHD</div>
          <div style="font-size: 18px; font-weight: 600; margin-top: 4px;">${esc(p.title)}</div>
          ${p.ref_no ? `<div style="font-size: 12px; opacity: .8; margin-top: 4px;">Ref: ${esc(p.ref_no)}</div>` : ''}
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 22px; margin-top: 16px; color: #374151; font-size: 14px; line-height: 1.6;">
          <p style="margin-top: 0;">Dear ${esc(clientName)},</p>
          ${intro ? `<p>${esc(intro).replace(/\n/g, '<br>')}</p>` : `<p>Please find attached our proposal for your kind consideration. A summary is provided below.</p>`}
          <table style="width: 100%; border-collapse: collapse; margin: 18px 0;">
            ${p.summary ? `<tr><td style="padding: 8px 10px; border-bottom: 1px solid #eef2f7; color: #6b7280; width: 150px;">Summary</td><td style="padding: 8px 10px; border-bottom: 1px solid #eef2f7;">${esc(p.summary)}</td></tr>` : ''}
            <tr><td style="padding: 8px 10px; border-bottom: 1px solid #eef2f7; color: #6b7280;">Proposed Value</td><td style="padding: 8px 10px; border-bottom: 1px solid #eef2f7; font-weight: 600;">${money(p.value)}</td></tr>
            <tr><td style="padding: 8px 10px; border-bottom: 1px solid #eef2f7; color: #6b7280;">Issued Date</td><td style="padding: 8px 10px; border-bottom: 1px solid #eef2f7;">${dateStr(p.issued_date)}</td></tr>
            <tr><td style="padding: 8px 10px; color: #6b7280;">Valid Until</td><td style="padding: 8px 10px;">${dateStr(p.valid_until)}</td></tr>
          </table>
          ${attachments.length ? `<p style="font-size: 13px; color: #6b7280;"><i>The full proposal document is attached to this email.</i></p>` : ''}
          <p style="margin-bottom: 0;">Thank you for your consideration. We look forward to working with you.</p>
          <p style="margin-bottom: 0;">Best regards,<br><strong>ATLINE SDN BHD</strong></p>
        </div>
        <p style="color: #9ca3af; font-size: 11px; margin-top: 20px; text-align: center;">&copy; ${new Date().getFullYear()} ATLINE SDN BHD · ICT Infrastructure Engineering &amp; Consulting</p>
      </div>`;

    await sendMail({ profileKey: b.profile || null, to, cc: b.cc?.trim() || undefined, subject, html, attachments });

    await db(TABLE).where({ id }).update({
      status: p.status === 'Draft' ? 'Sent' : p.status,
      sent_at: db.fn.now(), sent_to: to,
    });

    return res.status(200).json({ success: true, message: `Proposal sent to ${to}.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to send proposal.' });
  }
}
