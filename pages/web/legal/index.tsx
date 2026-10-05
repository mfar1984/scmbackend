'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import { useDateFormat } from '../../../lib/useDateFormat';

const LEGAL_TABS = [
  { key: 'privacy-policy', label: 'Privacy Policy', icon: 'bi-shield-lock-fill', permKey: 'web.legal.privacy' },
  { key: 'terms-of-service', label: 'Terms of Service', icon: 'bi-file-earmark-check-fill', permKey: 'web.legal.terms' },
  { key: 'disclaimer', label: 'Disclaimer', icon: 'bi-exclamation-circle-fill', permKey: 'web.legal.disclaimer' },
] as const;

type TabKey = typeof LEGAL_TABS[number]['key'] | 'sitemap';

const VALID: TabKey[] = ['privacy-policy', 'terms-of-service', 'disclaimer', 'sitemap'];
const FREQS = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

const TAB_PERM: Record<string, string> = {
  'privacy-policy': 'web.legal.privacy',
  'terms-of-service': 'web.legal.terms',
  'disclaimer': 'web.legal.disclaimer',
  'sitemap': 'web.legal.sitemap',
};

export default function WebLegalPage() {
  const { fmt } = useDateFormat();
  const { canRead } = usePermissions();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('privacy-policy');

  // Sync tab from ?tab= query param (set by sidebar links)
  useEffect(() => {
    const q = router.query.tab as string | undefined;
    if (q && VALID.includes(q as TabKey)) setTab(q as TabKey);
  }, [router.query.tab]);

  return (
    <>
      <Head><title>Legal Pages — ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Web Tools', 'Legal']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Legal Pages</h1>
              <p className="page-subtitle">Manage the website&apos;s legal content and sitemap. Changes are exposed to the public website via API.</p>
            </div>

            <div className="int-tabs mb-4">
              {LEGAL_TABS.filter(t => canRead(t.permKey)).map(t => (
                <button key={t.key} className={`int-tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
                  <i className={`bi ${t.icon} me-1`}></i>{t.label}
                </button>
              ))}
              {canRead('web.legal.sitemap') && (
                <button className={`int-tab-btn${tab === 'sitemap' ? ' active' : ''}`} onClick={() => setTab('sitemap')}>
                  <i className="bi bi-diagram-3-fill me-1"></i>Sitemap
                </button>
              )}
            </div>

            <PermissionGate moduleKey={TAB_PERM[tab]}>
              {tab === 'sitemap'
                ? <SitemapTab fmt={fmt} />
                : <LegalTab key={tab} slug={tab} fmt={fmt} />}
            </PermissionGate>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}

/* ── Legal content editor ── */
function LegalTab({ slug, fmt }: { slug: string; fmt: (d: any, t?: boolean) => string }) {
  const { can } = usePermissions();
  const canUpdate = can(TAB_PERM[slug] || '', 'Update');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Published');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/web/legal/${slug}`).then(r => r.json()).then(j => {
      if (j.success) { setTitle(j.data.title || ''); setContent(j.data.content || ''); setStatus(j.data.status || 'Published'); setUpdatedAt(j.data.updated_at || null); }
      else setError(j.message || 'Failed to load.');
    }).catch(() => setError('Failed to load.')).finally(() => setLoading(false));
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      const j = await (await fetch(`/api/web/legal/${slug}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, status }) })).json();
      if (j.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); load(); }
      else setError(j.message || 'Failed to save.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>;

  return (
    <>
      {saved && <div className="rm-saved-banner mb-3"><i className="bi bi-check-circle-fill"></i> Saved.</div>}
      {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

      <div className="int-card">
        {!canUpdate && (
          <div className="rd-readonly-note">
            <i className="bi bi-eye-fill"></i>
            You have read-only access to this page. Editing is disabled.
          </div>
        )}
        <div className="d-flex flex-wrap gap-3 align-items-end mb-3" style={{ padding: '0 2px' }}>
          <div style={{ flex: '1 1 320px' }}>
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Page Title</label>
            <input className="rm-input" value={title} onChange={e => setTitle(e.target.value)} disabled={!canUpdate} />
          </div>
          <div style={{ flex: '0 0 180px' }}>
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Status</label>
            <select className="rm-input" value={status} onChange={e => setStatus(e.target.value)} disabled={!canUpdate}>
              <option>Published</option>
              <option>Draft</option>
            </select>
          </div>
          <div style={{ flex: '1 1 auto', textAlign: 'right', fontSize: 12, color: '#9ca3af' }}>
            {updatedAt ? `Last updated: ${fmt(updatedAt, true)}` : ''}
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2" style={{ padding: '0 2px' }}>
          <label className="rm-label">Content (HTML)</label>
          <button className="rm-btn-outline" style={{ padding: '4px 12px', fontSize: 12.5 }} onClick={() => setPreview(p => !p)}>
            <i className={`bi ${preview ? 'bi-pencil' : 'bi-eye'}`}></i> {preview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {preview ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fff', minHeight: 320, maxHeight: 560, overflowY: 'auto' }}
            dangerouslySetInnerHTML={{ __html: content || '<p style="color:#9ca3af">Nothing to preview.</p>' }} />
        ) : (
          <textarea className="rm-input" style={{ minHeight: 380, fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.6 }} value={content} onChange={e => setContent(e.target.value)} placeholder="<h2>Section</h2><p>Your content…</p>" disabled={!canUpdate} />
        )}
        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 6, padding: '0 2px' }}>
          <i className="bi bi-info-circle me-1"></i>Use HTML tags. The public website fetches this via <code>/api/public/legal/{slug}</code>.
        </div>
      </div>

      <div className="int-footer">
        {canUpdate && <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-floppy-fill"></i> Save Page</>}</button>}
      </div>
    </>
  );
}

/* ── Sitemap entries manager ── */
function SitemapTab({ fmt }: { fmt: (d: any, t?: boolean) => string }) {
  const { can } = usePermissions();
  const canCreate = can('web.legal.sitemap', 'Create');
  const canUpdate = can('web.legal.sitemap', 'Update');
  const canDelete = can('web.legal.sitemap', 'Delete');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);
  const [del, setDel] = useState<any | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/web/sitemap').then(r => r.json()).then(j => { if (j.success) setRows(j.data); }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const blank = { loc: '', changefreq: 'monthly', priority: '0.5', enabled: true };
  const [form, setForm] = useState<any>(blank);
  const startAdd = () => { setForm(blank); setAdding(true); setEditing(null); setError(''); };
  const startEdit = (r: any) => { setForm({ loc: r.loc, changefreq: r.changefreq, priority: String(r.priority), enabled: !!r.enabled }); setEditing(r); setAdding(false); setError(''); };

  const submit = async () => {
    if (!form.loc.trim()) { setError('URL path is required.'); return; }
    const url = editing ? `/api/web/sitemap/${editing.id}` : '/api/web/sitemap';
    const method = editing ? 'PUT' : 'POST';
    const j = await (await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })).json();
    if (j.success) { setAdding(false); setEditing(null); load(); } else setError(j.message || 'Failed.');
  };

  const toggleEnabled = async (r: any) => {
    await fetch(`/api/web/sitemap/${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !r.enabled }) });
    load();
  };

  const doDelete = async () => {
    if (!del) return;
    const j = await (await fetch(`/api/web/sitemap/${del.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDel(null); load(); } else alert(j.message || 'Delete failed.');
  };

  return (
    <>
      <div className="int-info-note mb-3">
        <i className="bi bi-info-circle-fill"></i>
        These URLs generate the public <code>sitemap.xml</code> at <code>/api/public/sitemap.xml</code>. Priority 0.0–1.0; higher = more important.
      </div>

      {error && (adding || editing) && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <span style={{ fontSize: 13, color: '#6b7280' }}>{rows.length} URL{rows.length !== 1 ? 's' : ''}</span>
        <div className="d-flex gap-2">
          <a className="rm-btn-outline" href="/api/public/sitemap.xml" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><i className="bi bi-box-arrow-up-right"></i> View sitemap.xml</a>
          {canCreate && <button className="rm-btn-primary" onClick={startAdd}><i className="bi bi-plus-lg"></i> Add URL</button>}
        </div>
      </div>

      {(adding || editing) && (
        <div className="int-card">
          <div className="int-card-title"><i className="bi bi-link-45deg"></i> {editing ? 'Edit URL' : 'Add URL'}</div>
          <div className="d-flex flex-wrap gap-3 align-items-end" style={{ padding: '0 2px' }}>
            <div style={{ flex: '2 1 280px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>URL Path</label>
              <input className="rm-input" value={form.loc} onChange={e => setForm((f: any) => ({ ...f, loc: e.target.value }))} placeholder="/about" />
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Change Frequency</label>
              <select className="rm-input" value={form.changefreq} onChange={e => setForm((f: any) => ({ ...f, changefreq: e.target.value }))}>{FREQS.map(x => <option key={x}>{x}</option>)}</select>
            </div>
            <div style={{ flex: '0 0 120px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Priority</label>
              <input type="number" step="0.1" min="0" max="1" className="rm-input" value={form.priority} onChange={e => setForm((f: any) => ({ ...f, priority: e.target.value }))} />
            </div>
            <label className="d-flex align-items-center gap-2" style={{ fontSize: 13, color: '#374151', paddingBottom: 8 }}>
              <input type="checkbox" checked={form.enabled} onChange={e => setForm((f: any) => ({ ...f, enabled: e.target.checked }))} /> Enabled
            </label>
          </div>
          <div className="d-flex gap-2 mt-3" style={{ padding: '0 2px' }}>
            <button className="rm-btn-primary" onClick={submit}><i className="bi bi-check-lg"></i> {editing ? 'Update' : 'Add'}</button>
            <button className="rm-btn-outline" onClick={() => { setAdding(false); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
      ) : (
        <div className="rm-table-wrap">
          <table className="rm-table" style={{ minWidth: 720 }}>
            <thead><tr>
              <th className="rm-th-module">URL Path</th><th className="rm-th-perm">Change Freq</th>
              <th className="rm-th-perm">Priority</th><th className="rm-th-perm">Enabled</th>
              <th className="rm-th-perm">Updated</th><th className="rm-th-perm">Actions</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>No URLs yet.</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="rm-data-row">
                  <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#374151' }}>{r.loc}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280' }}>{r.changefreq}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 13 }}>{Number(r.priority).toFixed(1)}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center' }}>
                    <button className={`badge-status ${r.enabled ? 'badge-approved' : 'badge-rejected'}`} style={{ border: 'none', cursor: canUpdate ? 'pointer' : 'default' }} onClick={() => canUpdate && toggleEnabled(r)}>{r.enabled ? 'Enabled' : 'Disabled'}</button>
                  </td>
                  <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>{r.updated_at ? fmt(r.updated_at) : '—'}</td>
                  <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                    {canUpdate && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => startEdit(r)}><i className="bi bi-pencil-fill"></i></button>}
                    {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDel(r)}><i className="bi bi-trash-fill"></i></button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {del && (
        <div className="rm-modal-overlay">
          <div className="rm-modal">
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete URL?</h3>
            <p>Remove <strong>{del.loc}</strong> from the sitemap.</p>
            <div className="rm-modal-actions">
              <button className="rm-btn-outline" onClick={() => setDel(null)}>Cancel</button>
              <button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
