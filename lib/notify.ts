import db from './db';
import { sendMail } from './mailer';

/**
 * HR submission notifications.
 * Creates an in-app notification (drives the admin topbar bell + sidebar
 * badges) and emails the HR department. Email failures never block the
 * submission — they are logged and swallowed.
 */

export type NotifyType = 'leave' | 'claim' | 'overtime' | 'expense';

const TYPE_META: Record<NotifyType, { label: string; link: string; refTable: string; icon: string }> = {
  leave:    { label: 'Leave Application',    link: '/hr/leave',    refTable: 'hr_leave_applications',    icon: 'bi-calendar-check-fill' },
  claim:    { label: 'Claim Application',    link: '/hr/claim',    refTable: 'hr_claim_applications',    icon: 'bi-receipt' },
  overtime: { label: 'Overtime Application', link: '/hr/overtime', refTable: 'hr_overtime_applications', icon: 'bi-clock-history' },
  expense:  { label: 'Expense Application',  link: '/hr/expenses', refTable: 'hr_expense_applications',  icon: 'bi-wallet2' },
};

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function employeeName(employeeId: number | null | undefined): Promise<string> {
  if (!employeeId) return 'An employee';
  try {
    const e = await db('hr_employees').where({ id: employeeId }).select('full_name', 'employee_id').first();
    if (!e) return 'An employee';
    return e.full_name + (e.employee_id ? ` (${e.employee_id})` : '');
  } catch { return 'An employee'; }
}

async function hrRecipient(): Promise<string> {
  try {
    const row = await db('config_settings').where({ module: 'general', key: 'hr_notify_email' }).first();
    if (row?.value?.trim()) return row.value.trim();
    const admin = await db('config_settings').where({ module: 'general', key: 'admin_email' }).first();
    return admin?.value?.trim() || '';
  } catch { return ''; }
}

export type NotifyArgs = {
  type: NotifyType;
  employeeId: number | null;
  refId: number;
  referenceNo?: string;
  /** short extra context, e.g. "Annual Leave · 3 days" or "RM 250.00" */
  detail?: string;
};

