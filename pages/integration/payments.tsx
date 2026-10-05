'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import IntegrationLayout from '../../components/IntegrationLayout';

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

// Provider-specific credential fields
const PROVIDER_CONFIG: Record<string, {
  label: string;
  docsUrl: string;
  fields: { key: string; label: string; hint: string; secret?: boolean; placeholder: string; textarea?: boolean }[];
}> = {
  billplz: {
    label: 'Billplz',
    docsUrl: 'https://www.billplz.com/api',
    fields: [
      { key: 'api_key',       label: 'Secret Key',      hint: 'From Billplz → Settings → Account Settings → Secret Key',          secret: true,  placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', textarea: false },
      { key: 'collection_id', label: 'Collection ID',   hint: 'From Billplz → Billing → your Collection ID',                      secret: false, placeholder: 'xxxxxxxx', textarea: false },
      { key: 'secret_key',    label: 'X-Signature Key', hint: 'From Billplz → Settings → Account Settings → X Signature Key (for callback verification)', secret: true, placeholder: 'S-xxxxxxxxxxxxxxxx', textarea: false },
    ],
  },
  chip: {
    label: 'CHIP (chip-in.asia)',
    docsUrl: 'https://gate.chip-in.asia',
    fields: [
      { key: 'api_key',       label: 'API Key',      hint: 'From CHIP Developer → API Keys tab',                secret: true,     placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', textarea: false },
      { key: 'collection_id', label: 'Brand ID',     hint: 'From CHIP Developer → Brands tab → your Brand ID', secret: false,    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', textarea: false },
      { key: 'secret_key',    label: 'Public Key',   hint: 'From CHIP Developer → Webhooks tab → Public Key (RSA public key for webhook signature verification)', secret: false, placeholder: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----', textarea: true },
      { key: 'callback_url',  label: 'Callback URL', hint: 'Register this URL in CHIP Developer → Webhooks tab as the callback URL', secret: false, placeholder: 'https://atline.com.my/api/payments/chip/callback', textarea: false },
    ],
  },
  toyyibpay: {
    label: 'ToyyibPay',
    docsUrl: 'https://toyyibpay.com/apireference',
    fields: [
      { key: 'api_key',       label: 'User Secret Key', hint: 'From ToyyibPay Dashboard → Profile → Secret Key', secret: true,  placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', textarea: false },
      { key: 'collection_id', label: 'Category Code',   hint: 'Your ToyyibPay bill category code',               secret: false, placeholder: 'xxxxxxxx', textarea: false },
    ],
  },
};

export default function PaymentsIntegrationPage() {
  const [enabled, setEnabled]   = useState(false);
  const [sandbox, setSandbox]   = useState(true);
  const [provider, setProvider] = useState('billplz');

  // Store all credential values keyed by field key
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  // ── Test connection state ──
  const [testing, setTesting]         = useState(false);
  const [testResult, setTestResult]   = useState<{ success: boolean; warning?: boolean; message: string; details?: any } | null>(null);

  useEffect(() => {
    fetch('/api/integration/payments')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data;
          setEnabled(d.enabled      === '1');
          setSandbox(d.sandbox_mode === '1');
          setProvider(d.provider    || 'billplz');
          setCreds({
            api_key:       d.api_key       || '',
            secret_key:    d.secret_key    || '',
            collection_id: d.collection_id || '',
          });
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  // Reset credentials when provider changes
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    setCreds({});
    setShowSecret({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res  = await fetch('/api/integration/payments', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled:      enabled ? '1' : '0',
          sandbox_mode: sandbox ? '1' : '0',
          provider,
          ...creds,
        }),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const config = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.billplz;

  // ── Test connection ──
  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res  = await fetch('/api/integration/payments-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      setTestResult(json);
    } catch {
      setTestResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <Head><title>Payments — ATLINE Admin</title></Head>
      <IntegrationLayout activeTab="payments">
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
            <i className="bi bi-credit-card-fill"></i>
          </div>
          <div>
            <h2 className="int-section-title">Payment Gateway</h2>
            <p className="int-section-sub">Configure payment gateway for online transactions.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {saved && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> Payment settings saved.</div>}
            {error && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}>{error}</div>}

            {/* Enable / Provider / Mode */}
            <div className="int-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-toggles"></i> Payment Gateway</div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{enabled ? 'Enabled' : 'Disabled'}</span>
                  <div className={`int-toggle ${enabled ? 'int-toggle-on' : ''}`} onClick={() => setEnabled(!enabled)}>
                    <div className="int-toggle-thumb"></div>
                  </div>
                </div>
              </div>

              <FormRow label="Provider" hint="Select your payment gateway provider">
                <select
                  className="rm-input"
                  style={{ maxWidth: 240 }}
                  value={provider}
                  onChange={e => handleProviderChange(e.target.value)}
                >
                  {Object.entries(PROVIDER_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </FormRow>

              <FormRow label="Mode" last>
                {provider === 'chip' ? (
                  <div className="int-info-note" style={{ marginTop: 0 }}>
                    <i className="bi bi-info-circle-fill"></i>
                    For CHIP, the <strong>Test / Live mode is determined by your API Key</strong> — not a toggle.
                    Use a <strong>Test API Key</strong> for testing and a <strong>Live API Key</strong> for production.
                    Get them from CHIP Developer → API Keys tab.
                  </div>
                ) : (
                  <>
                    <div className="d-flex gap-3 flex-wrap">
                      <label className="int-radio-label">
                        <input type="radio" name="env" checked={sandbox} onChange={() => setSandbox(true)} />
                        <span>🧪 Sandbox (Testing)</span>
                      </label>
                      <label className="int-radio-label">
                        <input type="radio" name="env" checked={!sandbox} onChange={() => setSandbox(false)} />
                        <span>🚀 Production (Live)</span>
                      </label>
                    </div>
                    {!sandbox && (
                      <div className="int-warn-note mt-2">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        Production mode will process real payments. Ensure your credentials are correct.
                      </div>
                    )}
                  </>
                )}
              </FormRow>
            </div>

            {/* Provider-specific credentials */}
            <div className="int-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="int-card-title" style={{ margin: 0 }}>
                  <i className="bi bi-key-fill"></i> {config.label} Credentials
                </div>
                <a
                  href={config.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12.5, color: '#3b82f6', textDecoration: 'none' }}
                >
                  <i className="bi bi-box-arrow-up-right me-1"></i>
                  {config.label} Dashboard
                </a>
              </div>

              {/* CHIP-specific: show webhook info note */}
              {provider === 'chip' && (
                <div className="int-info-note mb-3">
                  <i className="bi bi-info-circle-fill"></i>
                  Fill in the <strong>Callback URL</strong> field below, then register it in your{' '}
                  <a href="https://gate.chip-in.asia" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                    CHIP Developer → Webhooks
                  </a>{' '}tab.
                </div>
              )}

              {config.fields.map((field, i) => (
                <FormRow
                  key={field.key}
                  label={field.label}
                  hint={field.hint}
                  last={i === config.fields.length - 1}
                >
                  {/* Callback URL — auto-fill with current origin */}
                  {field.key === 'callback_url' ? (
                    <div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          className="rm-input"
                          value={creds[field.key] || (typeof window !== 'undefined' ? `${window.location.origin}/api/payments/chip/callback` : '')}
                          onChange={e => setCreds(p => ({ ...p, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          style={{ fontFamily: 'monospace', fontSize: 13 }}
                        />
                        <button
                          type="button"
                          className="rm-btn-outline"
                          style={{ whiteSpace: 'nowrap', fontSize: 12.5 }}
                          onClick={() => {
                            const url = creds[field.key] || `${window.location.origin}/api/payments/chip/callback`;
                            navigator.clipboard.writeText(url);
                          }}
                        >
                          <i className="bi bi-clipboard"></i> Copy
                        </button>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#f59e0b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        Register this URL in CHIP Developer → Webhooks tab
                      </div>
                    </div>
                  ) : field.textarea ? (
                    /* Textarea for multi-line values like RSA public key */
                    <textarea
                      className="rm-input"
                      rows={5}
                      value={creds[field.key] || ''}
                      onChange={e => setCreds(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
                    />
                  ) : field.secret ? (
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showSecret[field.key] ? 'text' : 'password'}
                        className="rm-input"
                        value={creds[field.key] || ''}
                        onChange={e => setCreds(p => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={{ fontFamily: 'monospace', fontSize: 13, paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(p => ({ ...p, [field.key]: !p[field.key] }))}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15 }}
                      >
                        <i className={`bi ${showSecret[field.key] ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  ) : (
                    <input
                      className="rm-input"
                      value={creds[field.key] || ''}
                      onChange={e => setCreds(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      style={{ fontFamily: 'monospace', fontSize: 13 }}
                    />
                  )}
                </FormRow>
              ))}
            </div>

            {/* Connection Status */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-activity"></i> Connection Status</div>
              <div className="int-status-row">
                <div className="int-status-item">
                  <div className={`int-status-dot ${
                    testResult === null   ? 'int-dot-grey' :
                    testResult.warning    ? 'int-dot-amber' :
                    testResult.success    ? 'int-dot-green' : 'int-dot-red'
                  }`}></div>
                  <div>
                    <div style={{ fontSize: 13, color: '#374151' }}>API Connection</div>
                    <div style={{ fontSize: 12, color:
                      testResult === null ? '#9ca3af' :
                      testResult.warning  ? '#d97706' :
                      testResult.success  ? '#16a34a' : '#dc2626'
                    }}>
                      {testResult === null
                        ? 'Not tested — save settings first'
                        : testResult.message
                      }
                    </div>
                    {testResult?.details && (testResult.success || testResult.warning) && (
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {Object.entries(testResult.details).map(([k, v]) => (
                          <span key={k} style={{ fontSize: 11.5, color: '#6b7280', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>
                            <strong>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="rm-btn-outline"
                  style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}
                  onClick={handleTest}
                  disabled={testing}
                >
                  {testing
                    ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 13, height: 13, borderWidth: 2 }}></span>Testing…</>
                    : <><i className="bi bi-wifi"></i> Test Connection</>
                  }
                </button>
              </div>
            </div>

            <div className="int-footer">
              <button type="submit" className="rm-btn-primary" disabled={saving}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                  : <><i className="bi bi-floppy-fill"></i> Save Settings</>
                }
              </button>
            </div>
          </form>
        )}
      </IntegrationLayout>
    </>
  );
}
