import nodemailer from 'nodemailer';
import db from './db';

export type MailProfile = {
  name: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  smtp_host: string;
  smtp_port: string;
  smtp_encryption: string;
  smtp_user: string;
  smtp_pass: string;
};

/**
 * Resolve SMTP credentials for a given email profile key.
 * If the profile has its own SMTP host/user/pass, those are used.
 * Otherwise it falls back to the global SMTP settings in
 * integration_settings (module = 'email').
 */
export async function resolveProfile(profileKey?: string | null): Promise<MailProfile> {
  // global email settings (fallback)
  const rows = await db('integration_settings').where({ module: 'email' }).select('key', 'value');
  const g: Record<string, string> = {};
  for (const r of rows) g[r.key] = r.value || '';

  let p: any = null;
  if (profileKey) {
    p = await db('email_profiles').where({ profile_key: profileKey, status: 'Active' }).first();
  }

  const pick = (profileVal: string | undefined | null, globalVal: string | undefined) =>
    (profileVal && String(profileVal).trim()) ? String(profileVal) : (globalVal || '');

  return {
    name:            p?.name || 'Default',
    from_name:       pick(p?.from_name,  g.from_name) || 'ATLINE SDN BHD',
    from_email:      pick(p?.from_email, g.from_email || g.smtp_user),
    reply_to:        pick(p?.reply_to,   g.reply_to),
    smtp_host:       pick(p?.smtp_host,  g.smtp_host),
    smtp_port:       pick(p?.smtp_port,  g.smtp_port) || '587',
    smtp_encryption: pick(p?.smtp_encryption, g.smtp_encryption) || 'TLS',
    smtp_user:       pick(p?.smtp_user,  g.smtp_user),
    // if the profile has no password of its own, fall back to global SMTP password
    smtp_pass:       (p?.smtp_pass && String(p.smtp_pass).trim()) ? String(p.smtp_pass) : (g.smtp_pass || ''),
  };
}

export type MailAttachment = {
  filename: string;
  /** base64 data URL (data:...;base64,xxxx) or raw base64 content */
  content?: string;
  path?: string;
  contentType?: string;
};

export type SendArgs = {
  profileKey?: string | null;
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string;
  attachments?: MailAttachment[];
};

/** Convert a data URL attachment to a nodemailer attachment object. */
function normalizeAttachment(a: MailAttachment) {
  if (a.content && a.content.startsWith('data:')) {
    const m = a.content.match(/^data:([^;]+);base64,([\s\S]*)$/);
    if (m) {
      return { filename: a.filename, content: Buffer.from(m[2], 'base64'), contentType: a.contentType || m[1] };
    }
  }
  return { filename: a.filename, content: a.content, path: a.path, contentType: a.contentType };
}

/**
 * Send an email using the resolved profile. Throws on failure.
 */
export async function sendMail({ profileKey, to, subject, html, text, cc, attachments }: SendArgs) {
  const p = await resolveProfile(profileKey);

  if (!p.smtp_host || !p.smtp_user || !p.smtp_pass) {
    throw new Error('SMTP settings incomplete. Configure the email profile or global SMTP settings first.');
  }

  const transporter = nodemailer.createTransport({
    host:   p.smtp_host,
    port:   parseInt(p.smtp_port || '587'),
    secure: p.smtp_encryption === 'SSL',
    auth:   { user: p.smtp_user, pass: p.smtp_pass },
    tls:    { rejectUnauthorized: false },
  });

  const info = await transporter.sendMail({
    from:    `"${p.from_name}" <${p.from_email || p.smtp_user}>`,
    to,
    cc:      cc || undefined,
    replyTo: p.reply_to || undefined,
    subject,
    text,
    html,
    attachments: attachments?.length ? attachments.map(normalizeAttachment) : undefined,
  });

  return { messageId: info.messageId, profile: p.name };
}