/** Fire-and-forget: create notification row + email HR. Never throws. */
export async function notifyHrSubmission(args: NotifyArgs): Promise<void> {
  const meta = TYPE_META[args.type];
  if (!meta) return;

  const actor = await employeeName(args.employeeId);
  const refTxt = args.referenceNo ? `[${args.referenceNo}] ` : '';
  const title = `New ${meta.label}`;
  const message = `${actor} submitted a ${meta.label.toLowerCase()}${args.detail ? ` — ${args.detail}` : ''}.`;

  // 1) In-app notification (drives bell + sidebar badge)
  try {
    await db('notifications').insert({
      type: args.type,
      title,
      message: message.slice(0, 400),
      link: meta.link,
      ref_table: meta.refTable,
      ref_id: args.refId,
      reference_no: args.referenceNo || null,
      actor,
      is_read: 0,
    });
  } catch { /* never block submission */ }

  // 2) Email HR (best-effort)
  try {
    const to = await hrRecipient();
    if (to) {
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:28px;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:20px;border-radius:10px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:18px;">${esc(title)}</h1>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:22px;margin-top:16px;color:#374151;font-size:14px;line-height:1.7;">
            <p style="margin:0 0 10px;">${refTxt}${esc(message)}</p>
            <table style="width:100%;border-collapse:collapse;font-size:13.5px;margin-top:8px;">
              <tr><td style="padding:6px 0;color:#6b7280;width:130px;">Submitted by</td><td style="padding:6px 0;color:#111827;">${esc(actor)}</td></tr>
              ${args.referenceNo ? `<tr><td style="padding:6px 0;color:#6b7280;">Reference</td><td style="padding:6px 0;color:#111827;font-family:monospace;">${esc(args.referenceNo)}</td></tr>` : ''}
              ${args.detail ? `<tr><td style="padding:6px 0;color:#6b7280;">Details</td><td style="padding:6px 0;color:#111827;">${esc(args.detail)}</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#6b7280;">Status</td><td style="padding:6px 0;"><span style="background:#fef9c3;color:#a16207;padding:2px 10px;border-radius:10px;font-size:12px;">Pending</span></td></tr>
            </table>
            <p style="text-align:center;margin:22px 0 4px;">
              <a href="${(process.env.APP_PUBLIC_URL || 'http://localhost:3001').replace(/\/$/, '')}${meta.link}" style="background:#2563eb;color:#fff;text-decoration:none;padding:11px 26px;border-radius:8px;font-weight:500;display:inline-block;">Review in Admin Panel</a>
            </p>
          </div>
          <p style="color:#9ca3af;font-size:11px;margin-top:16px;text-align:center;">&copy; ${new Date().getFullYear()} ATLINE SDN BHD — HR Notification</p>
        </div>`;
      await sendMail({ profileKey: 'hr', to, subject: `${title}: ${actor}`, html });
    }
  } catch { /* email failure must not break submission */ }
}


import { sendSmsIfEnabled, type SmsTrigger } from './sms';

const DECISION_META: Record<NotifyType, { label: string; smsApproved?: SmsTrigger; smsRejected?: SmsTrigger }> = {
  leave:    { label: 'Leave application',    smsApproved: 'leaveApproved', smsRejected: 'leaveRejected' },
  claim:    { label: 'Claim',                smsApproved: 'claimApproved', smsRejected: 'claimRejected' },
  overtime: { label: 'Overtime application', smsApproved: 'otApproved' },
  expense:  { label: 'Expense claim' },
};

const APP_TABLE: Record<NotifyType, string> = {
  leave: 'hr_leave_applications',
  claim: 'hr_claim_applications',
  overtime: 'hr_overtime_applications',
  expense: 'hr_expense_applications',
};

/**
 * Notify the EMPLOYEE of an approval decision (Approved / Rejected).
 * Always emails the employee (if they have an email); also sends an SMS
 * when the corresponding SMS trigger is enabled. Best-effort, never throws.
 */
export async function notifyEmployeeDecision(
  module: NotifyType, applicationId: number, decision: 'Approved' | 'Rejected', remarks?: string
): Promise<void> {
  try {
    const meta = DECISION_META[module];
    const table = APP_TABLE[module];
    if (!meta || !table) return;

    const app = await db(table).where({ id: applicationId }).first();
    if (!app) return;
    const emp = await db('hr_employees').where({ id: app.employee_id }).select('full_name', 'email', 'phone').first();
    if (!emp) return;

    const refNo = app.reference_no || `#${applicationId}`;
    const decided = decision === 'Approved' ? 'approved' : 'rejected';
    const subject = `Your ${meta.label} (${refNo}) was ${decided}`;
    const color = decision === 'Approved' ? '#16a34a' : '#dc2626';

    // ── Email the employee (best-effort) ──
    if (emp.email) {
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:28px;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:20px;border-radius:10px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:18px;">${meta.label} ${decision}</h1>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:22px;margin-top:16px;color:#374151;font-size:14px;line-height:1.7;">
            <p style="margin:0 0 10px;">Dear ${esc(emp.full_name)},</p>
            <p style="margin:0 0 10px;">Your ${esc(meta.label.toLowerCase())} <strong>${esc(refNo)}</strong> has been
              <strong style="color:${color};">${decided.toUpperCase()}</strong>.</p>
            ${remarks ? `<p style="margin:0 0 10px;background:#f3f4f6;padding:10px 12px;border-radius:8px;"><strong>Remarks:</strong> ${esc(remarks)}</p>` : ''}
            <p style="margin:14px 0 0;font-size:12.5px;color:#6b7280;">Log in to the Employee Self-Service portal for full details.</p>
          </div>
          <p style="color:#9ca3af;font-size:11px;margin-top:16px;text-align:center;">&copy; ${new Date().getFullYear()} ATLINE SDN BHD</p>
        </div>`;
      try { await sendMail({ profileKey: 'hr', to: emp.email, subject, html }); } catch { /* ignore */ }
    }

    // ── SMS the employee (only if the trigger is enabled) ──
    const trigger = decision === 'Approved' ? meta.smsApproved : meta.smsRejected;
    if (trigger && emp.phone) {
      const smsText = `ATLINE: Your ${meta.label.toLowerCase()} ${refNo} has been ${decided}.${remarks ? ` Remarks: ${remarks}` : ''}`.slice(0, 300);
      await sendSmsIfEnabled(trigger, emp.phone, smsText);
    }
  } catch { /* never block the approval action */ }
}
