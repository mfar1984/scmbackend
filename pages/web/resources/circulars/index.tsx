'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../../components/AdminLayout';
import PermissionGate from '../../../../components/PermissionGate';
import { usePermissions } from '../../../../lib/usePermissions';
import { useDateFormat } from '../../../../lib/useDateFormat';

const PERM = 'web.resources.circulars';

type Circular = {
  id: number; no: string; title: string; year: number; release_date: string | null; effective_date: string | null;
  file_name: string | null; status: string; sort_order: number; has_file: number | boolean;
};

export default function CircularsPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can(PERM, 'Create');
  const canUpdate = can(PERM, 'Update');
  const canDelete = can(PERM, 'Delete');

  const [items, setItems] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; id?: number } | null>(null);
  const [del, setDel] = useState<Circular | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/web/circulars')).json(); if (j.success) setItems(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const years = Array.from(new Set(items.map(i => i.year))).sort((a, b) => b - a);
  const q = search.toLowerCase();
  const filtered = items.filter(c => {
    const matchSearch = [c.no, c.title].some(x => String(x ?? '').toLowerCase().includes(q));
    const matchYear = yearFilter === 'All' || String(c.year) === yearFilter;
    return matchSearch && matchYear;
  });

  const doDelete = async () => {
    if (!del) return;
    const j = await (await fetch(`/api/web/circulars/${del.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDel(null); fetchItems(); } else alert(j.message || 'Delete failed.');
  };

  return (
    <>
      <Head><title>Circulars — Web Content | SCM Admin</title></Head>
      <AdminLayout breadcrumb={['Web Tools', 'Resources', 'Circulars']}>
        <PermissionGate moduleKey={PERM}>
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-body" style={{ padding: 24 }}>
              <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
                <div>
                  <h1 className="page-title">Circulars</h1>
                  <p className="page-subtitle">Official SCM circulars shown under Resources &rarr; Technical Information on the website. Upload the PDF for each circular.</p>
                </div>
                {canCreate && <button className="rm-btn-primary" onClick={() => setModal({ mode: 'create' })}><i className="bi bi-plus-lg"></i> Add Circular</button>}
              </div>

              <div className="d-flex gap-2 mb-3 flex-wrap">
                <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                  <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search number or title…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="rm-input" style={{ width: 150 }} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                  <option value="All">All Years</option>
                  {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
              ) : (
                <div className="rm-table-wrap">
                  <table className="rm-table" style={{ minWidth: 820 }}>
                    <thead><tr>
                      <th className="rm-th-perm" style={{ width: 90 }}>No.</th>
                      <th className="rm-th-module">Title</th>
                      <th className="rm-th-perm" style={{ width: 70 }}>Year</th>
                      <th className="rm-th-perm">Release Date</th>
                      <th className="rm-th-perm">Effective Date</th>
                      <th className="rm-th-perm">PDF</th>
                      <th className="rm-th-perm">Status</th>
                      <th className="rm-th-perm">Actions</th>
                    </tr></thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-file-earmark-text" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No circulars yet.</td></tr>
                      ) : filtered.map(c => (
                        <tr key={c.id} className="rm-data-row">
                          <td className="rm-td-perm" style={{ fontWeight: 600, color: '#0052cc' }}>No. {c.no}</td>
                          <td className="rm-td-module" style={{ color: '#1f2937' }}>{c.title}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 13 }}>{c.year}</td>
                          <td className="rm-td-perm" style={{ fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>{c.release_date ? fmt(c.release_date) : '—'}</td>
                          <td className="rm-td-perm" style={{ fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>{c.effective_date ? fmt(c.effective_date) : '—'}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}>
                            {c.has_file
                              ? <a className="rm-action-btn rm-action-view" title="View PDF" href={`/api/web/circulars/${c.id}?file=1`} target="_blank" rel="noreferrer"><i className="bi bi-file-earmark-pdf"></i></a>
                              : <span title="No file" style={{ color: '#d1d5db', fontSize: 16 }}><i className="bi bi-dash-circle"></i></span>}
                          </td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${c.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{c.status}</span></td>
                          <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                            {canUpdate && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => setModal({ mode: 'edit', id: c.id })}><i className="bi bi-pencil-fill"></i></button>}
                            {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDel(c)}><i className="bi bi-trash-fill"></i></button>}
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>{filtered.length} circular{filtered.length !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {modal && <CircularModal mode={modal.mode} id={modal.id} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchItems(); }} />}

          {del && (
            <div className="rm-modal-overlay">
              <div className="rm-modal">
                <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
                <h3>Delete Circular?</h3>
                <p>This permanently removes <strong>No. {del.no} — {del.title}</strong> and its PDF.</p>
                <div className="rm-modal-actions">
                  <button className="rm-btn-outline" onClick={() => setDel(null)}>Cancel</button>
                  <button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button>
                </div>
              </div>
            </div>
          )}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}

function CircularModal({ mode, id, onClose, onSaved }: { mode: 'create' | 'edit'; id?: number; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>({ no: '', title: '', release_date: '', effective_date: '', year: '', status: 'Active', sort_order: 0 });
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [hasFile, setHasFile] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    fetch(`/api/web/circulars/${id}`).then(r => r.json()).then(j => {
      if (j.success) {
        const d = j.data;
        setF({ no: d.no || '', title: d.title || '', release_date: d.release_date ? String(d.release_date).slice(0, 10) : '', effective_date: d.effective_date ? String(d.effective_date).slice(0, 10) : '', year: d.year || '', status: d.status || 'Active', sort_order: d.sort_order || 0 });
        setHasFile(!!d.has_file);
      }
    }).finally(() => setLoading(false));
  }, [mode, id]);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files?.[0] || null;
    setFile(fl); setFileName(fl?.name || '');
  };
  const onReleaseDate = (v: string) => {
    set('release_date', v);
    if (v && !f.year) set('year', String(new Date(v).getFullYear()));
  };

  const save = async () => {
    if (!f.no?.trim()) { setError('Circular number is required.'); return; }
    if (!f.title?.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('no', f.no); fd.append('title', f.title);
      fd.append('release_date', f.release_date || '');
      fd.append('effective_date', f.effective_date || '');
      fd.append('year', String(f.year || (f.release_date ? new Date(f.release_date).getFullYear() : new Date().getFullYear())));
      fd.append('status', f.status); fd.append('sort_order', String(f.sort_order || 0));
      if (file) fd.append('file', file);
      const url = mode === 'create' ? '/api/web/circulars' : `/api/web/circulars/${id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const j = await (await fetch(url, { method, body: fd })).json();
      if (!j.success) { setError(j.message || 'Failed to save.'); setSaving(false); return; }
      onSaved();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 640 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-file-earmark-text-fill" style={{ marginRight: 8 }}></i>{mode === 'create' ? 'Add Circular' : 'Edit Circular'}</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : (
            <div className="int-card">
              <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                <div style={{ flex: '1 1 160px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Circular No. <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="rm-input" value={f.no} onChange={e => set('no', e.target.value)} placeholder="e.g. 3/99" />
                </div>
                <div style={{ flex: '0 1 110px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Year <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="number" className="rm-input" value={f.year} onChange={e => set('year', e.target.value)} placeholder="1999" />
                </div>
              </div>
              <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Release Date</label>
                  <input type="date" className="rm-input" value={f.release_date} onChange={e => onReleaseDate(e.target.value)} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Effective Date</label>
                  <input type="date" className="rm-input" value={f.effective_date} onChange={e => set('effective_date', e.target.value)} />
                </div>
              </div>
              <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                <div style={{ flex: '1 1 100%' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Title <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="rm-input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="Circular title" />
                </div>
              </div>
              <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                <div style={{ flex: '1 1 100%' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>PDF Document</label>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <label className="srm-file-btn" style={{ flex: '2 1 240px', justifyContent: 'flex-start' }}><i className="bi bi-paperclip"></i><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName || 'Choose PDF file'}</span><input type="file" accept=".pdf" onChange={pickFile} /></label>
                    {mode === 'edit' && hasFile && !file && <a className="rm-btn-outline" href={`/api/web/circulars/${id}?file=1`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><i className="bi bi-file-earmark-pdf"></i> Current</a>}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>{mode === 'edit' ? 'Leave empty to keep the current file.' : 'PDF only.'}</div>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                <div style={{ flex: '1 1 140px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Status</label>
                  <select className="rm-input" value={f.status} onChange={e => set('status', e.target.value)}><option>Active</option><option>Hidden</option></select>
                </div>
                <div style={{ flex: '1 1 120px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Sort Order</label>
                  <input type="number" className="rm-input" value={f.sort_order} onChange={e => set('sort_order', e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-check-circle-fill"></i> {mode === 'create' ? 'Add Circular' : 'Save Changes'}</>}</button>
        </div>
      </div>
    </div>
  );
}
