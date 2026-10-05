'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import IntegrationLayout from '../../components/IntegrationLayout';
import { usePermissions } from '../../lib/usePermissions';

type WebhookRecord = { id: number; name: string; url: string; events: string; status: 'Active' | 'Inactive'; };

function FormRow({ label, hint, last, children }: { label: string; hint?: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div className={`usr-form-row ${last ? 'usr-form-row-last' : ''}`}>
      <div className="usr-form-label" style={{ paddingTop: 8 }}>
        <div>{label}</div>
        {hint && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 2 }}>{hint}</div>}
      </div>
      <div className="usr-form-field">{children}</div>
    </div>
  );
}

function randStr(prefix: string, len: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return prefix + Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function ApiIntegrationPage() {
  const { can } = usePermissions();
  const canUpdate = can('settings.integration.api', 'Update');
  const canCreate = can('settings.integration.api', 'Create');
  const canDelete = can('settings.integration.api', 'Delete');
  // ── API Key ──
  const [apiKey, setApiKey]   = useState('');
  const [showKey, setShowKey] = useState(false);

  // ── CORS & Security ──
  const [corsEnabled, setCorsEnabled]           = useState(true);
  const [allowedOrigins, setAllowedOrigins]     = useState('https://atline.com.my\nhttps://admin.atline.com.my');
  const [allowedMethods, setAllowedMethods]     = useState<string[]>(['GET', 'POST', 'PUT', 'DELETE']);
  const [requireHttps, setRequireHttps]         = useState(true);
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [ipWhitelist, setIpWhitelist]           = useState('');

  // ── Rate Limiting ──
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [rateLimit, setRateLimit]               = useState('100');
  const [rateLimitWindow, setRateLimitWindow]   = useState('60');
  const [rateLimitBurst, setRateLimitBurst]     = useState('20');
  const [rateLimitAction, setRateLimitAction]   = useState('block');

  // ── Webhook Secret ──
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecret, setShowSecret]       = useState(false);

  // ── Webhooks ──
  const [webhooks, setWebhooks]   = useState<WebhookRecord[]>([]);
  const [addModal, setAddModal]   = useState(false);
  const [newName, setNewName]     = useState('');
  const [newUrl, setNewUrl]       = useState('');
  const [newEvents, setNewEvents] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  // ── Page state ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  // ── Test state ──
  const [testApiKey, setTestApiKey]         = useState('');
  const [testOrigin, setTestOrigin]         = useState('https://atline.com.my');
  const [testingApi, setTestingApi]         = useState(false);
  const [testingCors, setTestingCors]       = useState(false);
  const [testingSig, setTestingSig]         = useState(false);
  const [testingWh, setTestingWh]           = useState<number | null>(null);
  const [apiTestResult, setApiTestResult]   = useState<any>(null);
  const [corsTestResult, setCorsTestResult] = useState<any>(null);
  const [sigTestResult, setSigTestResult]   = useState<any>(null);
  const [whTestResults, setWhTestResults]   = useState<Record<number, any>>({});

  // ── Load settings from DB ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [settRes, whRes] = await Promise.all([
        fetch('/api/integration/api'),
        fetch('/api/webhooks'),
      ]);
      const settJson = await settRes.json();
      const whJson   = await whRes.json();

      if (settJson.success) {
        const d = settJson.data;
        setApiKey(d.api_key           || '');
        setCorsEnabled(d.cors_enabled !== '0');
        setAllowedOrigins(d.allowed_origins || 'https://atline.com.my\nhttps://admin.atline.com.my');
        setAllowedMethods(d.allowed_methods ? d.allowed_methods.split(',') : ['GET','POST','PUT','DELETE']);
        setRequireHttps(d.require_https !== '0');
        setIpWhitelistEnabled(d.ip_whitelist_enabled === '1');
        setIpWhitelist(d.ip_whitelist || '');
        setRateLimitEnabled(d.rate_limit_enabled !== '0');
        setRateLimit(d.rate_limit       || '100');
        setRateLimitWindow(d.rate_window || '60');
        setRateLimitBurst(d.rate_burst  || '20');
        setRateLimitAction(d.rate_action || 'block');
        setWebhookSecret(d.webhook_secret || '');
      }
      if (whJson.success) setWebhooks(whJson.data);
    } catch { setError('Failed to load settings.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Save settings ──
  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res  = await fetch('/api/integration/api', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          api_key:              apiKey,
          cors_enabled:         corsEnabled ? '1' : '0',
          allowed_origins:      allowedOrigins,
          allowed_methods:      allowedMethods.join(','),
          require_https:        requireHttps ? '1' : '0',
          ip_whitelist_enabled: ipWhitelistEnabled ? '1' : '0',
          ip_whitelist:         ipWhitelist,
          rate_limit_enabled:   rateLimitEnabled ? '1' : '0',
          rate_limit:           rateLimit,
          rate_window:          rateLimitWindow,
          rate_burst:           rateLimitBurst,
          rate_action:          rateLimitAction,
          webhook_secret:       webhookSecret,
        }),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  // ── Regenerate API key ──
  const regenerateKey = async () => {
    const newKey = randStr('atl_live_', 32);
    setApiKey(newKey);
  };

  // ── Regenerate webhook secret ──
  const regenerateSecret = () => {
    setWebhookSecret(randStr('whsec_', 32));
  };

  const toggleMethod = (m: string) =>
    setAllowedMethods(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);

  // ── Add webhook ──
  const handleAddWebhook = async () => {
    if (!newName.trim() || !newUrl.trim()) return;
    setAddSaving(true);
    try {
      const res  = await fetch('/api/webhooks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: newName, url: newUrl, events: newEvents }),
      });
      const json = await res.json();
      if (json.success) {
        setAddModal(false);
        setNewName(''); setNewUrl(''); setNewEvents('');
        fetchAll();
      }
    } catch { /* silent */ }
    finally { setAddSaving(false); }
  };

  // ── Toggle webhook status ──
  const handleToggleWebhook = async (id: number) => {
    const res  = await fetch(`/api/webhooks/${id}`, { method: 'PATCH' });
    const json = await res.json();
    if (json.success) {
      setWebhooks(p => p.map(w => w.id === id ? { ...w, status: json.status } : w));
    }
  };

  // ── Delete webhook ──
  const handleDeleteWebhook = async (id: number) => {
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
    setWebhooks(p => p.filter(w => w.id !== id));
  };

  // ── Test API Key ──
  const handleTestApiKey = async () => {
    setTestingApi(true); setApiTestResult(null);
    try {
      const res  = await fetch('/api/integration/api-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_type: 'api_key', api_key: testApiKey }),
      });
      setApiTestResult(await res.json());
    } catch { setApiTestResult({ success: false, message: 'Network error.' }); }
    finally { setTestingApi(false); }
  };

  // ── Test CORS ──
  const handleTestCors = async () => {
    setTestingCors(true); setCorsTestResult(null);
    try {
      const res  = await fetch('/api/integration/api-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_type: 'cors', origin: testOrigin }),
      });
      setCorsTestResult(await res.json());
    } catch { setCorsTestResult({ success: false, message: 'Network error.' }); }
    finally { setTestingCors(false); }
  };

  // ── Test Webhook Signature ──
  const handleTestSignature = async () => {
    setTestingSig(true); setSigTestResult(null);
    try {
      const res  = await fetch('/api/integration/api-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_type: 'webhook_signature' }),
      });
      setSigTestResult(await res.json());
    } catch { setSigTestResult({ success: false, message: 'Network error.' }); }
    finally { setTestingSig(false); }
  };

  // ── Test Webhook Delivery ──
  const handleTestWebhook = async (id: number) => {
    setTestingWh(id);
    setWhTestResults(p => ({ ...p, [id]: null }));
    try {
      const res  = await fetch('/api/integration/webhook-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_id: id }),
      });
      const json = await res.json();
      setWhTestResults(p => ({ ...p, [id]: json }));
    } catch {
      setWhTestResults(p => ({ ...p, [id]: { success: false, message: 'Network error.' } }));
    } finally {
      setTestingWh(null);
    }
  };

  return (
    <>
      <Head><title>API &amp; Webhook — ATLINE Admin</title></Head>
      <IntegrationLayout activeTab="api">
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
            <i className="bi bi-plug-fill"></i>
          </div>
          <div>
            <h2 className="int-section-title">API & Webhook Configuration</h2>
            <p className="int-section-sub">Manage API keys, security settings, rate limiting and outgoing webhooks.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading settings...
          </div>
        ) : (
          <>
            {saved  && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> Settings saved successfully.</div>}
            {error  && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}><i className="bi bi-exclamation-circle-fill me-2"></i>{error}</div>}

            {/* ── API Key ── */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-key-fill"></i> API Key</div>
              <FormRow label="System API Key" hint="Use this key to authenticate API requests from external systems">
                <div className="d-flex gap-2">
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input className="rm-input" readOnly
                      value={showKey ? (apiKey || '— not set —') : '•'.repeat(40)}
                      style={{ fontFamily: 'monospace', fontSize: 13, paddingRight: 40 }} />
                    <button type="button" onClick={() => setShowKey(!showKey)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15,
                    }}>
                      <i className={`bi ${showKey ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                  <button type="button" className="rm-btn-outline"
                    onClick={() => apiKey && navigator.clipboard.writeText(apiKey)}
                    disabled={!apiKey}>
                    <i className="bi bi-clipboard"></i> Copy
                  </button>
                </div>
              </FormRow>
              <FormRow label="Regenerate Key" hint="Generates a new key — save settings to persist" last>
                {canUpdate && (
                <button type="button" className="usr-btn-reset" onClick={regenerateKey}>
                  <i className="bi bi-arrow-clockwise"></i> Regenerate API Key
                </button>
                )}
                <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 6 }}>
                  Warning: All integrations using the current key will stop working.
                </p>
              </FormRow>
            </div>

            {/* ── CORS & Security ── */}
            <div className="int-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-shield-lock-fill"></i> CORS & Security</div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: 13, color: '#6b7280' }}>CORS: {corsEnabled ? 'Enabled' : 'Disabled'}</span>
                  <div className={`int-toggle ${corsEnabled ? 'int-toggle-on' : ''}`} onClick={() => setCorsEnabled(!corsEnabled)}>
                    <div className="int-toggle-thumb"></div>
                  </div>
                </div>
              </div>

              <FormRow label="Allowed HTTP Methods" hint="Select which HTTP methods are permitted">
                <div className="d-flex gap-2 flex-wrap">
                  {['GET','POST','PUT','PATCH','DELETE','OPTIONS'].map(m => (
                    <label key={m} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                      padding: '5px 12px', borderRadius: 8, fontSize: 12.5,
                      background: allowedMethods.includes(m) ? '#eff6ff' : '#f9fafb',
                      border: `1.5px solid ${allowedMethods.includes(m) ? '#3b82f6' : '#e5e7eb'}`,
                      color: allowedMethods.includes(m) ? '#2563eb' : '#6b7280',
                      transition: 'all .15s',
                    }}>
                      <input type="checkbox" checked={allowedMethods.includes(m)} onChange={() => toggleMethod(m)} style={{ display: 'none' }} />
                      {m}
                    </label>
                  ))}
                </div>
              </FormRow>

              <FormRow label="Require HTTPS" hint="Reject all non-HTTPS API requests">
                <div className="d-flex align-items-center gap-2">
                  <div className={`int-toggle ${requireHttps ? 'int-toggle-on' : ''}`} onClick={() => setRequireHttps(!requireHttps)}>
                    <div className="int-toggle-thumb"></div>
                  </div>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>
                    {requireHttps ? 'HTTPS only — HTTP requests will be rejected' : 'HTTP and HTTPS both allowed'}
                  </span>
                </div>
              </FormRow>

              <FormRow label="IP Whitelist" hint="Restrict API access to specific IP addresses only">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className={`int-toggle ${ipWhitelistEnabled ? 'int-toggle-on' : ''}`} onClick={() => setIpWhitelistEnabled(!ipWhitelistEnabled)}>
                    <div className="int-toggle-thumb"></div>
                  </div>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>
                    {ipWhitelistEnabled ? 'Whitelist active' : 'Disabled — all IPs allowed'}
                  </span>
                </div>
                {ipWhitelistEnabled && (
                  <>
                    <textarea className="rm-input" rows={3} value={ipWhitelist} onChange={e => setIpWhitelist(e.target.value)}
                      placeholder={'103.x.x.x\n192.168.1.0/24\n10.0.0.1'}
                      style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }} />
                    <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>One IP or CIDR range per line.</p>
                  </>
                )}
              </FormRow>

              <FormRow label="Allowed Origins" hint="Domains permitted to make cross-origin API requests (CORS)" last>
                <textarea className="rm-input" rows={4} value={allowedOrigins} onChange={e => setAllowedOrigins(e.target.value)}
                  placeholder={'https://atline.com.my\nhttps://admin.atline.com.my'}
                  style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }} />
                <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>
                  One origin per line. Use <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>*</code> to allow all origins (not recommended for production).
                </p>
              </FormRow>
            </div>

            {/* ── Rate Limiting ── */}
            <div className="int-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-speedometer2"></i> Rate Limiting</div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{rateLimitEnabled ? 'Enabled' : 'Disabled'}</span>
                  <div className={`int-toggle ${rateLimitEnabled ? 'int-toggle-on' : ''}`} onClick={() => setRateLimitEnabled(!rateLimitEnabled)}>
                    <div className="int-toggle-thumb"></div>
                  </div>
                </div>
              </div>
              <div className="int-info-note mb-3">
                <i className="bi bi-info-circle-fill"></i>
                Rate limiting protects the API from abuse and DDoS attacks by limiting the number of requests per client.
              </div>
              <FormRow label="Max Requests" hint="Maximum requests allowed per window">
                <div className="d-flex align-items-center gap-2">
                  <input type="number" className="rm-input" style={{ maxWidth: 100 }} value={rateLimit}
                    onChange={e => setRateLimit(e.target.value)} min={1} disabled={!rateLimitEnabled} />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>requests per</span>
                  <input type="number" className="rm-input" style={{ maxWidth: 80 }} value={rateLimitWindow}
                    onChange={e => setRateLimitWindow(e.target.value)} min={1} disabled={!rateLimitEnabled} />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>seconds</span>
                </div>
              </FormRow>
              <FormRow label="Burst Limit" hint="Allow short bursts above the rate limit">
                <div className="d-flex align-items-center gap-2">
                  <input type="number" className="rm-input" style={{ maxWidth: 100 }} value={rateLimitBurst}
                    onChange={e => setRateLimitBurst(e.target.value)} min={0} disabled={!rateLimitEnabled} />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>extra requests allowed in burst</span>
                </div>
              </FormRow>
              <FormRow label="On Limit Exceeded" hint="Action to take when rate limit is hit" last>
                <div className="d-flex gap-3 flex-wrap">
                  {[
                    { val: 'block',    label: 'Block (429 Too Many Requests)' },
                    { val: 'throttle', label: 'Throttle (slow down response)' },
                    { val: 'log',      label: 'Log only (no blocking)' },
                  ].map(opt => (
                    <label key={opt.val} className="int-radio-label">
                      <input type="radio" name="rateLimitAction" value={opt.val}
                        checked={rateLimitAction === opt.val} onChange={() => setRateLimitAction(opt.val)}
                        disabled={!rateLimitEnabled} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </FormRow>
            </div>

            {/* ── Webhook Secret ── */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-lock-fill"></i> Webhook Secret</div>
              <div className="int-info-note mb-3">
                <i className="bi bi-info-circle-fill"></i>
                The webhook secret is used to sign outgoing webhook payloads. Receiving endpoints should verify the{' '}
                <code style={{ background: '#dbeafe', padding: '1px 5px', borderRadius: 4 }}>X-ATLINE-Signature</code>{' '}
                header to confirm authenticity.
              </div>
              <FormRow label="Webhook Secret" hint="HMAC-SHA256 signing secret for all outgoing webhooks">
                <div className="d-flex gap-2">
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input className="rm-input" readOnly
                      value={showSecret ? (webhookSecret || '— not set —') : '•'.repeat(40)}
                      style={{ fontFamily: 'monospace', fontSize: 13, paddingRight: 40 }} />
                    <button type="button" onClick={() => setShowSecret(!showSecret)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15,
                    }}>
                      <i className={`bi ${showSecret ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                  <button type="button" className="rm-btn-outline"
                    onClick={() => webhookSecret && navigator.clipboard.writeText(webhookSecret)}
                    disabled={!webhookSecret}>
                    <i className="bi bi-clipboard"></i> Copy
                  </button>
                </div>
              </FormRow>
              <FormRow label="Regenerate Secret" hint="Generates a new secret — save settings to persist" last>
                {canUpdate && (
                <button type="button" className="usr-btn-reset" onClick={regenerateSecret}>
                  <i className="bi bi-arrow-clockwise"></i> Regenerate Secret
                </button>
                )}
                <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 6 }}>
                  Warning: Existing webhook receivers using the old secret will fail signature verification.
                </p>
              </FormRow>
            </div>

            {/* ── Test Connection ── */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-wifi"></i> Test Connection</div>

              {/* Test API Key */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                  <i className="bi bi-key-fill me-2" style={{ color: '#8b5cf6' }}></i>
                  <strong>Verify API Key</strong>
                  <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>Enter a key to test against the saved key</span>
                </div>
                <div className="d-flex gap-2">
                  <input className="rm-input" value={testApiKey} onChange={e => setTestApiKey(e.target.value)}
                    placeholder="Paste API key to verify..." style={{ fontFamily: 'monospace', fontSize: 13 }} />
                  <button type="button" className="rm-btn-outline" onClick={handleTestApiKey}
                    disabled={testingApi || !testApiKey} style={{ whiteSpace: 'nowrap' }}>
                    {testingApi
                      ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 13, height: 13, borderWidth: 2 }}></span>Testing…</>
                      : <><i className="bi bi-check2-circle"></i> Verify Key</>
                    }
                  </button>
                </div>
                {apiTestResult && (
                  <div className={`mt-2 ${apiTestResult.success ? 'int-test-success' : 'int-test-error'}`}>
                    <i className={`bi ${apiTestResult.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                    {' '}{apiTestResult.message}
                    {apiTestResult.details && apiTestResult.success && (
                      <span style={{ fontSize: 11.5, marginLeft: 8, opacity: 0.8 }}>
                        · Prefix: {apiTestResult.details.key_prefix} · Length: {apiTestResult.details.key_length}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Test CORS */}
              <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                  <i className="bi bi-shield-lock-fill me-2" style={{ color: '#3b82f6' }}></i>
                  <strong>Test CORS Origin</strong>
                  <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>Check if an origin is allowed</span>
                </div>
                <div className="d-flex gap-2">
                  <input className="rm-input" value={testOrigin} onChange={e => setTestOrigin(e.target.value)}
                    placeholder="https://example.com" style={{ fontFamily: 'monospace', fontSize: 13 }} />
                  <button type="button" className="rm-btn-outline" onClick={handleTestCors}
                    disabled={testingCors || !testOrigin} style={{ whiteSpace: 'nowrap' }}>
                    {testingCors
                      ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 13, height: 13, borderWidth: 2 }}></span>Testing…</>
                      : <><i className="bi bi-globe"></i> Test Origin</>
                    }
                  </button>
                </div>
                {corsTestResult && (
                  <div className={`mt-2 ${corsTestResult.success ? 'int-test-success' : 'int-test-error'}`}>
                    <i className={`bi ${corsTestResult.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                    {' '}{corsTestResult.message}
                  </div>
                )}
              </div>

              {/* Test Webhook Signature */}
              <div style={{ paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                  <i className="bi bi-lock-fill me-2" style={{ color: '#f59e0b' }}></i>
                  <strong>Generate Webhook Signature</strong>
                  <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>Preview HMAC-SHA256 signature for a test payload</span>
                </div>
                <button type="button" className="rm-btn-outline" onClick={handleTestSignature}
                  disabled={testingSig} style={{ whiteSpace: 'nowrap' }}>
                  {testingSig
                    ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 13, height: 13, borderWidth: 2 }}></span>Generating…</>
                    : <><i className="bi bi-fingerprint"></i> Generate Signature</>
                  }
                </button>
                {sigTestResult && (
                  <div className={`mt-2 ${sigTestResult.success ? 'int-test-success' : 'int-test-error'}`}>
                    <i className={`bi ${sigTestResult.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                    {' '}{sigTestResult.message}
                    {sigTestResult.success && sigTestResult.details && (
                      <div style={{ marginTop: 8, background: 'rgba(0,0,0,0.04)', borderRadius: 6, padding: '8px 12px', fontFamily: 'monospace', fontSize: 11.5, wordBreak: 'break-all' }}>
                        <div><strong>Header:</strong> X-ATLINE-Signature</div>
                        <div><strong>Value:</strong> {sigTestResult.details.signature}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Outgoing Webhooks ── */}
            <div className="int-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-broadcast"></i> Outgoing Webhooks</div>
                {canCreate && (
                <button className="rm-btn-primary" style={{ fontSize: 12.5, padding: '7px 14px' }} onClick={() => setAddModal(true)}>
                  <i className="bi bi-plus-lg"></i> Add Webhook
                </button>
                )}
              </div>
              <div className="rm-table-wrap">
                <table className="rm-table">
                  <thead>
                    <tr>
                      <th className="rm-th-module" style={{ width: 40 }}>#</th>
                      <th className="rm-th-module">Name</th>
                      <th className="rm-th-module">Endpoint URL</th>
                      <th className="rm-th-perm">Events</th>
                      <th className="rm-th-perm">Status</th>
                      <th className="rm-th-perm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: '#9ca3af', fontSize: 13 }}>
                          <i className="bi bi-broadcast" style={{ fontSize: 24, display: 'block', marginBottom: 8 }}></i>
                          No webhooks configured.
                        </td>
                      </tr>
                    ) : webhooks.map((w, i) => (
                      <tr key={w.id} className="rm-data-row">
                        <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                        <td className="rm-td-module" style={{ color: '#1f2937' }}>{w.name}</td>
                        <td style={{ padding: '9px 16px', fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>{w.url}</td>
                        <td className="rm-td-perm" style={{ fontSize: 11.5, color: '#6b7280' }}>
                          {w.events || <span style={{ color: '#d1d5db' }}>All events</span>}
                        </td>
                        <td className="rm-td-perm">
                          <span className={`badge-status ${w.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="rm-td-perm">
                          <div className="d-flex gap-2 justify-content-center">
                            <button className="rm-action-btn rm-action-view" title="Send Test"
                              onClick={() => handleTestWebhook(w.id)}
                              disabled={testingWh === w.id}>
                              {testingWh === w.id
                                ? <span className="spinner-border spinner-border-sm" style={{ width: 11, height: 11, borderWidth: 2 }}></span>
                                : <i className="bi bi-send-fill"></i>
                              }
                            </button>
                            {canUpdate && (
                            <button className="rm-action-btn rm-action-edit" title={w.status === 'Active' ? 'Pause' : 'Activate'}
                              onClick={() => handleToggleWebhook(w.id)}>
                              <i className={`bi ${w.status === 'Active' ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                            </button>
                            )}
                            {canDelete && (
                            <button className="rm-action-btn rm-action-delete" title="Delete"
                              onClick={() => handleDeleteWebhook(w.id)}>
                              <i className="bi bi-trash-fill"></i>
                            </button>
                            )}
                          </div>
                          {/* Test result inline */}
                          {whTestResults[w.id] && (
                            <div style={{ marginTop: 4, fontSize: 11, textAlign: 'center' }}>
                              {whTestResults[w.id].success
                                ? <span style={{ color: '#16a34a' }}>
                                    <i className="bi bi-check-circle-fill me-1"></i>
                                    {whTestResults[w.id].status_code} · {whTestResults[w.id].duration_ms}ms
                                  </span>
                                : <span style={{ color: '#dc2626' }}>
                                    <i className="bi bi-x-circle-fill me-1"></i>
                                    {whTestResults[w.id].status_code || 'Error'}
                                  </span>
                              }
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="int-footer">
              {canUpdate && (
              <button className="rm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                  : <><i className="bi bi-floppy-fill"></i> Save Settings</>
                }
              </button>
              )}
            </div>
          </>
        )}

        {/* Add Webhook Modal */}
        {addModal && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" onClick={e => e.stopPropagation()}>
              <div className="usr-modal-header">
                <div><p className="usr-modal-title">Add Webhook</p><p className="usr-modal-sub">Configure a new outgoing webhook endpoint</p></div>
                <button className="usr-modal-close" onClick={() => setAddModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="usr-modal-body">
                <div className="usr-form-row">
                  <label className="usr-form-label">Name <span>*</span></label>
                  <div className="usr-form-field">
                    <input className="rm-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Slack Notification" />
                  </div>
                </div>
                <div className="usr-form-row">
                  <label className="usr-form-label">Endpoint URL <span>*</span></label>
                  <div className="usr-form-field">
                    <input className="rm-input" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://hooks.example.com/..." />
                  </div>
                </div>
                <div className="usr-form-row usr-form-row-last">
                  <label className="usr-form-label">Events</label>
                  <div className="usr-form-field">
                    <input className="rm-input" value={newEvents} onChange={e => setNewEvents(e.target.value)}
                      placeholder="e.g. application.created, supplier.registered" />
                    <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>
                      Comma-separated event names. Leave blank to receive all events.
                    </p>
                  </div>
                </div>
              </div>
              <div className="usr-modal-footer">
                <button className="rm-btn-outline" onClick={() => setAddModal(false)}>Cancel</button>
                <button className="rm-btn-primary" onClick={handleAddWebhook} disabled={addSaving || !newName.trim() || !newUrl.trim()}>
                  {addSaving
                    ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                    : <><i className="bi bi-plus-lg"></i> Add Webhook</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

      </IntegrationLayout>
    </>
  );
}
