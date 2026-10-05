import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { normalizeMyPhone } from '@/lib/sms';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const { to, message } = req.body;

  if (!to?.trim()) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  try {
    // Load SMS settings from DB
    const rows = await db('integration_settings')
      .where({ module: 'sms' })
      .select('key', 'value');

    const s: Record<string, string> = {};
    for (const row of rows) s[row.key] = row.value || '';

    if (!s.api_key) {
      return res.status(400).json({ success: false, message: 'API key not configured. Please save your settings first.' });
    }

    if (!s.sender_id || s.sender_id.length !== 5) {
      return res.status(400).json({ success: false, message: 'Sender ID must be exactly 5 digits.' });
    }

    const baseUrl = s.api_secret || 'https://api.infobip.com';
    const smsText = message?.trim() || 'This is a test SMS from ATLINE SDN BHD system.';
    const dest = normalizeMyPhone(to);
    if (!dest) return res.status(400).json({ success: false, message: 'Invalid phone number.' });

    // Call Infobip SMS API
    const response = await fetch(`${baseUrl}/sms/2/text/advanced`, {
      method:  'POST',
      headers: {
        'Authorization': `App ${s.api_key}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body: JSON.stringify({
        messages: [{
          from:         s.sender_id,
          destinations: [{ to: dest }],
          text:         smsText,
        }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.requestError?.serviceException?.text || data?.message || 'Infobip API error.';
      return res.status(400).json({ success: false, message: errMsg });
    }

    // Check message status
    const msgStatus = data?.messages?.[0]?.status;
    if (msgStatus?.groupName === 'REJECTED' || msgStatus?.groupName === 'UNDELIVERABLE') {
      return res.status(400).json({ success: false, message: `SMS rejected: ${msgStatus.description || msgStatus.name}` });
    }

    return res.status(200).json({
      success: true,
      message: `Test SMS sent to ${dest}.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to send SMS.' });
  }
}
