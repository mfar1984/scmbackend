'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../../components/AdminLayout';
import PermissionGate from '../../../../components/PermissionGate';
import { usePermissions } from '../../../../lib/usePermissions';
import WebPageEditor from '../../../../components/web/WebPageEditor';
import { useDateFormat } from '../../../../lib/useDateFormat';

const CAT_ICONS = ['bi-ethernet', 'bi-pc-display', 'bi-hdd-rack', 'bi-tools', 'bi-camera-video', 'bi-building-gear', 'bi-shield-check', 'bi-wifi', 'bi-diagram-3'];
const T_STATUS = [
  { v: 'open', label: 'Open' }, { v: 'closing', label: 'Closing Soon' }, { v: 'closed', label: 'Closed' },
];
const statusBadge = (s: string) => s === 'open' ? 'badge-approved' : s === 'closing' ? 'badge-pending' : 'badge-rejected';

export default function TenderAdminPage() {
  const { fmt } = useDateFormat();
  const [tab, setTab] = useState<'content' | 'tenders'>('content');

  return (
    <>
      <Head><title>Tender — Web Content | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Web Tools', 'Business', 'Tender']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Tender</h1>
              <p className="page-subtitle">Manage the public tender page content and the list of active tenders with downloadable documents.</p>
            </div>

            <div className="int-tabs mb-4">
              <button className={`int-tab-btn${tab === 'content' ? ' active' : ''}`} onClick={() => setTab('content')}><i className="bi bi-file-text me-1"></i>Page Content</button>
              <button className={`int-tab-btn${tab === 'tenders' ? ' active' : ''}`} onClick={() => setTab('tenders')}><i className="bi bi-file-earmark-arrow-down me-1"></i>Active Tenders</button>
            </div>

            {tab === 'content' ? <WebPageEditor slug="business/tender" moduleKey="web.business.tender.content" /> : <TendersTable fmt={fmt} />}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}

function TendersTable({ fmt }: { fmt: (d: any, t?: boolean) => string }) {
  const { can } = usePermissions();
  const canCreate = can('web.business.tender.tenders', 'Create');
  const canUpdate = can('web.business.tender.tenders', 'Update');
  const canDelete = can('web.business.tender.tenders', 'Delete');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; id?: number } | null>(null);
  const [logsFor, setLogsFor] = useState<any | null>(null);
  const [del, setDel] = useState<any | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/web/tenders')).json(); if (j.success) setItems(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const q = search.toLowerCase();
  const filtered = items.filter(it => [it.title, it.ref_no, it.category].some(v => String(v ?? '').toLowerCase().includes(q)));

  const doDelete = async () => {
    if (!del) return;
    const j = await (await fetch(`/api/web/tenders/${del.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDel(null); fetchItems(); } else alert(j.message || 'Delete failed.');
  };

  return (
    <>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
          <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search tenders…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {canCreate && <button className="rm-btn-primary" onClick={() => setModal({ mode: 'create' })}><i className="bi bi-plus-lg"></i> Add Tender</button>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
      ) : (
        <div className="rm-table-wrap">
          <table className="rm-table" style={{ minWidth: 1000 }}>
            <thead><tr>
              <th className="rm-th-module">Tender</th><th className="rm-th-perm">Sector</th>
              <th className="rm-th-perm">Deadline</th><th className="rm-th-perm">Doc</th>
              <th className="rm-th-perm">Email Gate</th><th className="rm-th-perm">Downloads</th>
              <th className="rm-th-perm">Tender Status</th><th className="rm-th-perm">Visible</th><th className="rm-th-perm">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-file-earmark-text" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No tenders yet. Add one to show it on the website.</td></tr>
              ) : filtered.map(it => (
                <tr key={it.id} className="rm-data-row">
                  <td className="rm-td-module" style={{ color: '#1f2937' }}>{it.title}{it.ref_no ? <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>{it.ref_no}</div> : null}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280' }}>{it.sector}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280' }}>{it.deadline || '—'}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center' }}>{(it.has_file === 1 || it.has_file === true) ? <i className="bi bi-paperclip" title={it.file_name} style={{ color: '#16a34a' }}></i> : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center' }}>{it.require_email ? <span className="badge-status badge-review"><i className="bi bi-envelope-check me-1"></i>Required</span> : <span style={{ color: '#9ca3af', fontSize: 12.5 }}>Open</span>}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 13 }}>{it.download_count || 0}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${statusBadge(it.tender_status)}`}>{T_STATUS.find(s => s.v === it.tender_status)?.label || it.tender_status}</span></td>
                  <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${it.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{it.status}</span></td>
                  <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                    {(it.has_file === 1 || it.has_file === true) ? <a className="rm-action-btn rm-action-view" title="Download doc" href={`/api/web/tenders/${it.id}?file=1`} target="_blank" rel="noreferrer"><i className="bi bi-download"></i></a> : null}
                    {it.require_email ? <button className="rm-action-btn rm-action-view" title="View leads" onClick={() => setLogsFor(it)}><i className="bi bi-people-fill"></i></button> : null}
                    {canUpdate && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => setModal({ mode: 'edit', id: it.id })}><i className="bi bi-pencil-fill"></i></button>}
                    {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDel(it)}><i className="bi bi-trash-fill"></i></button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>{filtered.length} tender{filtered.length !== 1 ? 's' : ''}</div>

      {modal && <TenderModal mode={modal.mode} tenderId={modal.id} catIcons={CAT_ICONS} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchItems(); }} />}
      {logsFor && <LogsModal item={logsFor} fmt={fmt} onClose={() => setLogsFor(null)} />}
      {del && (
        <div className="rm-modal-overlay">
          <div className="rm-modal">
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Tender?</h3>
            <p>This permanently removes <strong>{del.title}</strong> and its document.</p>
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

function TenderModal({ mode, tenderId, catIcons, onClose, onSaved }: { mode: 'create' | 'edit'; tenderId?: number; catIcons: string[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>({ ref_no: '', title: '', category: 'Network Infrastructure', cat_icon: 'bi-ethernet', sector: 'Government', value: '', issued_date: '', deadline: '', tender_status: 'open', description: '', require_email: false, status: 'Active', sort_order: 0 });
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [hasFile, setHasFile] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [maxMb, setMaxMb] = useState(60);

  useEffect(() => { fetch('/api/config/upload-limit').then(r => r.json()).then(j => { if (j.success && j.maxMb) setMaxMb(j.maxMb); }).catch(() => {}); }, []);

  useEffect(() => {
    if (mode !== 'edit' || !tenderId) return;
    fetch(`/api/web/tenders/${tenderId}`).then(r => r.json()).then(j => {
      if (j.success) {
        const d = j.data;
        setF({ ref_no: d.ref_no || '', title: d.title || '', category: d.category || 'Network Infrastructure', cat_icon: d.cat_icon || 'bi-ethernet', sector: d.sector || 'Government', value: d.value || '', issued_date: d.issued_date || '', deadline: d.deadline || '', tender_status: d.tender_status || 'open', description: d.description || '', require_email: !!d.require_email, status: d.status || 'Active', sort_order: d.sort_order || 0 });
        setFileName(d.file_name || ''); setHasFile(!!d.has_file);
      }
    }).finally(() => setLoading(false));
  }, [mode, tenderId]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files?.[0];
    if (!fl) return;
    if (fl.size > maxMb * 1024 * 1024) { setError(`${fl.name} exceeds the ${maxMb}MB limit`); e.target.value = ''; return; }
    setError(''); setFile(fl); setFileName(fl.name);
  };

  const save = async () => {
    if (!f.title?.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.keys(f).forEach(k => fd.append(k, k === 'require_email' ? (f[k] ? 'true' : 'false') : String(f[k] ?? '')));
      if (file) fd.append('file', file);
      const url = mode === 'create' ? '/api/web/tenders' : `/api/web/tenders/${tenderId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const j = await (await fetch(url, { method, body: fd })).json();
      if (!j.success) { setError(j.message || 'Failed to save.'); setSaving(false); return; }
      onSaved();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 760 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-file-earmark-text-fill" style={{ marginRight: 8 }}></i>{mode === 'create' ? 'Add Tender' : 'Edit Tender'}</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : (
            <>
              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-info-circle-fill"></i> Tender Info</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Title <span style={{ color: '#ef4444' }}>*</span></label><input className="rm-input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Supply & Installation of Network Infrastructure" /></div>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Reference No</label><input className="rm-input" value={f.ref_no} onChange={e => set('ref_no', e.target.value)} placeholder="ATL-T-2026-001" /></div>
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Category</label><input className="rm-input" value={f.category} onChange={e => set('category', e.target.value)} /></div>
                  <div style={{ flex: '1 1 150px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Category Icon</label><select className="rm-input" value={f.cat_icon} onChange={e => set('cat_icon', e.target.value)}>{catIcons.map(ic => <option key={ic} value={ic}>{ic.replace('bi-', '')}</option>)}</select></div>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 150px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Sector</label><select className="rm-input" value={f.sector} onChange={e => set('sector', e.target.value)}><option>Government</option><option>Private</option></select></div>
                  <div style={{ flex: '1 1 220px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Estimated Value</label><input className="rm-input" value={f.value} onChange={e => set('value', e.target.value)} placeholder="RM 350,000 – RM 500,000" /></div>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 160px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Issued Date</label><input className="rm-input" value={f.issued_date} onChange={e => set('issued_date', e.target.value)} placeholder="12 May 2026" /></div>
                  <div style={{ flex: '1 1 160px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Deadline</label><input className="rm-input" value={f.deadline} onChange={e => set('deadline', e.target.value)} placeholder="10 Jun 2026" /></div>
                  <div style={{ flex: '1 1 160px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Tender Status</label><select className="rm-input" value={f.tender_status} onChange={e => set('tender_status', e.target.value)}>{T_STATUS.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}</select></div>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Description</label><textarea className="rm-input" rows={2} value={f.description} onChange={e => set('description', e.target.value)} /></div>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-file-earmark-arrow-up-fill"></i> Tender Document</div>
                <div className="d-flex flex-wrap gap-2 align-items-center mb-2" style={{ padding: '0 2px' }}>
                  <label className="srm-file-btn" style={{ flex: '2 1 240px', justifyContent: 'flex-start' }}><i className="bi bi-paperclip"></i><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName || 'Choose File (PDF / DOC / ZIP)'}</span><input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" onChange={pickFile} /></label>
                  {mode === 'edit' && hasFile && !file && <a className="rm-btn-outline" href={`/api/web/tenders/${tenderId}?file=1`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><i className="bi bi-download"></i> Current</a>}
                </div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', padding: '0 2px' }}>Max {maxMb}MB. {mode === 'edit' ? 'Leave empty to keep the current document.' : 'Optional — a tender can be listed without a document.'}</div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-shield-lock-fill"></i> Access &amp; Visibility</div>
                <label className="d-flex align-items-start gap-2 mb-3" style={{ cursor: 'pointer', padding: '0 2px' }}>
                  <input type="checkbox" checked={f.require_email} onChange={e => set('require_email', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#3b82f6', marginTop: 3 }} />
                  <span style={{ fontSize: 13, color: '#374151' }}>Require email verification before document download
                    <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>Visitor enters email and clicks a verification link before the document unlocks. Captured emails appear under "View leads".</div>
                  </span>
                </label>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '0 0 180px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Visible on Website</label><select className="rm-input" value={f.status} onChange={e => set('status', e.target.value)}><option>Active</option><option>Hidden</option></select></div>
                  <div style={{ flex: '0 0 120px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Order</label><input type="number" className="rm-input" value={f.sort_order} onChange={e => set('sort_order', e.target.value)} /></div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-check-circle-fill"></i> {mode === 'create' ? 'Add Tender' : 'Save Changes'}</>}</button>
        </div>
      </div>
    </div>
  );
}

function LogsModal({ item, fmt, onClose }: { item: any; fmt: (d: any, t?: boolean) => string; onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/web/tenders/${item.id}`).then(r => r.json()).then(j => { if (j.success) setLogs(j.data.logs || []); }).finally(() => setLoading(false));
  }, [item.id]);

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 720 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-people-fill" style={{ marginRight: 8 }}></i>Tender Document Leads</p><p className="usr-modal-sub">{item.title}</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : (
            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr><th className="rm-th-module">Email</th><th className="rm-th-perm">Verified</th><th className="rm-th-perm">Requested</th><th className="rm-th-perm">Downloaded</th></tr></thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 28, color: '#9ca3af', fontSize: 13 }}>No requests yet.</td></tr>
                  ) : logs.map(l => (
                    <tr key={l.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#374151' }}>{l.email}{l.name ? <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{l.name}{l.company ? ` · ${l.company}` : ''}</div> : null}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}>{l.verified ? <span className="badge-status badge-approved">Verified</span> : <span className="badge-status badge-pending">Pending</span>}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>{fmt(l.created_at, true)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>{l.downloaded_at ? fmt(l.downloaded_at, true) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
