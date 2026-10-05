'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import PermissionGate from '@/components/PermissionGate';
import { usePermissions } from '@/lib/usePermissions';

const FALLBACK_CATEGORIES = ['Company News', 'Maritime Safety', 'Industry Updates', 'Events'];

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function computeReadTimeClient(intro: string, sections: { body: string }[]): string {
  let text = intro || '';
  for (const s of sections) text += ' ' + (s.body || '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

type NewsRow = {
  id: number; slug: string; category: string; title: string; author: string;
  article_date: string | null; read_time: string; image: string; status: string;
  is_featured: number | boolean; sort_order: number;
};

export default function WebNewsPage() {
  return (
    <>
      <Head><title>News — Web Content | SCM Admin</title></Head>
      <AdminLayout breadcrumb={['Web Tools', 'News']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">News</h1>
              <p className="page-subtitle">Create and manage news articles &amp; updates shown on the public website.</p>
            </div>
            <PermissionGate moduleKey="web.news">
              <NewsTable />
            </PermissionGate>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}

function NewsTable() {
  const { can } = usePermissions();
  const canCreate = can('web.news', 'Create');
  const canUpdate = can('web.news', 'Update');
  const canDelete = can('web.news', 'Delete');

  const [items, setItems] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'All' | 'Published' | 'Draft' | 'Category'>('All');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; id?: number } | null>(null);
  const [del, setDel] = useState<NewsRow | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/web/news')).json(); if (j.success) setItems(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const q = search.toLowerCase();
  const filtered = items.filter(it =>
    (tab === 'All' || it.status === tab) &&
    [it.title, it.category, it.author].some(v => String(v ?? '').toLowerCase().includes(q))
  );

  const counts = {
    All: items.length,
    Published: items.filter(i => i.status === 'Published').length,
    Draft: items.filter(i => i.status === 'Draft').length,
  };

  const doDelete = async () => {
    if (!del) return;
    const j = await (await fetch(`/api/web/news/${del.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDel(null); fetchItems(); } else alert(j.message || 'Delete failed.');
  };

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <div className="int-tabs mb-4">
        {(['All', 'Published', 'Draft'] as const).map(t => (
          <button key={t} className={`int-tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t} <span style={{ opacity: .6 }}>({counts[t]})</span>
          </button>
        ))}
        <button className={`int-tab-btn${tab === 'Category' ? ' active' : ''}`} onClick={() => setTab('Category')} style={{ marginLeft: 'auto' }}>
          <i className="bi bi-tags me-1"></i>Category
        </button>
      </div>

      {tab === 'Category' ? <NewsCategories canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} /> : (<>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
          <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search articles…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {canCreate && <button className="rm-btn-primary" onClick={() => setModal({ mode: 'create' })}><i className="bi bi-plus-lg"></i> Add Article</button>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
      ) : (
        <div className="rm-table-wrap">
          <table className="rm-table" style={{ minWidth: 880 }}>
            <thead><tr>
              <th className="rm-th-module">Article</th>
              <th className="rm-th-perm">Category</th>
              <th className="rm-th-perm">Author</th>
              <th className="rm-th-perm">Date</th>
              <th className="rm-th-perm">Status</th>
              <th className="rm-th-perm">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-newspaper" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No articles yet. Add one to show it on the website.</td></tr>
              ) : filtered.map(it => (
                <tr key={it.id} className="rm-data-row">
                  <td className="rm-td-module" style={{ color: '#1f2937' }}>
                    {it.is_featured ? <i className="bi bi-star-fill me-2" style={{ color: '#f5a623' }}></i> : <i className="bi bi-newspaper me-2" style={{ color: '#3b82f6' }}></i>}
                    {it.title}
                  </td>
                  <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className="usr-role-badge">{it.category || '—'}</span></td>
                  <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>{it.author || '—'}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>{fmt(it.article_date)}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${it.status === 'Published' ? 'badge-approved' : 'badge-rejected'}`}>{it.status}</span></td>
                  <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                    {canUpdate && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => setModal({ mode: 'edit', id: it.id })}><i className="bi bi-pencil-fill"></i></button>}
                    {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDel(it)}><i className="bi bi-trash-fill"></i></button>}
                    {!canUpdate && !canDelete && <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>{filtered.length} article{filtered.length !== 1 ? 's' : ''}</div>
      </>)}

      {modal && <NewsModal mode={modal.mode} itemId={modal.id} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchItems(); }} />}
      {del && (
        <div className="rm-modal-overlay">
          <div className="rm-modal">
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Article?</h3>
            <p>This moves <strong>{del.title}</strong> to the recycle bin.</p>
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

function NewsCategories({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/web/news/categories')).json(); if (j.success) setCats(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    setAdding(true); setErr('');
    const j = await (await fetch('/api/web/news/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) })).json();
    setAdding(false);
    if (j.success) { setName(''); load(); } else setErr(j.message || 'Failed to add.');
  };
  const saveEdit = async (id: number) => {
    setErr('');
    const j = await (await fetch(`/api/web/news/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim() }) })).json();
    if (j.success) { setEditId(null); load(); } else setErr(j.message || 'Failed to save.');
  };
  const remove = async (id: number) => {
    if (!confirm('Delete this category? Existing articles keep their current category.')) return;
    const j = await (await fetch(`/api/web/news/categories/${id}`, { method: 'DELETE' })).json();
    if (j.success) load(); else alert(j.message || 'Failed to delete.');
  };
  const toggleStatus = async (c: any) => {
    const j = await (await fetch(`/api/web/news/categories/${c.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: c.status === 'Active' ? 'Inactive' : 'Active' }) })).json();
    if (j.success) load(); else alert(j.message || 'Failed to update.');
  };
  const fmt = (d: any) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div>
      {err && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{err}</div>}
      {canCreate && (
        <div className="d-flex gap-2 mb-3" style={{ maxWidth: 480 }}>
          <input className="rm-input" placeholder="New category name…" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} />
          <button className="rm-btn-primary" onClick={add} disabled={adding}><i className="bi bi-plus-lg"></i> Add</button>
        </div>
      )}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
      ) : (
        <div className="rm-table-wrap">
          <table className="rm-table" style={{ minWidth: 760 }}>
            <thead><tr>
              <th className="rm-th-module">Category</th>
              <th className="rm-th-perm">Date Created</th>
              <th className="rm-th-perm">Date Updated</th>
              <th className="rm-th-perm">Status</th>
              <th className="rm-th-perm">Actions</th>
            </tr></thead>
            <tbody>
              {cats.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-tags" style={{ fontSize: 26, display: 'block', marginBottom: 8 }}></i>No categories yet. Add one above.</td></tr>
              ) : cats.map(c => (
                <tr key={c.id} className="rm-data-row">
                  <td className="rm-td-module" style={{ color: '#1f2937' }}>
                    {editId === c.id
                      ? <input className="rm-input" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); }} style={{ maxWidth: 320 }} />
                      : <><i className="bi bi-tag-fill me-2" style={{ color: '#3b82f6' }}></i>{c.name}</>}
                  </td>
                  <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>{fmt(c.created_at)}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>{fmt(c.updated_at)}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center' }}>
                    <button
                      className={`badge-status ${c.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}
                      style={{ border: 'none', cursor: canUpdate ? 'pointer' : 'default' }}
                      onClick={() => canUpdate && toggleStatus(c)}
                      title={canUpdate ? 'Click to toggle' : ''}
                    >{c.status}</button>
                  </td>
                  <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                    {editId === c.id ? (<>
                      <button className="rm-action-btn rm-action-edit" title="Save" onClick={() => saveEdit(c.id)}><i className="bi bi-check-lg"></i></button>
                      <button className="rm-action-btn rm-action-delete" title="Cancel" onClick={() => setEditId(null)}><i className="bi bi-x-lg"></i></button>
                    </>) : (<>
                      {canUpdate && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => { setEditId(c.id); setEditName(c.name); }}><i className="bi bi-pencil-fill"></i></button>}
                      {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => remove(c.id)}><i className="bi bi-trash-fill"></i></button>}
                      {!canUpdate && !canDelete && <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>}
                    </>)}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>These categories appear in the article Category dropdown. Inactive categories are hidden from the dropdown.</div>
    </div>
  );
}

