// Shared HR approval-flow engine.
//
// Behavior (matches the intended business rule):
//  - If an approval chain IS configured for the module, the application is
//    only fully "Approved" after the LAST level approves. Each approve step
//    advances current_level and records who approved. Any level can reject.
//  - If NO chain is configured, anyone with access can approve/reject directly
//    (single-step), recorded for audit.
//
// Records every action in hr_approval_records.
import db from './db';
import { getEssSession } from './essAuth';
import type { NextApiRequest } from 'next';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { notifyEmployeeDecision, type NotifyType } from './notify';
import { notifyTelegramTrigger } from './telegram';
import { getDateConfig, formatDate } from './dateFormat';
import { logAudit } from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'atline-secret';

// approvalFlow uses 'expenses'; the notify helper uses 'expense'.
const NOTIFY_TYPE: Record<string, NotifyType> = {
  leave: 'leave', claim: 'claim', overtime: 'overtime', expenses: 'expense',
};

// Map module + decision → Telegram trigger key (matches settings page keys).
const TG_TRIGGER: Record<string, { Approved?: string; Rejected?: string }> = {
  leave:    { Approved: 'leaveApproved', Rejected: 'leaveRejected' },
  claim:    { Approved: 'claimApproved', Rejected: 'claimRejected' },
  overtime: { Approved: 'otApproved' },
  expenses: {},
};

const TG_MODULE_LABEL: Record<string, string> = {
  leave: 'Leave', claim: 'Claim', overtime: 'Overtime', expenses: 'Expense',
};

/** Fire-and-forget Telegram notification for an approval decision. */
async function notifyTelegramDecision(module: string, appRow: any, decision: 'Approved' | 'Rejected', actorName: string) {
  try {
    const key = TG_TRIGGER[module]?.[decision];
    if (!key) return;
    const cfg = await getDateConfig();
    const when = formatDate(new Date(), cfg, true);
    const label = TG_MODULE_LABEL[module] || module;
    const ref = appRow.reference_no ? ` (${appRow.reference_no})` : '';
    const icon = decision === 'Approved' ? '✅' : '❌';
    const text =
      `<b>ATLINE SDN BHD</b>\n` +
      `${icon} ${label} ${decision}${ref}\n` +
      `By: ${actorName}\n` +
      `🕒 ${when}`;
    await notifyTelegramTrigger(key, text);
  } catch { /* never block the approval flow */ }
}

const TABLES: Record<string, string> = {
  leave: 'hr_leave_applications',
  claim: 'hr_claim_applications',
  overtime: 'hr_overtime_applications',
  expenses: 'hr_expense_applications',
};

async function getActor(req: NextApiRequest): Promise<{ id: number | null; name: string }> {
  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies['atline_token'];
    if (!token) return { id: null, name: 'System' };
    const payload: any = jwt.verify(token, JWT_SECRET);
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await db('user_sessions').where({ token_hash: hash }).where('expires_at', '>', new Date()).first();
    if (!session) return { id: null, name: 'System' };
    return { id: payload.id, name: payload.name || 'Administrator' };
  } catch { return { id: null, name: 'System' }; }
}

export type ApplyResult = { ok: boolean; status: number; body: any };

