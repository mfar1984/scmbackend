'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import ConfigLayout from '../../components/ConfigLayout';

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

export default function SocialSeoConfigPage() {
  const [facebook, setFacebook]     = useState('');
  const [tiktok, setTiktok]         = useState('');
  const [whatsapp, setWhatsapp]     = useState('');
  const [linkedin, setLinkedin]     = useState('');
  const [instagram, setInstagram]   = useState('');
  const [twitter, setTwitter]       = useState('');
  const [metaTitle, setMetaTitle]   = useState('');
  const [metaDesc, setMetaDesc]     = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [ogImage, setOgImage]       = useState('');
  const [gaId, setGaId]             = useState('');
  const [gtmId, setGtmId]           = useState('');
  const [gscCode, setGscCode]       = useState('');
  const [robotsTxt, setRobotsTxt]   = useState('User-agent: *\nAllow: /\nSitemap: https://atline.com.my/sitemap.xml');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');
  const [ogUploading, setOgUploading] = useState(false);

  const handleOgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('OG image is too large (max 5MB).'); return; }
    setOgUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const j = await (await fetch('/api/config/og-upload', { method: 'POST', body: fd })).json();
      if (j.success && j.url) setOgImage(j.url);
      else setError(j.message || 'Upload failed.');
    } catch { setError('Network error during upload.'); }
    finally { setOgUploading(false); }
  };

  useEffect(() => {
    fetch('/api/config/social_seo')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data;
          setFacebook(d.facebook     || '');
          setTiktok(d.tiktok         || '');
          setWhatsapp(d.whatsapp     || '');
          setLinkedin(d.linkedin     || '');
          setInstagram(d.instagram   || '');
          setTwitter(d.twitter       || '');
          setMetaTitle(d.meta_title  || '');
          setMetaDesc(d.meta_desc    || '');
          setMetaKeywords(d.meta_keywords || '');
          setOgImage(d.og_image      || '');
          setGaId(d.ga_id            || '');
          setGtmId(d.gtm_id          || '');
          setGscCode(d.gsc_code      || '');
          setRobotsTxt(d.robots_txt  || 'User-agent: *\nAllow: /\nSitemap: https://atline.com.my/sitemap.xml');
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res  = await fetch('/api/config/social_seo', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facebook, tiktok, whatsapp, linkedin, instagram, twitter,
          meta_title: metaTitle, meta_desc: metaDesc, meta_keywords: metaKeywords,
          og_image: ogImage, ga_id: gaId, gtm_id: gtmId, gsc_code: gscCode, robots_txt: robotsTxt,
        }),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>Social & SEO Config — ATLINE Admin</title></Head>
      <ConfigLayout activeTab="social-seo">
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            <i className="bi bi-share-fill"></i>
          </div>
          <div>
            <h2 className="int-section-title">Social Media & SEO</h2>
            <p className="int-section-sub">Configure social media links, meta tags, analytics tracking and search engine settings.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading settings...
          </div>
        ) : (
        <form onSubmit={handleSave}>
          {saved  && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> Settings saved.</div>}
          {error  && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}>{error}</div>}

          {/* Social Media */}
          <div className="int-card">
            <div className="int-card-title"><i className="bi bi-people-fill"></i> Social Media Links</div>
            {[
              { label: 'Facebook',  icon: 'bi-facebook',  val: facebook,  set: setFacebook,  ph: 'https://www.facebook.com/atline' },
              { label: 'TikTok',    icon: 'bi-tiktok',    val: tiktok,    set: setTiktok,    ph: 'https://www.tiktok.com/@atline' },
              { label: 'WhatsApp',  icon: 'bi-whatsapp',  val: whatsapp,  set: setWhatsapp,  ph: '+60312345678' },
              { label: 'LinkedIn',  icon: 'bi-linkedin',  val: linkedin,  set: setLinkedin,  ph: 'https://linkedin.com/company/atline' },
              { label: 'Instagram', icon: 'bi-instagram', val: instagram, set: setInstagram, ph: 'https://instagram.com/atline' },
              { label: 'Twitter/X', icon: 'bi-twitter-x', val: twitter,   set: setTwitter,   ph: 'https://twitter.com/atline' },
            ].map((s, i, arr) => (
              <FormRow key={s.label} label={s.label} last={i === arr.length - 1}>
                <div style={{ position: 'relative' }}>
                  <i className={`bi ${s.icon}`} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 15 }}></i>
                  <input className="rm-input" style={{ paddingLeft: 36 }} value={s.val} onChange={e => s.set(e.target.value)} placeholder={s.ph} />
                </div>
              </FormRow>
            ))}
          </div>

          {/* SEO Meta */}
          <div className="int-card">
            <div className="int-card-title"><i className="bi bi-search"></i> Default SEO Meta Tags</div>
            <div className="int-info-note mb-3">
              <i className="bi bi-info-circle-fill"></i>
              These are default meta tags for the website. Individual pages can override these values.
            </div>
            <FormRow label="Meta Title" hint="50–60 characters recommended">
              <input className="rm-input" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} />
              <div style={{ fontSize: 11.5, color: metaTitle.length > 60 ? '#ef4444' : '#9ca3af', marginTop: 4 }}>{metaTitle.length}/60 characters</div>
            </FormRow>
            <FormRow label="Meta Description" hint="150–160 characters recommended">
              <textarea className="rm-input" rows={3} value={metaDesc} onChange={e => setMetaDesc(e.target.value)} style={{ resize: 'vertical' }} />
              <div style={{ fontSize: 11.5, color: metaDesc.length > 160 ? '#ef4444' : '#9ca3af', marginTop: 4 }}>{metaDesc.length}/160 characters</div>
            </FormRow>
            <FormRow label="Meta Keywords" hint="Comma-separated keywords">
              <input className="rm-input" value={metaKeywords} onChange={e => setMetaKeywords(e.target.value)} placeholder="keyword1, keyword2, keyword3" />
            </FormRow>
            <FormRow label="OG Image" hint="Open Graph image URL (1200×630px)" last>
              <div className="d-flex gap-2 align-items-start">
                <input className="rm-input" value={ogImage} onChange={e => setOgImage(e.target.value)} placeholder="https://atline.com.my/og-image.jpg" />
                <label className="rm-btn-outline" style={{ cursor: ogUploading ? 'wait' : 'pointer', whiteSpace: 'nowrap', fontSize: 12.5, opacity: ogUploading ? 0.6 : 1 }}>
                  {ogUploading ? <><span className="spinner-border spinner-border-sm me-1"></span> Uploading…</> : <><i className="bi bi-upload"></i> Upload</>}
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }} disabled={ogUploading} onChange={handleOgUpload} />
                </label>
              </div>
              {ogImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={ogImage} alt="OG preview" style={{ marginTop: 10, maxHeight: 90, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              )}
            </FormRow>
          </div>

          {/* Analytics */}
          <div className="int-card">
            <div className="int-card-title"><i className="bi bi-graph-up-arrow"></i> Analytics & Tracking</div>
            <FormRow label="Google Analytics 4" hint="Measurement ID (G-XXXXXXXXXX)">
              <input className="rm-input" style={{ maxWidth: 220 }} value={gaId} onChange={e => setGaId(e.target.value)} placeholder="G-XXXXXXXXXX" />
            </FormRow>
            <FormRow label="Google Tag Manager" hint="Container ID (GTM-XXXXXXX)">
              <input className="rm-input" style={{ maxWidth: 220 }} value={gtmId} onChange={e => setGtmId(e.target.value)} placeholder="GTM-XXXXXXX" />
            </FormRow>
            <FormRow label="Google Search Console" hint="Verification meta tag content" last>
              <input className="rm-input" value={gscCode} onChange={e => setGscCode(e.target.value)} placeholder="Verification code from GSC" />
            </FormRow>
          </div>

          {/* Robots.txt */}
          <div className="int-card">
            <div className="int-card-title"><i className="bi bi-robot"></i> Robots.txt</div>
            <FormRow label="robots.txt content" hint="Controls search engine crawling behaviour" last>
              <textarea className="rm-input" rows={6} value={robotsTxt} onChange={e => setRobotsTxt(e.target.value)} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
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
      </ConfigLayout>
    </>
  );
}
