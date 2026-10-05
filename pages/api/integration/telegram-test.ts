import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { getTelegramSettings, telegramGetMe, telegramSend } from '@/lib/telegram';
import { getDateConfig, formatDate } from '@/lib/dateFormat';

const PERM = 'settings.integration.telegram';

/**
 * POST { action: 'verify' | 'send', target?: 'channel' | 'owner', message?: string }
 *   verify → getMe to confirm the bot token
 *   send   → send a test message to the channel (or owner) with a timestamp
 *            formatted using the General config date/time settings.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const auth = await getAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!(await hasPermission(auth, PERM, 'Update'))) {
    return res.status(403).json({ success: false, message: 'You do not have permission to test this integration.' });
  }

  const action = req.body?.action || 'send';
  const target = req.body?.target === 'owner' ? 'owner' : 'channel';

  try {
    const s = await getTelegramSettings();
    if (!s.botToken) {
      return res.status(400).json({ success: false, message: 'Bot API Token not configured. Save your settings first.' });
    }

    // ── Verify only ──
    if (action === 'verify') {
      const r = await telegramGetMe(s.botToken);
      return res.status(r.ok ? 200 : 400).json({ success: r.ok, message: r.message });
    }

    // ── Send test message ──
    const chatId = target === 'owner' ? s.ownerUserId : s.channelId;
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: target === 'owner' ? 'Owner User ID not configured.' : 'Channel ID not configured.',
      });
    }

    const cfg = await getDateConfig();
    const now = formatDate(new Date(), cfg, true);
    const custom = (req.body?.message || '').toString().trim();
    const text =
      `<b>ATLINE SDN BHD</b>\n` +
      `🔔 Telegram integration test\n\n` +
      (custom ? `${custom}\n\n` : 'This is a test message from the ATLINE admin system.\n\n') +
      `🕒 ${now}`;

    const r = await telegramSend(s.botToken, chatId, text);
    return res.status(r.ok ? 200 : 400).json({
      success: r.ok,
      message: r.ok ? `Test message sent to the ${target}.` : r.message,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to send Telegram message.' });
  }
}
