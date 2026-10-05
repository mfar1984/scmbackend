'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import ConfigLayout from '../../components/ConfigLayout';
import { refreshBranding } from '../../lib/useBranding';
import NotificationSoundCard from '../../components/config/NotificationSoundCard';

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

function ColorPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="d-flex align-items-center gap-3">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 44, height: 36, border: '1px solid #d1d9e6', borderRadius: 7, cursor: 'pointer', padding: 2 }} />
      <input className="rm-input" style={{ maxWidth: 120, fontFamily: 'monospace' }}
        value={value} onChange={e => onChange(e.target.value)} placeholder="#3b82f6" />
      <span style={{ fontSize: 12.5, color: '#6b7280' }}>{label}</span>
    </div>
  );
}

// Click-to-upload card with image preview — all cards same size
function UploadCard({
  label, hint, accept, preview, onChange, onError,
}: {
  label: string; hint: string; accept: string;
  preview: string; onChange: (dataUrl: string) => void; onError: (msg: string) => void;
}) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Guard: keep images small enough to store/transport (max 2MB raw → ~2.7MB base64)
    if (file.size > 2 * 1024 * 1024) {
      onError(`"${label}" image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use an image under 2MB.`);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => { onError(''); onChange(ev.target?.result as string); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, userSelect: 'none' }}>
      <input type="file" accept={accept} style={{ display: 'none' }} onChange={handleFile} />

      {/* Fixed size box — same for all 4 cards */}
      <div style={{
        width: '100%',
        height: 110,
        background: '#f8fafc',
        border: `2px dashed ${preview ? '#3b82f6' : '#d1d9e6'}`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative', transition: 'border-color .2s',
      }}>
        {preview ? (
          <>
            <img src={preview} alt={label}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 10 }} />
            {/* Hover overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(59,130,246,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity .2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
            >
              <div style={{
                background: '#fff', borderRadius: 8, padding: '4px 12px',
                fontSize: 12, color: '#3b82f6',
                display: 'flex', alignItems: 'center', gap: 5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                <i className="bi bi-arrow-repeat"></i> Change
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <i className="bi bi-cloud-upload" style={{ fontSize: 22, display: 'block', marginBottom: 4 }}></i>
            <span style={{ fontSize: 11.5 }}>Click to upload</span>
          </div>
        )}
      </div>

      {/* Label below */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#374151' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{hint}</div>
      </div>
    </label>
  );
}

export default function BrandingConfigPage() {
  const [adminLogo, setAdminLogo]       = useState('');
  const [sidebarLogo, setSidebarLogo]   = useState('');
  const [loginImage, setLoginImage]     = useState('');
  const [favicon, setFavicon]           = useState('');
  const [loginBg, setLoginBg]           = useState('gradient');
  const [loginBgColor, setLoginBgColor] = useState('#0f1623');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/config/branding')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data;
          setAdminLogo(d.admin_logo     || '');
          setSidebarLogo(d.sidebar_logo || '');
          setLoginImage(d.login_image   || '');
          setFavicon(d.favicon          || '');
          setLoginBg(d.login_bg         || 'gradient');
          setLoginBgColor(d.login_bg_color || '#0f1623');
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/config/branding', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_logo: adminLogo, sidebar_logo: sidebarLogo,
          login_image: loginImage, favicon,
          login_bg: loginBg, login_bg_color: loginBgColor,
        }),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); refreshBranding(); setTimeout(() => setSaved(false), 3000); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>Branding Config — ATLINE Admin</title></Head>
      <ConfigLayout activeTab="branding">
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
            <i className="bi bi-palette-fill"></i>
          </div>
          <div>
            <h2 className="int-section-title">Branding & Appearance</h2>
            <p className="int-section-sub">Customise the visual identity of the admin panel — logo, favicon and login page background.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading settings...
          </div>
        ) : (
        <form onSubmit={handleSave}>
          {saved && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> Branding settings saved.</div>}
          {error && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}>{error}</div>}

          {/* ── Logo & Favicon — Horizontal Grid ── */}
          <div className="int-card">
            <div className="int-card-title"><i className="bi bi-image-fill"></i> Logo & Favicon</div>

            {/* 4-column horizontal grid — all same size */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 24,
              padding: '8px 0 4px',
            }}>
              <UploadCard
                label="Admin Logo"
                hint="Header area · PNG/SVG"
                accept=".png,.svg,.jpg,.jpeg"
                preview={adminLogo}
                onChange={setAdminLogo}
                onError={setError}
              />
              <UploadCard
                label="Sidebar Logo"
                hint="Sidebar top · PNG/SVG"
                accept=".png,.svg,.jpg,.jpeg"
                preview={sidebarLogo}
                onChange={setSidebarLogo}
                onError={setError}
              />
              <UploadCard
                label="Image Login"
                hint="Login page · JPG/PNG"
                accept=".jpg,.jpeg,.png,.webp"
                preview={loginImage}
                onChange={setLoginImage}
                onError={setError}
              />
              <UploadCard
                label="Fav Icon"
                hint="Browser tab · ICO/PNG"
                accept=".ico,.png"
                preview={favicon}
                onChange={setFavicon}
                onError={setError}
              />
            </div>
          </div>

          {/* ── Login Page Background ── */}
          <div className="int-card">
            <div className="int-card-title"><i className="bi bi-door-open-fill"></i> Login Page Background</div>
            <FormRow label="Background Style" last>
              <div className="d-flex gap-3 flex-wrap align-items-center">
                {[
                  { val: 'gradient', label: 'Dark Gradient (default)' },
                  { val: 'solid',    label: 'Solid Colour' },
                  { val: 'image',    label: 'Custom Image (use Image Login above)' },
                ].map(opt => (
                  <label key={opt.val} className="int-radio-label">
                    <input type="radio" name="loginBg" value={opt.val} checked={loginBg === opt.val} onChange={() => setLoginBg(opt.val)} />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
              {loginBg === 'solid' && (
                <div style={{ marginTop: 12 }}>
                  <ColorPicker value={loginBgColor} onChange={setLoginBgColor} label="Background Colour" />
                </div>
              )}
            </FormRow>
          </div>

          <div className="int-footer">
            <button type="submit" className="rm-btn-primary" disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                : <><i className="bi bi-floppy-fill"></i> Save Branding</>
              }
            </button>
          </div>
        </form>
        )}

        {!loading && (
          <div style={{ marginTop: 24 }}>
            <NotificationSoundCard />
          </div>
        )}
      </ConfigLayout>
    </>
  );
}
