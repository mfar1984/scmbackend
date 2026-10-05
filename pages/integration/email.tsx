'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import IntegrationLayout from '../../components/IntegrationLayout';

function FormRow({ label, hint, required, last, children }: {
  label: string; hint?: string; required?: boolean; last?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`usr-form-row ${last ? 'usr-form-row-last' : ''}`}>
      <div className="usr-form-label" style={{ paddingTop: 8 }}>
        <div>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</div>
        {hint && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 2 }}>{hint}</div>}
      </div>
      <div className="usr-form-field">{children}</div>
    </div>
  );
}

type Profile = {
  profile_key: string; name: string;
  from_name: string; from_email: string; reply_to: string;
  smtp_host: string; smtp_port: string; smtp_encryption: string;
  smtp_user: string; smtp_pass: string; status: string;
};

const ICONS: Record<string, string> = { hr: 'bi-people-fill', support: 'bi-headset' };

export default function EmailIntegrationPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeKey, setActiveKey] = useState<string>('');
  const [form, setForm] = useState<Profile | null>(null);

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testResultMsg, setTestResultMsg] = useState('');

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integration/email-profiles');
      const json = await res.json();
      if (json.success) {
        setProfiles(json.data);
        if (json.data.length) {
          const first = json.data[0];
          setActiveKey(first.profile_key);
          setForm(first);
        }
      }
    } catch { setError('Failed to load profiles.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const selectProfile = (p: Profile) => {
    setActiveKey(p.profile_key);
    setForm({ ...p });
    setSaved(false); setError(''); setTestResult(null);
  };

  const set = (k: keyof Profile, v: string) => setForm(f => f ? { ...f, [k]: v } : f);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch(`/api/integration/email-profiles/${form.profile_key}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true); setTimeout(() => setSaved(false), 3000);
        loadProfiles();
      } else setError(json.message || 'Failed to save.');
    } catch { setError('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    if (!testEmail || !form) return;
    setTesting(true); setTestResult(null); setTestResultMsg('');
    try {
      const res = await fetch('/api/integration/email-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail, profile: form.profile_key }),
      });
      const json = await res.json();
      setTestResult(json.success ? 'success' : 'error');
      setTestResultMsg(json.message || '');
    } catch { setTestResult('error'); setTestResultMsg('Network error.'); }
    finally { setTesting(false); setTimeout(() => { setTestResult(null); setTestResultMsg(''); }, 6000); }
  };

  return (
    <>
      <Head><title>Email Integration — ATLINE Admin</title></Head>
      <IntegrationLayout activeTab="email">
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
            <i className="bi bi-envelope-fill"></i>
          </div>
          <div>
            <h2 className="int-section-title">Email Profiles Management</h2>
            <p className="int-section-sub">Configure SMTP profiles used for system emails (HR, support, notifications).</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading profiles...
          </div>
        ) : form && (
          <form onSubmit={handleSave}>
            {/* Profile selector */}
            <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Select Email Profile:</span>
              {profiles.map(p => (
                <button key={p.profile_key} type="button"
                  className={`em-profile-pick${activeKey === p.profile_key ? ' active' : ''}`}
                  onClick={() => selectProfile(p)}>
                  <i className={`bi ${ICONS[p.profile_key] || 'bi-envelope'}`}></i>
                  {p.name}
                  <span className={`em-profile-dot ${p.status === 'Active' ? 'on' : 'off'}`}></span>
                </button>
              ))}
            </div>

            {saved && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> {form.name} saved successfully.</div>}
            {error && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}><i className="bi bi-exclamation-circle-fill me-2"></i>{error}</div>}

            {/* Profile / Sender */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-person-badge-fill"></i> Profile &amp; Sender</div>
              <FormRow label="Profile Name" required>
                <input className="rm-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="HR Department Email" />
              </FormRow>
              <FormRow label="From Name" hint="Display name shown to recipients">
                <input className="rm-input" value={form.from_name || ''} onChange={e => set('from_name', e.target.value)} placeholder="ATLINE HR Department" />
              </FormRow>
              <FormRow label="From Email">
                <input type="email" className="rm-input" value={form.from_email || ''} onChange={e => set('from_email', e.target.value)} placeholder="hr@atline.com.my" />
              </FormRow>
              <FormRow label="Reply-To Email">
                <input type="email" className="rm-input" value={form.reply_to || ''} onChange={e => set('reply_to', e.target.value)} placeholder="hr@atline.com.my" />
              </FormRow>
              <FormRow label="Status" last>
                <select className="rm-input" style={{ maxWidth: 200 }} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option>Active</option><option>Inactive</option>
                </select>
              </FormRow>
            </div>

            {/* SMTP Server */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-server"></i> SMTP Server</div>
              <FormRow label="SMTP Host" hint="Mail server hostname" required>
                <input className="rm-input" value={form.smtp_host || ''} onChange={e => set('smtp_host', e.target.value)} placeholder="mail.atline.com.my" />
              </FormRow>
              <FormRow label="SMTP Port" hint="587 (TLS) · 465 (SSL) · 25 (plain)">
                <input className="rm-input" style={{ maxWidth: 120 }} value={form.smtp_port || ''} onChange={e => set('smtp_port', e.target.value)} placeholder="587" />
              </FormRow>
              <FormRow label="Encryption" last>
                <div className="d-flex gap-3">
                  {['None', 'TLS', 'SSL'].map(opt => (
                    <label key={opt} className="int-radio-label">
                      <input type="radio" name="enc" value={opt} checked={form.smtp_encryption === opt} onChange={() => set('smtp_encryption', opt)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </FormRow>
            </div>

            {/* Authentication */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-shield-lock-fill"></i> Authentication</div>
              <FormRow label="SMTP Username" required>
                <input className="rm-input" value={form.smtp_user || ''} onChange={e => set('smtp_user', e.target.value)} placeholder="hr@atline.com.my" />
              </FormRow>
              <FormRow label="SMTP Password" hint="Leave unchanged to keep current password" required last>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="rm-input" value={form.smtp_pass || ''}
                    onChange={e => set('smtp_pass', e.target.value)} placeholder="Enter new password to change" style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15,
                  }}>
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </FormRow>
            </div>

            {/* Test */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-send-fill"></i> Test This Profile</div>
              <FormRow label="Send Test Email" hint={`Sends using "${form.name}"`} last>
                <div className="d-flex gap-2">
                  <input type="email" className="rm-input" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" />
                  <button type="button" className="rm-btn-outline" onClick={handleTest} disabled={testing || !testEmail} style={{ whiteSpace: 'nowrap' }}>
                    {testing ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 13, height: 13, borderWidth: 2 }}></span>Sending…</> : <><i className="bi bi-send"></i> Send Test</>}
                  </button>
                </div>
                {testResult === 'success' && <div className="int-test-success mt-2"><i className="bi bi-check-circle-fill"></i> {testResultMsg || 'Test email sent!'}</div>}
                {testResult === 'error'   && <div className="int-test-error mt-2"><i className="bi bi-x-circle-fill"></i> {testResultMsg || 'Failed to send.'}</div>}
              </FormRow>
            </div>

            <div className="int-footer">
              <button type="submit" className="rm-btn-primary" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-floppy-fill"></i> Save Profile</>}
              </button>
            </div>
          </form>
        )}
      </IntegrationLayout>
    </>
  );
}
