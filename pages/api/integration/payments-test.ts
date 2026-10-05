import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Safe JSON parse — throws if response is not JSON
async function safeJson(response: Response): Promise<any> {
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await response.text();
    throw new Error(`API returned non-JSON (${response.status}): ${text.slice(0, 150)}`);
  }
  return response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  try {
    const rows = await db('integration_settings').where({ module: 'payments' }).select('key', 'value');
    const s: Record<string, string> = {};
    for (const row of rows) s[row.key] = row.value || '';

    if (!s.api_key) {
      return res.status(400).json({ success: false, message: 'API key not configured. Please save your settings first.' });
    }

    const provider = s.provider || 'chip';

    // ── CHIP ──────────────────────────────────────────────────
    if (provider === 'chip') {
      if (!s.collection_id) {
        return res.status(400).json({ success: false, message: 'Brand ID not configured. Please save your settings first.' });
      }

      // Correct endpoint: /payment_methods/ (underscore) with brand_id + currency
      // GET /api/v1/payment_methods/?brand_id=xxx&currency=MYR
      let response: Response;
      try {
        response = await fetch(
          `https://gate.chip-in.asia/api/v1/payment_methods/?brand_id=${encodeURIComponent(s.collection_id)}&currency=MYR`,
          {
            method:  'GET',
            headers: {
              'Authorization': `Bearer ${s.api_key}`,
              'Content-Type':  'application/json',
            },
            signal: AbortSignal.timeout(10000),
          }
        );
      } catch (fetchErr: any) {
        return res.status(500).json({ success: false, message: `Cannot reach CHIP API: ${fetchErr.message}` });
      }

      if (response.status === 401 || response.status === 403) {
        return res.status(400).json({ success: false, message: 'Authentication failed. Check your API Key.' });
      }

      let data: any;
      try {
        data = await safeJson(response);
      } catch (parseErr: any) {
        return res.status(400).json({ success: false, message: parseErr.message });
      }

      if (!response.ok) {
        // CHIP 400 errors come as { __all__: { message, code } }
        const errMsg = data?.__all__?.message || data?.detail || data?.message || `CHIP API error (HTTP ${response.status})`;
        return res.status(400).json({ success: false, message: `${errMsg} — check your Brand ID.` });
      }

      const methods = data?.available_payment_methods || [];

      // For CHIP, test/live mode is determined by the API key, not the toggle.
      // "none available" usually means the production brand hasn't been
      // activated with payment methods by CHIP yet.
      if (methods.length === 0) {
        return res.status(200).json({
          success: true,
          warning: true,
          message: 'Connected to CHIP, but no payment methods are available for this brand yet.',
          details: {
            brand_id:        s.collection_id,
            payment_methods: 'None — contact CHIP to activate payment methods for this brand',
            note:            'Test/Live mode is determined by your API Key, not the toggle',
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Connected successfully to CHIP.',
        details: {
          brand_id:        s.collection_id,
          payment_methods: methods.join(', '),
          note:            'Test/Live mode is determined by your API Key, not the toggle',
        },
      });
    }

    // ── Billplz ───────────────────────────────────────────────
    if (provider === 'billplz') {
      if (!s.collection_id) {
        return res.status(400).json({ success: false, message: 'Collection ID not configured. Please save your settings first.' });
      }

      const baseUrl = s.sandbox_mode === '1'
        ? 'https://www.billplz-sandbox.com/api/v3'
        : 'https://www.billplz.com/api/v3';

      let response: Response;
      try {
        response = await fetch(`${baseUrl}/collections/${s.collection_id}`, {
          method:  'GET',
          headers: { 'Authorization': 'Basic ' + Buffer.from(`${s.api_key}:`).toString('base64') },
          signal:  AbortSignal.timeout(10000),
        });
      } catch (fetchErr: any) {
        return res.status(500).json({ success: false, message: `Cannot reach Billplz API: ${fetchErr.message}` });
      }

      if (response.status === 401) {
        return res.status(400).json({ success: false, message: 'Authentication failed. Check your Secret Key.' });
      }
      if (response.status === 404) {
        return res.status(400).json({ success: false, message: 'Collection not found. Check your Collection ID.' });
      }

      let data: any;
      try { data = await safeJson(response); }
      catch (parseErr: any) { return res.status(400).json({ success: false, message: parseErr.message }); }

      if (!response.ok) {
        const errMsg = Array.isArray(data?.error?.message)
          ? data.error.message.join(', ')
          : (data?.error?.message || `Billplz API error (HTTP ${response.status})`);
        return res.status(400).json({ success: false, message: errMsg });
      }

      return res.status(200).json({
        success: true,
        message: 'Connected successfully to Billplz.',
        details: {
          collection_title: data.title || data.id || '—',
          collection_id:    s.collection_id,
          status:           data.status || 'active',
          mode:             s.sandbox_mode === '1' ? 'Sandbox (Test)' : 'Production (Live)',
        },
      });
    }

    // ── ToyyibPay ─────────────────────────────────────────────
    if (provider === 'toyyibpay') {
      if (!s.collection_id) {
        return res.status(400).json({ success: false, message: 'Category Code not configured. Please save your settings first.' });
      }

      const baseUrl = s.sandbox_mode === '1'
        ? 'https://dev.toyyibpay.com'
        : 'https://toyyibpay.com';

      // Use getCategoryDetails — verifies both Secret Key + Category Code
      let response: Response;
      try {
        response = await fetch(`${baseUrl}/index.php/api/getCategoryDetails`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body:    new URLSearchParams({
            userSecretKey: s.api_key,
            categoryCode:  s.collection_id,
          }),
          signal: AbortSignal.timeout(10000),
        });
      } catch (fetchErr: any) {
        return res.status(500).json({ success: false, message: `Cannot reach ToyyibPay API: ${fetchErr.message}` });
      }

      // ToyyibPay returns plain text for invalid keys — read as text first
      const raw = await response.text();

      // Invalid key returns "[FALSE]" or similar non-JSON text
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Invalid Secret Key or Category Code. Please check your credentials.',
        });
      }

      // Error response: { status: 'error', ... } or array with error
      if (data?.status === 'error' || (Array.isArray(data) && data[0]?.status === 'error')) {
        const msg = data?.msg || data[0]?.msg || 'Invalid credentials.';
        return res.status(400).json({ success: false, message: msg });
      }

      // Success — getCategoryDetails returns category info
      const cat = Array.isArray(data) ? data[0] : data;

      return res.status(200).json({
        success: true,
        message: 'Connected successfully to ToyyibPay.',
        details: {
          category:      cat?.categoryName || cat?.catname || s.collection_id,
          category_code: s.collection_id,
          mode:          s.sandbox_mode === '1' ? 'Sandbox (Test)' : 'Production (Live)',
        },
      });
    }

    return res.status(400).json({ success: false, message: `Test not supported for provider: ${provider}` });

  } catch (err: any) {
    const isTimeout = err.name === 'TimeoutError' || err.message?.includes('timeout');
    return res.status(500).json({
      success: false,
      message: isTimeout
        ? 'Connection timed out after 10 seconds.'
        : err.message || 'Connection test failed.',
    });
  }
}