export async function applyApprovalAction(
  req: NextApiRequest, module: string, applicationId: number, action: 'Approved' | 'Rejected', remarks?: string
): Promise<ApplyResult> {
  const table = TABLES[module];
  if (!table) return { ok: false, status: 400, body: { success: false, message: 'Invalid module.' } };

  const appRow = await db(table).where({ id: applicationId }).first();
  if (!appRow) return { ok: false, status: 404, body: { success: false, message: 'Application not found.' } };

  const actor = await getActor(req);

  // Active approval chain for this module (ordered)
  const chain = await db('hr_approval_workflow')
    .where({ module, status: 'Active' })
    .orderBy('level', 'asc');

  // ── Reject: terminal at any level ──
  if (action === 'Rejected') {
    await db.transaction(async (trx) => {
      await trx(table).where({ id: applicationId }).update({ status: 'Rejected' });
      await trx('hr_approval_records').insert({
        module, application_id: applicationId, level: appRow.current_level || 0,
        action: 'Rejected', actor_user_id: actor.id, actor_name: actor.name, remarks: remarks?.trim() || null,
      });
    });
    if (NOTIFY_TYPE[module]) await notifyEmployeeDecision(NOTIFY_TYPE[module], applicationId, 'Rejected', remarks?.trim());
    await notifyTelegramDecision(module, appRow, 'Rejected', actor.name);
    await logAudit(req, {
      action: 'REJECT', module: TG_MODULE_LABEL[module] || module,
      target: `${TG_MODULE_LABEL[module] || module}: ${appRow.reference_no || `#${applicationId}`}`,
      description: `${TG_MODULE_LABEL[module] || module} application rejected${remarks?.trim() ? ` — ${remarks.trim()}` : ''}`,
      before: { status: appRow.status }, after: { status: 'Rejected' },
    });
    return { ok: true, status: 200, body: { success: true, status: 'Rejected' } };
  }

  // ── Approve ──
  if (chain.length === 0) {
    // No chain configured → single-step direct approval
    await db.transaction(async (trx) => {
      await trx(table).where({ id: applicationId }).update({ status: 'Approved' });
      await trx('hr_approval_records').insert({
        module, application_id: applicationId, level: 1,
        action: 'Approved', actor_user_id: actor.id, actor_name: actor.name, remarks: remarks?.trim() || null,
      });
    });
    if (NOTIFY_TYPE[module]) await notifyEmployeeDecision(NOTIFY_TYPE[module], applicationId, 'Approved', remarks?.trim());
    await notifyTelegramDecision(module, appRow, 'Approved', actor.name);
    await logAudit(req, {
      action: 'APPROVE', module: TG_MODULE_LABEL[module] || module,
      target: `${TG_MODULE_LABEL[module] || module}: ${appRow.reference_no || `#${applicationId}`}`,
      description: `${TG_MODULE_LABEL[module] || module} application approved`,
      before: { status: appRow.status }, after: { status: 'Approved' },
    });
    return { ok: true, status: 200, body: { success: true, status: 'Approved', finalized: true } };
  }

  // Chain configured → advance one level
  const nextLevel = (appRow.current_level || 0) + 1;
  const isFinal = nextLevel >= chain.length;
  const newStatus = isFinal ? 'Approved' : 'Pending';

  await db.transaction(async (trx) => {
    await trx(table).where({ id: applicationId }).update({ status: newStatus, current_level: nextLevel });
    await trx('hr_approval_records').insert({
      module, application_id: applicationId, level: nextLevel,
      action: 'Approved', actor_user_id: actor.id, actor_name: actor.name, remarks: remarks?.trim() || null,
    });
  });

  // Only notify the employee once the application is fully approved.
  if (isFinal && NOTIFY_TYPE[module]) await notifyEmployeeDecision(NOTIFY_TYPE[module], applicationId, 'Approved', remarks?.trim());
  if (isFinal) await notifyTelegramDecision(module, appRow, 'Approved', actor.name);
  await logAudit(req, {
    action: 'APPROVE', module: TG_MODULE_LABEL[module] || module,
    target: `${TG_MODULE_LABEL[module] || module}: ${appRow.reference_no || `#${applicationId}`}`,
    description: isFinal
      ? `${TG_MODULE_LABEL[module] || module} application fully approved`
      : `${TG_MODULE_LABEL[module] || module} approved at level ${nextLevel} of ${chain.length}`,
    before: { status: appRow.status, level: appRow.current_level || 0 },
    after: { status: newStatus, level: nextLevel },
  });

  return {
    ok: true, status: 200,
    body: { success: true, status: newStatus, level: nextLevel, total_levels: chain.length, finalized: isFinal },
  };
}

// Fetch the approval trail for an application (for the View modal).
export async function getApprovalTrail(module: string, applicationId: number) {
  return db('hr_approval_records')
    .where({ module, application_id: applicationId })
    .orderBy('id', 'asc');
}

export { getEssSession };
