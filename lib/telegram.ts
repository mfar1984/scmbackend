import db from './db';

/**
 * Telegram Bot API helper.
 * Settings live in `integration_settings` under module = 'telegram':
 *   enabled, bot_token, bot_username, channel_id, owner_user_id, owner_username
 *
 * No external dependency — uses the global fetch and the public Bot API
 * (https://api.telegram.org/bot<token>/<method>), so it works on cPanel.
 */

export type TelegramSettings = {
  enabled: boolean;
  botToken: string;
  botUsername: string;
  channelId: string;
  ownerUserId: string;
  ownerUsername: string;
};

export async function getTelegramSettings(): Promise<TelegramSettings> {
  const rows = await db('integration_settings').where({ module: 'telegram' }).select('key', 'value');
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value || '';
  return {
    enabled:       s.enabled === '1',
    botToken:      s.bot_token || '',
    botUsername:   s.bot_username || '',
    channelId:     s.channel_id || '',
    ownerUserId:   s.owner_user_id || '',
    ownerUsername: s.owner_username || '',
  };
}

const API = (token: string, method: string) => `https://api.telegram.org/bot${token}/${method}`;

type TgResult = { ok: boolean; message: string; data?: any };

/** Verify a bot token via getMe. */
export async function telegramGetMe(token: string): Promise<TgResult> {
  if (!token) return { ok: false, message: 'Bot API Token is required.' };
  try {
    const r = await fetch(API(token, 'getMe'));
    const j = await r.json();
    if (!j.ok) return { ok: false, message: j.description || 'Invalid bot token.' };
    return { ok: true, message: `Connected as @${j.result?.username || 'bot'}.`, data: j.result };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Could not reach Telegram API.' };
  }
}

/** Send a message to a chat/channel. `chatId` may be a numeric id, @channelusername, or -100... id. */
export async function telegramSend(token: string, chatId: string, text: string): Promise<TgResult> {
  if (!token) return { ok: false, message: 'Bot API Token is required.' };
  if (!chatId) return { ok: false, message: 'Channel ID is required.' };
  try {
    const r = await fetch(API(token, 'sendMessage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    const j = await r.json();
    if (!j.ok) return { ok: false, message: j.description || 'Telegram rejected the message.', data: j };
    return { ok: true, message: 'Message delivered.', data: j.result };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Could not reach Telegram API.' };
  }
}

/**
 * High-level notify: sends to the configured channel only when the integration
 * is enabled and configured. Silently no-ops otherwise (never throws), so it is
 * safe to call from anywhere in the app.
 */
export async function notifyTelegram(text: string): Promise<boolean> {
  try {
    const s = await getTelegramSettings();
    if (!s.enabled || !s.botToken || !s.channelId) return false;
    const r = await telegramSend(s.botToken, s.channelId, text);
    return r.ok;
  } catch {
    return false;
  }
}

/** Read the saved per-event trigger toggles (JSON in integration_settings). */
export async function getTelegramTriggers(): Promise<Record<string, boolean>> {
  try {
    const row = await db('integration_settings').where({ module: 'telegram', key: 'triggers' }).first();
    if (!row?.value) return {};
    return JSON.parse(row.value);
  } catch {
    return {};
  }
}

/**
 * Notify the channel for a named trigger only if that trigger is enabled.
 * `triggerKey` matches the keys saved by the Telegram settings page
 * (e.g. 'leaveApproved', 'claimRejected', 'newRegistration').
 */
export async function notifyTelegramTrigger(triggerKey: string, text: string): Promise<boolean> {
  try {
    const triggers = await getTelegramTriggers();
    if (triggers[triggerKey] === false) return false; // explicitly disabled
    if (triggers[triggerKey] === undefined) return false; // not configured → off
    return notifyTelegram(text);
  } catch {
    return false;
  }
}
