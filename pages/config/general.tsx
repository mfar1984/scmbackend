'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import ConfigLayout from '../../components/ConfigLayout';
import { usePermissions } from '../../lib/usePermissions';

function FormRow({ label, hint, last, children }: { label: string; hint?: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div className={`usr-form-row${last ? ' usr-form-row-last' : ''}`}>
      <div className="usr-form-label" style={{ paddingTop: 8 }}>
        <div>{label}</div>
        {hint && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 2 }}>{hint}</div>}
      </div>
      <div className="usr-form-field">{children}</div>
    </div>
  );
}

export default function GeneralConfigPage() {
  const { can } = usePermissions();
  const canUpdate = can('settings.config.general', 'Update');
  const [siteName, setSiteName]         = useState('');
  const [siteUrl, setSiteUrl]           = useState('');
  const [adminEmail, setAdminEmail]     = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [hrNotifyEmail, setHrNotifyEmail] = useState('');
  const [phone, setPhone]               = useState('');
  const [address, setAddress]           = useState('');
  const [timezone, setTimezone]         = useState('Asia/Kuala_Lumpur');
  const [dateFormat, setDateFormat]     = useState('DD MMM YYYY');
  const [timeFormat, setTimeFormat]     = useState('12h');
  const [regNo, setRegNo]               = useState('');
  const [maxUploadMb, setMaxUploadMb]   = useState('60');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  // ── Load from DB ──
  useEffect(() => {
    fetch('/api/config/general')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data;
          setSiteName(d.site_name     || '');
          setSiteUrl(d.site_url       || '');
          setRegNo(d.reg_no           || '');
          setAdminEmail(d.admin_email || '');
          setSupportEmail(d.support_email || '');
          setHrNotifyEmail(d.hr_notify_email || '');
          setPhone(d.phone            || '');
          setAddress(d.address        || '');
          setTimezone(d.timezone      || 'Asia/Kuala_Lumpur');
          setDateFormat(d.date_format || 'DD MMM YYYY');
          setTimeFormat(d.time_format || '12h');
          setMaxUploadMb(d.max_upload_mb || '60');
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Save to DB ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res  = await fetch('/api/config/general', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          site_name: siteName, site_url: siteUrl, reg_no: regNo,
          admin_email: adminEmail, support_email: supportEmail,
          hr_notify_email: hrNotifyEmail,
          phone, address, timezone, date_format: dateFormat,
          time_format: timeFormat, max_upload_mb: maxUploadMb,
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Clear date format cache so all pages pick up new settings
        await fetch('/api/config/date-format', { method: 'POST' });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(json.message || 'Failed to save.');
      }
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>General Config — ATLINE Admin</title></Head>
      <ConfigLayout activeTab="general">
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
            <i className="bi bi-sliders"></i>
          </div>
          <div>
            <h2 className="int-section-title">General Settings</h2>
            <p className="int-section-sub">Core system settings — site identity, contact details, locale and regional preferences.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {saved  && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> Settings saved successfully.</div>}
            {error  && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}><i className="bi bi-exclamation-circle-fill me-2"></i>{error}</div>}

            {/* Site Identity */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-building-fill"></i> Site Identity</div>
              <FormRow label="Site Name" hint="Displayed in browser tab and emails">
                <input className="rm-input" value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="ATLINE SDN BHD" />
              </FormRow>
              <FormRow label="Site URL" hint="Full URL including https://">
                <input className="rm-input" value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder="https://atline.com.my" />
              </FormRow>
              <FormRow label="Company Reg. No." hint="SSM registration number" last>
                <input className="rm-input" value={regNo} onChange={e => setRegNo(e.target.value)} placeholder="201503318537 (002488335-X)" />
              </FormRow>
            </div>

            {/* Contact */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-envelope-fill"></i> Contact Information</div>
              <FormRow label="Admin Email" hint="System notifications sent to this address">
                <input type="email" className="rm-input" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
              </FormRow>
              <FormRow label="Support Email" hint="Displayed on website and emails to clients">
                <input type="email" className="rm-input" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
              </FormRow>
              <FormRow label="HR Notification Email" hint="ESS submissions (leave, claim, overtime, expense) are emailed here">
                <input type="email" className="rm-input" value={hrNotifyEmail} onChange={e => setHrNotifyEmail(e.target.value)} placeholder="hr@atline.com.my" />
              </FormRow>
              <FormRow label="Phone Number">
                <input className="rm-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="03-XXXX XXXX" />
              </FormRow>
              <FormRow label="Office Address" last>
                <textarea className="rm-input" rows={3} value={address} onChange={e => setAddress(e.target.value)} style={{ resize: 'vertical' }} />
              </FormRow>
            </div>

            {/* Locale */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-globe-asia-australia"></i> Locale & Regional</div>
              <FormRow label="Timezone">
                <select className="rm-input" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (UTC+8)</option>
                  <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  <option value="UTC">UTC (UTC+0)</option>
                </select>
              </FormRow>
              <FormRow label="Date Format">
                <select className="rm-input" value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
                  <option value="DD MMM YYYY">DD MMM YYYY (e.g. 15 Jan 2026)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 15/01/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-01-15)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 01/15/2026)</option>
                </select>
              </FormRow>
              <FormRow label="Time Format" last>
                <div className="d-flex gap-3">
                  {[{ val: '12h', label: '12-hour (1:30 PM)' }, { val: '24h', label: '24-hour (13:30)' }].map(opt => (
                    <label key={opt.val} className="int-radio-label">
                      <input type="radio" name="timeFormat" value={opt.val} checked={timeFormat === opt.val} onChange={() => setTimeFormat(opt.val)} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </FormRow>
            </div>

            {/* Uploads */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-cloud-arrow-up-fill"></i> Uploads</div>
              <FormRow label="Max Upload Size (MB)" hint="Applies to file uploads such as Downloads and tender documents" last>
                <div className="d-flex align-items-center gap-2">
                  <input type="number" min={1} max={1024} className="rm-input" style={{ maxWidth: 140 }} value={maxUploadMb} onChange={e => setMaxUploadMb(e.target.value)} />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>MB</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 6 }}>
                  <i className="bi bi-info-circle me-1"></i>For cPanel/shared hosting, also ensure your server&apos;s PHP/Node and proxy limits allow this size.
                </div>
              </FormRow>
            </div>

            <div className="int-footer">
              <button type="submit" className="rm-btn-primary" disabled={saving || !canUpdate}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                  : <><i className="bi bi-floppy-fill"></i> Save Settings</>
                }
              </button>
            </div>
          </form>
        )}
      </ConfigLayout>
    </>
  );
}
