import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const { webhook_id } = req.body;

  if (!webhook_id) {
    return res.status(400).json({ success: false, message: 'webhook_id is required.' });
  }

  try {
    // Load webhook from DB
    const webhook = await db('webhooks').where({ id: webhook_id }).first();
    if (!webhook) {
      return res.status(404).json({ success: false, message: 'Webhook not found.' });
    }

    // Load webhook secret
    const secretRow = await db('integration_settings')
      .where({ module: 'api', key: 'webhook_secret' })
      .first();
    const secret = secretRow?.value || '';

    // Build test payload
    const payload = {
      event:      'webhook.test',
      timestamp:  new Date().toISOString(),
      webhook_id: webhook.id,
      source:     'ATLINE Admin Panel',
      data: {
        message: 'This is a test webhook delivery from ATLINE Admin Panel.',
      },
    };

    const body      = JSON.stringify(payload);
    const signature = secret
      ? 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
      : '';

    const startTime = Date.now();

    // Send POST to webhook URL
    const response = await fetch(webhook.url, {
      method:  'POST',
      headers: {
        'Content-Type':       'application/json',
        'User-Agent':         'ATLINE-Webhook/1.0',
        'X-ATLINE-Event':     'webhook.test',
        'X-ATLINE-Delivery':  crypto.randomUUID(),
        ...(signature ? { 'X-ATLINE-Signature': signature } : {}),
      },
      body,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    const duration = Date.now() - startTime;

    return res.status(200).json({
      success:     response.ok,
      status_code: response.status,
      status_text: response.statusText,
      duration_ms: duration,
      message:     response.ok
        ? `Webhook delivered successfully (${response.status} ${response.statusText}) in ${duration}ms.`
        : `Webhook delivery failed: ${response.status} ${response.statusText}.`,
      details: {
        url:       webhook.url,
        method:    'POST',
        signed:    !!signature,
        payload,
      },
    });
  } catch (err: any) {
    const isTimeout = err.name === 'TimeoutError' || err.message?.includes('timeout');
    return res.status(200).json({
      success:     false,
      status_code: 0,
      duration_ms: 10000,
      message:     isTimeout
        ? 'Webhook timed out after 10 seconds. The endpoint may be slow or unreachable.'
        : `Delivery failed: ${err.message}`,
      details: { url: '', error: err.message },
    });
  }
}
