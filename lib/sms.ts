import db from './db';

/**
 * SMS sending via Infobip — mirrors the SMS integration page settings.
 * Reads credentials from integration_settings (module = 'sms').
 * Only sends when SMS is enabled; otherwise resolves with sent:false.
 */

export type SmsTrigger =
  | 'leaveApproved' | 'leaveRejected'
  | 'claimApproved' | 'claimRejected'
  | 'otApproved'    | 'newApplication'
  | 'payslipReady'  | 'passwordReset';

type SmsConfig = {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  senderId: string;
  triggers: Record<string, boolean>;
};

async function loadSmsConfig(): Promise<SmsConfig> {
  const rows = await db('integration_settings').where({ module: 'sms' }).select('key', 'value');
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value || '';
  let triggers: Record<string, boolean> = {};
  try { triggers = s.triggers ? JSON.parse(s.triggers) : {}; } catch { triggers = {}; }
  return {
    enabled: s.enabled === '1',
    apiKey: s.api_key || '',
    baseUrl: (s.api_secret || 'https://api.infobip.com').replace(/\/$/, ''),
    senderId: s.sender_id || '',
    triggers,
  };
}

/** True if SMS is enabled AND the given trigger is switched on. */
export async function isSmsTriggerOn(trigger: SmsTrigger): Promise<boolean> {
  const cfg = await loadSmsConfig();
  return cfg.enabled && !!cfg.triggers[trigger];
}

/**
 * Normalise a Malaysian phone number into E.164 (+60...) form for Infobip.
 *  - "+60178591411"  → "+60178591411"  (already correct, used as-is)
 *  - "60178591411"   → "+60178591411"  (prepend +)
 *  - "0178591411"    → "+60178591411"  (drop leading 0, prepend +60)
 *  - "178591411"     → "+60178591411"  (prepend +60)
 * Spaces, dashes and parentheses are stripped first.
 * Returns '' if there are no digits.
 */
export function normalizeMyPhone(raw: string): string {
  if (!raw) return '';
  let s = String(raw).trim();
  const hadPlus = s.startsWith('+');
  // keep digits only
  const digits = s.replace(/[^0-9]/g, '');
  if (!digits) return '';

  if (hadPlus) {
    // Already international (+60..., or any +XX) — use as given.
    return `+${digits}`;
  }
  if (digits.startsWith('60')) {
    // Local typed full country code without + → add it.
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    // National format 01x... → drop the 0, add +60.
    return `+60${digits.replace(/^0+/, '')}`;
  }
  // Bare subscriber number e.g. 178591411 → assume Malaysian.
  return `+60${digits}`;
}

/** Low-level send. Returns {sent, message}. Never throws. */
export async function sendSms(to: string, text: string): Promise<{ sent: boolean; message: string }> {
  const dest = normalizeMyPhone(to);
  if (!dest) return { sent: false, message: 'No recipient phone.' };
  try {
    const cfg = await loadSmsConfig();
    if (!cfg.enabled) return { sent: false, message: 'SMS disabled.' };
    if (!cfg.apiKey || !cfg.senderId) return { sent: false, message: 'SMS not configured.' };

    const r = await fetch(`${cfg.baseUrl}/sms/2/text/advanced`, {
      method: 'POST',
      headers: { 'Authorization': `App ${cfg.apiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ messages: [{ from: cfg.senderId, destinations: [{ to: dest }], text }] }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const m = (data as any)?.requestError?.serviceException?.text || (data as any)?.message || 'Infobip error.';
      return { sent: false, message: m };
    }
    return { sent: true, message: 'SMS sent.' };
  } catch (err: any) {
    return { sent: false, message: err?.message || 'SMS send failed.' };
  }
}

/**
 * Send an SMS for a given trigger only if that trigger is enabled.
 * Best-effort — never throws, returns whether it actually sent.
 */
export async function sendSmsIfEnabled(trigger: SmsTrigger, to: string, text: string): Promise<boolean> {
  try {
    if (!(await isSmsTriggerOn(trigger))) return false;
    const r = await sendSms(to, text);
    return r.sent;
  } catch { return false; }
}
