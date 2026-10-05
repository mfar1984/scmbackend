'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import IntegrationLayout from '../../components/IntegrationLayout';
import { usePermissions } from '../../lib/usePermissions';

function FormRow({ label, hint, required, last, children }: {
  label: string; hint?: string; required?: boolean; last?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`usr-form-row ${last ? 'usr-form-row-last' : ''}`}>
      <div className="usr-form-label" style={{ paddingTop: 8 }}>
        <div>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</div>
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
  | 'payslipReady'  | 'newRegistration';

const TRIGGER_LABELS: Record<TriggerKey, string> = {
  leaveApproved:   'Leave Application Approved',
  leaveRejected:   'Leave Application Rejected',
  claimApproved:   'Claim Approved',
  claimRejected:   'Claim Rejected',
  otApproved:      'Overtime Approved',
  newApplication:  'New Job Application Received',
  payslipReady:    'Payslip Ready',
  newRegistration: 'New Supplier / Partner Registration',
};

const DEFAULT_TRIGGERS: Record<TriggerKey, boolean> = {
  leaveApproved:   true,
  leaveRejected:   false,
  claimApproved:   true,
  claimRejected:   false,
  otApproved:      true,
  newApplication:  true,
  payslipReady:    false,
  newRegistration: true,
};

export default function TelegramIntegrationPage() {
  const { can } = usePermissions();
  const canUpdate = can('settings.integration.telegram', 'Update');

  const [enabled, setEnabled]       = useState(false);
  const [botToken, setBotToken]     = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [channelId, setChannelId]   = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [triggers, setTriggers]     = useState<Record<TriggerKey, boolean>>(DEFAULT_TRIGGERS);
  const [showToken, setShowToken]   = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  const [verifying, setVerifying] = useState(false);
  const [testing, setTesting]     = useState(false);
  const [result, setResult]       = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/integration/telegram')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data;
          setEnabled(d.enabled === '1');
          setBotToken(d.bot_token || '');
          setBotUsername(d.bot_username || '');
          setChannelId(d.channel_id || '');
          setOwnerUserId(d.owner_user_id || '');
          setOwnerUsername(d.owner_username || '');
          if (d.triggers) {
            try { setTriggers({ ...DEFAULT_TRIGGERS, ...JSON.parse(d.triggers) }); } catch { /* defaults */ }
          }
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: TriggerKey) => setTriggers(p => ({ ...p, [key]: !p[key] }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken.trim()) { setError('Bot API Token is required.'); return; }
    if (!channelId.trim()) { setError('Channel ID is required.'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/integration/telegram', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled:        enabled ? '1' : '0',
          bot_token:      botToken,
          bot_username:   botUsername,
          channel_id:     channelId,
          owner_user_id:  ownerUserId,
          owner_username: ownerUsername,
          triggers:       JSON.stringify(triggers),
        }),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  const runTest = async (action: 'verify' | 'send', targetOrNull?: 'channel' | 'owner') => {
    setResult(null);
    if (action === 'verify') setVerifying(true); else setTesting(true);
    try {
      const res = await fetch('/api/integration/telegram-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, target: targetOrNull }),
      });
      const json = await res.json();
      setResult({ ok: !!json.success, text: json.message || (json.success ? 'Done.' : 'Failed.') });
    } catch {
      setResult({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setVerifying(false); setTesting(false);
      setTimeout(() => setResult(null), 8000);
    }
  };

  return (
    <>
      <Head><title>Telegram Integration — ATLINE Admin</title></Head>
      <IntegrationLayout activeTab="telegram">
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#2AABEE,#229ED9)' }}>
            <i className="bi bi-telegram"></i>
          </div>
          <div>
            <h2 className="int-section-title">Telegram Notifications</h2>
            <p className="int-section-sub">
              Send automated notifications to a Telegram channel via a bot.{' '}
              <a href="https://core.telegram.org/bots#botfather" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: 13 }}>
                Create a bot with @BotFather <i className="bi bi-box-arrow-up-right" style={{ fontSize: 11 }}></i>
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
            {saved && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> Telegram settings saved successfully.</div>}
            {error && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}><i className="bi bi-exclamation-circle-fill me-2"></i>{error}</div>}

            {/* Credentials */}
            <div className="int-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-robot"></i> Bot Configuration</div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{enabled ? 'Enabled' : 'Disabled'}</span>
                  <div className={`int-toggle ${enabled ? 'int-toggle-on' : ''}`} onClick={() => canUpdate && setEnabled(!enabled)}>
                    <div className="int-toggle-thumb"></div>
                  </div>
                </div>
              </div>

              <div className="int-info-note mb-3">
                <i className="bi bi-info-circle-fill"></i>
                Message <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>@BotFather</a> to create a bot and get the token.
                Add the bot to your channel as an admin, then use the channel username (e.g. <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>@mychannel</code>) or numeric ID (e.g. <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>-1001234567890</code>).
              </div>

              <FormRow label="Bot API Token" hint="From @BotFather (keep this secret)" required>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showToken ? 'text' : 'password'}
                    className="rm-input"
                    value={botToken}
                    onChange={e => setBotToken(e.target.value)}
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyz"
                    style={{ paddingRight: 40, fontFamily: 'monospace', fontSize: 13 }}
                    disabled={!canUpdate}
                  />
                  <button type="button" onClick={() => setShowToken(!showToken)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15,
                  }}>
                    <i className={`bi ${showToken ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </FormRow>

              <FormRow label="Bot Username" hint="e.g. @atline_bot (optional)">
                <input className="rm-input" value={botUsername} onChange={e => setBotUsername(e.target.value)} placeholder="@atline_bot" disabled={!canUpdate} />
              </FormRow>

              <FormRow label="Channel ID" hint="@channelusername or numeric -100… id where messages are posted" required>
                <input className="rm-input" value={channelId} onChange={e => setChannelId(e.target.value)} placeholder="@atline_channel or -1001234567890" style={{ fontFamily: 'monospace', fontSize: 13 }} disabled={!canUpdate} />
              </FormRow>

              <FormRow label="Owner User ID" hint="Numeric Telegram user ID for direct alerts (optional)">
                <input className="rm-input" value={ownerUserId} onChange={e => setOwnerUserId(e.target.value)} placeholder="123456789" style={{ fontFamily: 'monospace', fontSize: 13 }} disabled={!canUpdate} />
              </FormRow>

              <FormRow label="Owner Username" hint="e.g. @admin_name (optional)" last>
                <input className="rm-input" value={ownerUsername} onChange={e => setOwnerUsername(e.target.value)} placeholder="@admin_name" disabled={!canUpdate} />
              </FormRow>
            </div>

            {/* Triggers */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-bell-fill"></i> Notification Triggers</div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                Select which system events post a message to the Telegram channel.
              </p>
              <div className="int-triggers-grid">
                {(Object.keys(triggers) as TriggerKey[]).map(key => (
                  <label key={key} className="int-trigger-item">
                    <div className="int-trigger-info">
                      <span className="int-trigger-label">{TRIGGER_LABELS[key]}</span>
                    </div>
                    <div className={`int-toggle ${triggers[key] ? 'int-toggle-on' : ''}`} onClick={() => canUpdate && toggle(key)}>
                      <div className="int-toggle-thumb"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Test */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-send-fill"></i> Test Connection</div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                Verify the bot token, then send a live test message. The timestamp uses your General config date &amp; time format.
              </p>
              {canUpdate && (
                <div className="d-flex gap-2 flex-wrap">
                  <button type="button" className="rm-btn-outline" onClick={() => runTest('verify')} disabled={verifying || !botToken}>
                    {verifying ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 13, height: 13, borderWidth: 2 }}></span>Verifying…</> : <><i className="bi bi-patch-check"></i> Verify Bot Token</>}
                  </button>
                  <button type="button" className="rm-btn-outline" onClick={() => runTest('send', 'channel')} disabled={testing || !botToken || !channelId}>
                    {testing ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 13, height: 13, borderWidth: 2 }}></span>Sending…</> : <><i className="bi bi-broadcast"></i> Send to Channel</>}
                  </button>
                  {ownerUserId && (
                    <button type="button" className="rm-btn-outline" onClick={() => runTest('send', 'owner')} disabled={testing || !botToken}>
                      <i className="bi bi-person-badge"></i> Send to Owner
                    </button>
                  )}
                </div>
              )}
              {result && (
                <div className={`mt-3 ${result.ok ? 'int-test-success' : 'int-test-error'}`}>
                  <i className={`bi ${result.ok ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i> {result.text}
                </div>
              )}
              <div className="int-info-note mt-3" style={{ marginBottom: 0 }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                Save your settings before testing — the test uses the saved credentials.
              </div>
            </div>

            {canUpdate && (
              <div className="int-footer">
                <button type="submit" className="rm-btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-floppy-fill"></i> Save Settings</>}
                </button>
              </div>
            )}
          </form>
        )}
      </IntegrationLayout>
    </>
  );
}
