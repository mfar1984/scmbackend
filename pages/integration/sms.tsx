'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import IntegrationLayout from '../../components/IntegrationLayout';

function FormRow({ label, hint, last, children }: {
  label: string; hint?: string; last?: boolean; children: React.ReactNode;
}) {
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

type TriggerKey =
  | 'leaveApproved' | 'leaveRejected'
  | 'claimApproved' | 'claimRejected'
  | 'otApproved'    | 'newApplication'
  | 'payslipReady'  | 'passwordReset';

const TRIGGER_LABELS: Record<TriggerKey, string> = {
  leaveApproved:  'Leave Application Approved',
  leaveRejected:  'Leave Application Rejected',
  claimApproved:  'Claim Approved',
  claimRejected:  'Claim Rejected',
  otApproved:     'Overtime Approved',
  newApplication: 'New Job Application Received',
  payslipReady:   'Payslip Ready',
  passwordReset:  'Password Reset OTP',
};

const DEFAULT_TRIGGERS: Record<TriggerKey, boolean> = {
  leaveApproved:  true,
  leaveRejected:  true,
  claimApproved:  true,
  claimRejected:  false,
  otApproved:     true,
  newApplication: false,
  payslipReady:   true,
  passwordReset:  true,
};

export default function SmsIntegrationPage() {
  const [enabled, setEnabled]   = useState(false);
  const [apiKey, setApiKey]     = useState('');
  const [baseUrl, setBaseUrl]   = useState('https://api.infobip.com');
  const [senderId, setSenderId] = useState('');
  const [triggers, setTriggers] = useState<Record<TriggerKey, boolean>>(DEFAULT_TRIGGERS);

  const [testPhone, setTestPhone]   = useState('');
  const [testMsg, setTestMsg]       = useState('This is a test SMS from ATLINE SDN BHD system.');
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testResultMsg, setTestResultMsg] = useState('');
  const [testing, setTesting]       = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');
  const [showKey, setShowKey] = useState(false);

  // ── Load settings from DB ──
  useEffect(() => {
    fetch('/api/integration/sms')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data;
          setEnabled(d.enabled   === '1');
          setApiKey(d.api_key    || '');
          setBaseUrl(d.api_secret || 'https://api.infobip.com'); // reuse api_secret for base_url
          setSenderId(d.sender_id || '');

          // Load triggers from DB if saved
          if (d.triggers) {
            try {
              const parsed = JSON.parse(d.triggers);
              setTriggers({ ...DEFAULT_TRIGGERS, ...parsed });
            } catch { /* use defaults */ }
          }
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Sender ID — 5 digits only ──
  const handleSenderIdChange = (val: string) => {
    // Only allow digits, max 5
    const digits = val.replace(/\D/g, '').slice(0, 5);
    setSenderId(digits);
  };

  const toggle = (key: TriggerKey) => setTriggers(p => ({ ...p, [key]: !p[key] }));

  // ── Save settings to DB ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate sender ID
    if (senderId && senderId.length !== 5) {
      setError('Sender ID must be exactly 5 digits.');
      return;
    }

    setSaving(true); setError(''); setSaved(false);
    try {
      const res  = await fetch('/api/integration/sms', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          enabled:    enabled ? '1' : '0',
          api_key:    apiKey,
          api_secret: baseUrl,   // store base_url in api_secret field
          sender_id:  senderId,
          triggers:   JSON.stringify(triggers),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(json.message || 'Failed to save.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Test SMS ──
  const handleTest = async () => {
    if (!testPhone) return;
    setTesting(true); setTestResult(null); setTestResultMsg('');
    try {
      const res  = await fetch('/api/integration/sms-test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ to: testPhone, message: testMsg }),
      });
      const json = await res.json();
      setTestResult(json.success ? 'success' : 'error');
      setTestResultMsg(json.message || '');
    } catch {
      setTestResult('error');
      setTestResultMsg('Network error. Please try again.');
    } finally {
      setTesting(false);
      setTimeout(() => { setTestResult(null); setTestResultMsg(''); }, 6000);
    }
  };

  return (
    <>
      <Head><title>SMS Integration — ATLINE Admin</title></Head>
      <IntegrationLayout activeTab="sms">
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            <i className="bi bi-chat-dots-fill"></i>
          </div>
          <div>
            <h2 className="int-section-title">SMS via Infobip</h2>
            <p className="int-section-sub">
              Send automated SMS notifications using Infobip.{' '}
              <a href="https://www.infobip.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: 13 }}>
                infobip.com <i className="bi bi-box-arrow-up-right" style={{ fontSize: 11 }}></i>
              </a>
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {saved  && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> SMS settings saved successfully.</div>}
            {error  && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}><i className="bi bi-exclamation-circle-fill me-2"></i>{error}</div>}

            {/* Credentials */}
            <div className="int-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-key-fill"></i> Infobip Credentials</div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{enabled ? 'Enabled' : 'Disabled'}</span>
                  <div className={`int-toggle ${enabled ? 'int-toggle-on' : ''}`} onClick={() => setEnabled(!enabled)}>
                    <div className="int-toggle-thumb"></div>
                  </div>
                </div>
              </div>

              <div className="int-info-note mb-3">
                <i className="bi bi-info-circle-fill"></i>
                Get your API key from{' '}
                <a href="https://portal.infobip.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                  portal.infobip.com → API Keys
                </a>. Your base URL is unique to your account.
              </div>

              <FormRow label="API Key" hint="Infobip API key (keep this secret)">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="rm-input"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Enter your Infobip API key"
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowKey(!showKey)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15,
                  }}>
                    <i className={`bi ${showKey ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </FormRow>

              <FormRow label="Base URL" hint="Your unique Infobip API base URL">
                <input
                  className="rm-input"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://xxxxx.api.infobip.com"
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
              </FormRow>

              <FormRow
                label="Sender ID"
                hint="5-digit number registered with Infobip (e.g. 63001)"
                last
              >
                <div>
                  <input
                    className="rm-input"
                    style={{ maxWidth: 140 }}
                    value={senderId}
                    onChange={e => handleSenderIdChange(e.target.value)}
                    placeholder="e.g. 63001"
                    inputMode="numeric"
                    maxLength={5}
                  />
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Progress dots */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[0,1,2,3,4].map(i => (
                        <div key={i} style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: i < senderId.length ? '#f97316' : '#e5e7eb',
                          transition: 'background .15s',
                        }}></div>
                      ))}
                    </div>
                    <span style={{ fontSize: 11.5, color: senderId.length === 5 ? '#16a34a' : '#9ca3af' }}>
                      {senderId.length}/5 digits
                      {senderId.length === 5 && <> &nbsp;<i className="bi bi-check-circle-fill" style={{ color: '#16a34a' }}></i></>}
                    </span>
                  </div>
                  {senderId.length > 0 && senderId.length < 5 && (
                    <div style={{ fontSize: 11.5, color: '#f97316', marginTop: 4 }}>
                      <i className="bi bi-exclamation-circle me-1"></i>
                      Must be exactly 5 digits
                    </div>
                  )}
                </div>
              </FormRow>
            </div>

            {/* SMS Triggers */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-bell-fill"></i> SMS Notification Triggers</div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                Select which system events should trigger an automatic SMS notification.
              </p>
              <div className="int-triggers-grid">
                {(Object.keys(triggers) as TriggerKey[]).map(key => (
                  <label key={key} className="int-trigger-item">
                    <div className="int-trigger-info">
                      <span className="int-trigger-label">{TRIGGER_LABELS[key]}</span>
                    </div>
                    <div className={`int-toggle ${triggers[key] ? 'int-toggle-on' : ''}`} onClick={() => toggle(key)}>
                      <div className="int-toggle-thumb"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Test SMS */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-send-fill"></i> Send Test SMS</div>
              <FormRow label="Phone Number" hint="Include country code e.g. +60123456789">
                <input
                  className="rm-input"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="+60123456789"
                />
              </FormRow>
              <FormRow label="Message" last>
                <div>
                  <textarea
                    className="rm-input"
                    rows={3}
                    value={testMsg}
                    onChange={e => setTestMsg(e.target.value.slice(0, 160))}
                    style={{ resize: 'none' }}
                  />
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <span style={{ fontSize: 11.5, color: '#9ca3af' }}>{testMsg.length}/160 characters</span>
                    <button
                      type="button"
                      className="rm-btn-outline"
                      onClick={handleTest}
                      disabled={testing || !testPhone}
                      style={{ fontSize: 12.5, padding: '6px 14px' }}
                    >
                      {testing
                        ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 13, height: 13, borderWidth: 2 }}></span>Sending…</>
                        : <><i className="bi bi-send"></i> Send Test</>
                      }
                    </button>
                  </div>
                  {testResult === 'success' && (
                    <div className="int-test-success mt-2">
                      <i className="bi bi-check-circle-fill"></i> {testResultMsg || `Test SMS sent to ${testPhone}!`}
                    </div>
                  )}
                  {testResult === 'error' && (
                    <div className="int-test-error mt-2">
                      <i className="bi bi-x-circle-fill"></i> {testResultMsg || 'Failed. Check your API key and phone number.'}
                    </div>
                  )}
                </div>
              </FormRow>
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
