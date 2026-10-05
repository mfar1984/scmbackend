import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { notifyTelegramTrigger } from '@/lib/telegram';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { sendMail, resolveProfile } from '@/lib/mailer';

// Allow larger JSON bodies for base64-encoded document uploads
export const config = {
  api: {
    bodyParser: { sizeLimit: '30mb' },
  },
};

function applyCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const validDoc = (v: any) => (typeof v === 'string' && v.startsWith('data:') && v.length < 8_000_000) ? v : null;

async function nextRef(trx: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SUP-${year}-`;
  const last = await trx('supplier_registrations')
    .where('reference_no', 'like', `${prefix}%`).orderBy('id', 'desc').first();
  let seq = 1;
  if (last?.reference_no) {
    const n = parseInt(String(last.reference_no).split('-').pop() || '0');
    if (!isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

const arr = (v: any) => Array.isArray(v) ? v.join(', ') : (v || null);
const esc = (s: any) => String(s ?? '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

/** Send applicant auto-reply + internal admin notification (best-effort). */
async function sendRegistrationEmails(b: any, ref: string) {
  const company = esc(b.company_name);
  const services = Array.isArray(b.services) ? b.services.join(', ') : (b.services || '—');
  const shell = (title: string, inner: string) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#1e3a5f,#0052cc);padding:22px 24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">${title}</h1>
      </div>
      <div style="padding:24px;background:#f7faff;color:#33455e;font-size:14px;line-height:1.7;">${inner}</div>
      <div style="text-align:center;padding:16px;color:#9aa7bd;font-size:12px;">&copy; ${new Date().getFullYear()} Ships Classification Malaysia (SCM)</div>
    </div>`;

  // 1) Auto-reply to applicant
  try {
    if (b.email) {
      await sendMail({
        to: String(b.email).trim(),
        subject: `SCM Vendor Registration Received — ${ref}`,
        html: shell('Registration Received', `
          <p>Dear ${esc(b.director_name) || 'Applicant'},</p>
          <p>Thank you for registering <strong>${company}</strong> as an SCM approved vendor / service supplier. Your submission has been received and is pending review.</p>
          <p style="background:#eef4ff;border:1px solid #c8d8f0;border-radius:8px;padding:10px 14px;">
            <strong>Reference No:</strong> ${esc(ref)}<br/>
            <strong>Service Categories:</strong> ${esc(services)}
          </p>
          <p>Our team will review your application and contact you regarding the approval and vendor-audit process. Please keep this reference number for future correspondence.</p>
          <p>Regards,<br/>Ships Classification Malaysia (SCM)</p>`),
      });
    }
  } catch { /* ignore */ }

  // 2) Internal admin notification
  try {
    const profile = await resolveProfile(null);
    const adminTo = process.env.SUPPLIER_NOTIFY_EMAIL || profile.from_email || profile.smtp_user;
    if (adminTo) {
      await sendMail({
        to: adminTo,
        subject: `New Vendor Registration — ${company} (${ref})`,
        html: shell('New Vendor Registration', `
          <p>A new vendor registration has been submitted via the website.</p>
          <table style="width:100%;border-collapse:collapse;font-size:13.5px;">
            <tr><td style="padding:6px 0;width:150px;color:#8a97ad;">Reference</td><td>${esc(ref)}</td></tr>
            <tr><td style="padding:6px 0;color:#8a97ad;">Company</td><td>${company}</td></tr>
            <tr><td style="padding:6px 0;color:#8a97ad;">SSM</td><td>${esc(b.ssm)}</td></tr>
            <tr><td style="padding:6px 0;color:#8a97ad;">Services</td><td>${esc(services)}</td></tr>
            <tr><td style="padding:6px 0;color:#8a97ad;">Contact</td><td>${esc(b.director_name)} — ${esc(b.director_contact)}</td></tr>
            <tr><td style="padding:6px 0;color:#8a97ad;">Email</td><td>${esc(b.email)}</td></tr>
            <tr><td style="padding:6px 0;color:#8a97ad;">State</td><td>${esc(b.state)}</td></tr>
          </table>
          <p style="margin-top:16px;">Review it under <strong>Application &rarr; Procurement</strong> in the admin panel.</p>`),
      });
    }
  } catch { /* ignore */ }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const b = req.body || {};
  if (!b.company_name?.trim()) return res.status(400).json({ success: false, message: 'Company name is required.' });
  if (!b.email?.trim())        return res.status(400).json({ success: false, message: 'Email is required.' });

  // Spam protection (skipped automatically when RECAPTCHA_SECRET_KEY is not set)
  const rc = await verifyRecaptcha(b.recaptcha_token);
  if (!rc.ok) return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed. Please try again.' });

  try {
    const result = await db.transaction(async (trx) => {
      const reference_no = await nextRef(trx);
      const [id] = await trx('supplier_registrations').insert({
        reference_no,
        status: 'Pending',
        company_name:  b.company_name.trim(),
        ssm:           b.ssm?.trim() || null,
        company_type:  b.company_type || null,
        incorporation: b.incorporation || null,
        address:       b.address?.trim() || null,
        city:          b.city?.trim() || null,
        state:         b.state || null,
        postcode:      b.postcode?.trim() || null,
        office_phone:  b.office_phone?.trim() || null,
        fax:           b.fax?.trim() || null,
        mobile:        b.mobile?.trim() || null,
        email:         b.email.trim(),
        website:       b.website?.trim() || null,
        mof:           b.mof?.trim() || null,
        cidb:          b.cidb?.trim() || null,
        cidb_grade:    b.cidb_grade || null,
        bumiputera:    b.bumiputera || null,
        paid_capital:  b.paid_capital?.trim() || null,
        num_employees: b.num_employees?.toString().trim() || null,
        turnover:      b.turnover || null,
        years_in_biz:  b.years_in_biz?.toString().trim() || null,
        bank_name:     b.bank_name?.trim() || null,
        bank_acc:      b.bank_acc?.trim() || null,
        bank_acc_name: b.bank_acc_name?.trim() || null,
        services:      arr(b.services),
        nature_of_biz: b.nature_of_biz?.trim() || null,
        prod_desc:     b.prod_desc?.trim() || null,
        accreditations: b.accreditations?.trim() || null,
        director_name: b.director_name?.trim() || null,
        director_ic:   b.director_ic?.trim() || null,
        director_position: b.director_position?.trim() || null,
        director_contact:  b.director_contact?.trim() || null,
        // ── Documents ──
        doc_ssm:        validDoc(b.doc_ssm),       doc_ssm_name:       b.doc_ssm_name?.trim() || null,
        doc_profile:    validDoc(b.doc_profile),   doc_profile_name:   b.doc_profile_name?.trim() || null,
        doc_mof:        validDoc(b.doc_mof),       doc_mof_name:       b.doc_mof_name?.trim() || null,
        doc_cidb:       validDoc(b.doc_cidb),      doc_cidb_name:      b.doc_cidb_name?.trim() || null,
        doc_financial:  validDoc(b.doc_financial), doc_financial_name: b.doc_financial_name?.trim() || null,
        doc_bank:       validDoc(b.doc_bank),      doc_bank_name:      b.doc_bank_name?.trim() || null,
        doc_other:      Array.isArray(b.doc_other) && b.doc_other.length ? JSON.stringify(
          b.doc_other.filter((o: any) => validDoc(o?.data)).slice(0, 10)
        ) : null,
      });
      return { id, reference_no };
    });
    notifyTelegramTrigger(
      'newRegistration',
      `<b>SCM</b>\n📥 New Vendor Registration\nCompany: ${b.company_name.trim()}\nRef: ${result.reference_no}`,
    ).catch(() => {});

    // Email: applicant auto-reply + admin notification (best-effort, never blocks).
    void sendRegistrationEmails(b, result.reference_no).catch(() => {});

    return res.status(201).json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