type SectionForm = { heading: string; body: string };

function NewsModal({ mode, itemId, onClose, onSaved }: { mode: 'create' | 'edit'; itemId?: number; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>({
    title: '', slug: '', category: 'Company News', excerpt: '', author: 'SCM Communications',
    article_date: mode === 'create' ? todayISO() : '', read_time: '', image: '', intro: '', tags: '', status: 'Published',
    is_featured: false, sort_order: 0,
  });
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [readTouched, setReadTouched] = useState(false);
  const [sections, setSections] = useState<SectionForm[]>([{ heading: 'Overview', body: '' }]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [heroBusy, setHeroBusy] = useState(false);
  const [galBusy, setGalBusy] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !itemId) return;
    fetch(`/api/web/news/${itemId}`).then(r => r.json()).then(j => {
      if (j.success) {
        const d = j.data;
        setF({
          title: d.title || '', slug: d.slug || '', category: d.category || 'Company News',
          excerpt: d.excerpt || '', author: d.author || '',
          article_date: d.article_date ? String(d.article_date).slice(0, 10) : '',
          read_time: d.read_time || '', image: d.image || '', intro: d.intro || '',
          tags: d.tags || '', status: d.status || 'Published', is_featured: !!d.is_featured, sort_order: d.sort_order || 0,
        });
        const secs: SectionForm[] = Array.isArray(d.sections) && d.sections.length
          ? d.sections.map((s: any) => ({ heading: s.heading || '', body: Array.isArray(s.body) ? s.body.join('\n') : String(s.body || '') }))
          : [{ heading: 'Overview', body: '' }];
        setSections(secs);
        setGallery(Array.isArray(d.gallery) ? d.gallery : []);
        setReadTouched(!!d.read_time);
      }
    }).finally(() => setLoading(false));
  }, [mode, itemId]);

  // Load managed categories for the dropdown.
  useEffect(() => {
    fetch('/api/web/news/categories').then(r => r.json()).then(j => {
      if (j.success && Array.isArray(j.data)) {
        const names = j.data.filter((c: any) => c.status === 'Active').map((c: any) => c.name);
        if (names.length) setCategories(names);
      }
    }).catch(() => { /* keep fallback */ });
  }, []);

  // Auto-calculate read time from content (until the user edits it manually).
  useEffect(() => {
    if (readTouched) return;
    const rt = computeReadTimeClient(f.intro, sections);
    setF((p: any) => (p.read_time === rt ? p : { ...p, read_time: rt }));
  }, [f.intro, sections, readTouched]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const setSec = (i: number, k: keyof SectionForm, v: string) => setSections(prev => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  const addSec = () => setSections(prev => [...prev, { heading: '', body: '' }]);
  const removeSec = (i: number) => setSections(prev => prev.filter((_, idx) => idx !== i));

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData(); fd.append('file', file);
    try {
      const j = await (await fetch('/api/web/news/upload', { method: 'POST', body: fd })).json();
      if (j.success) return j.url as string;
      setError(j.message || 'Upload failed.'); return null;
    } catch { setError('Upload failed.'); return null; }
  };
  const onHeroPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setError(''); setHeroBusy(true);
    const url = await uploadImage(file); if (url) set('image', url);
    setHeroBusy(false); e.target.value = '';
  };
  const onGalleryPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setError(''); setGalBusy(true);
    for (const file of files) { const url = await uploadImage(file); if (url) setGallery(p => [...p, url]); }
    setGalBusy(false); e.target.value = '';
  };
  const removeGallery = (i: number) => setGallery(p => p.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!f.title?.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...f,
        is_featured: !!f.is_featured,
        sections: sections
          .map(s => ({ heading: s.heading.trim(), body: s.body.split('\n').map(x => x.trim()).filter(Boolean) }))
          .filter(s => s.heading || s.body.length),
        gallery,
      };
      const url = mode === 'create' ? '/api/web/news' : `/api/web/news/${itemId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const j = await (await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
      if (!j.success) { setError(j.message || 'Failed to save.'); setSaving(false); return; }
      onSaved();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 960, width: '96vw' }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-newspaper" style={{ marginRight: 8 }}></i>{mode === 'create' ? 'Add Article' : 'Edit Article'}</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : (
            <>
              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-card-text"></i> Details</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Title <span style={{ color: '#ef4444' }}>*</span></label><input className="rm-input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="Article title" /></div>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Category</label><select className="rm-input" value={f.category} onChange={e => set('category', e.target.value)}>{categories.map(c => <option key={c} value={c}>{c}</option>)}{f.category && !categories.includes(f.category) && <option value={f.category}>{f.category}</option>}</select></div>
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Author</label><input className="rm-input" value={f.author} onChange={e => set('author', e.target.value)} placeholder="e.g. SCM Communications" /></div>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 160px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Date</label><input type="date" className="rm-input" value={f.article_date} onChange={e => set('article_date', e.target.value)} /></div>
                  <div style={{ flex: '1 1 140px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Read Time <span style={{ color: '#9ca3af', fontWeight: 400 }}>(auto)</span></label><input className="rm-input" value={f.read_time} onChange={e => { setReadTouched(true); set('read_time', e.target.value); }} placeholder="auto-calculated" /></div>
                  <div style={{ flex: '1 1 140px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Slug</label><input className="rm-input" value={f.slug} onChange={e => set('slug', e.target.value)} placeholder="auto from title" /></div>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Excerpt</label><textarea className="rm-input" rows={2} value={f.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="Short summary shown in the news list" /></div>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-image"></i> Hero Image &amp; Intro</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}>
                    <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Hero Image</label>
                    <div className="d-flex gap-3 align-items-center flex-wrap">
                      <div style={{ width: 120, height: 78, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {f.image ? <img src={f.image} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} /> : <i className="bi bi-image" style={{ color: '#cbd5e1', fontSize: 24 }}></i>}
                      </div>
                      <div className="d-flex flex-column gap-2">
                        <label className="srm-file-btn" style={{ justifyContent: 'flex-start' }}><i className="bi bi-upload"></i><span>{heroBusy ? 'Uploading…' : (f.image ? 'Replace image' : 'Upload image')}</span><input type="file" accept="image/*" disabled={heroBusy} onChange={onHeroPick} /></label>
                        {f.image && <button type="button" className="rm-btn-outline" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => set('image', '')}><i className="bi bi-x-lg"></i> Remove</button>}
                      </div>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 6 }}>PNG, JPG, WEBP, GIF or SVG.</div>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Intro (blockquote)</label><textarea className="rm-input" rows={2} value={f.intro} onChange={e => set('intro', e.target.value)} placeholder="Short intro paragraph" /></div>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-body-text"></i> Content Sections</div>
                {sections.map((s, i) => (
                  <div key={i} style={{ border: '1px solid #eef2f7', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                    <div className="d-flex gap-2 align-items-center mb-2">
                      <input className="rm-input" value={s.heading} onChange={e => setSec(i, 'heading', e.target.value)} placeholder="Section heading (e.g. Overview)" />
                      <button className="rm-action-btn rm-action-delete" title="Remove section" onClick={() => removeSec(i)}><i className="bi bi-trash-fill"></i></button>
                    </div>
                    <textarea className="rm-input" rows={4} value={s.body} onChange={e => setSec(i, 'body', e.target.value)} placeholder="One paragraph per line" />
                  </div>
                ))}
                <button className="rm-btn-outline" style={{ padding: '6px 14px', fontSize: 12.5 }} onClick={addSec}><i className="bi bi-plus-lg"></i> Add Section</button>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-images"></i> Gallery &amp; Tags</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}>
                    <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Gallery Images</label>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {gallery.map((url, i) => (
                        <div key={i} style={{ position: 'relative', width: 88, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f8fafc' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removeGallery(i)} title="Remove" style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}><i className="bi bi-x-lg"></i></button>
                        </div>
                      ))}
                      <label className="srm-file-btn" style={{ width: 88, height: 64, justifyContent: 'center', flexDirection: 'column', gap: 4, textAlign: 'center' }}><i className="bi bi-plus-lg"></i><span style={{ fontSize: 11 }}>{galBusy ? 'Uploading…' : 'Add'}</span><input type="file" accept="image/*" multiple disabled={galBusy} onChange={onGalleryPick} /></label>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af' }}>Upload one or more images. Click × to remove.</div>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Tags</label><input className="rm-input" value={f.tags} onChange={e => set('tags', e.target.value)} placeholder="Comma separated, e.g. ISO 9001, Quality" /></div>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-toggles"></i> Publishing</div>
                <div className="d-flex flex-wrap gap-3 align-items-end" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '0 0 180px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Status</label><select className="rm-input" value={f.status} onChange={e => set('status', e.target.value)}><option>Published</option><option>Draft</option></select></div>
                  <div style={{ flex: '0 0 180px' }}><label className="rm-label" style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', marginTop: 4 }}><input type="checkbox" checked={f.is_featured} onChange={e => set('is_featured', e.target.checked)} /> Featured (pin to top)</label></div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-check-circle-fill"></i> {mode === 'create' ? 'Add Article' : 'Save Changes'}</>}</button>
        </div>
      </div>
    </div>
  );
}
