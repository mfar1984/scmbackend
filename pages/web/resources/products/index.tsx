'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../../components/AdminLayout';
import PermissionGate from '../../../../components/PermissionGate';
import { usePermissions } from '../../../../lib/usePermissions';
import WebPageEditor from '../../../../components/web/WebPageEditor';

const ICONS = ['bi-hdd-network', 'bi-router', 'bi-shield-check', 'bi-wifi', 'bi-ethernet', 'bi-pc-display', 'bi-hdd-rack', 'bi-diagram-3', 'bi-plug-fill', 'bi-box-seam', 'bi-cpu', 'bi-server'];

export default function WebProductsPage() {
  const [tab, setTab] = useState<'content' | 'items'>('content');

  return (
    <>
      <Head><title>Products — Web Content | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Web Tools', 'Resources', 'Products']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Products</h1>
              <p className="page-subtitle">Manage the public Products page content and the catalog of product categories shown on the website.</p>
            </div>

            <div className="int-tabs mb-4">
              <button className={`int-tab-btn${tab === 'content' ? ' active' : ''}`} onClick={() => setTab('content')}><i className="bi bi-file-text me-1"></i>Page Content</button>
              <button className={`int-tab-btn${tab === 'items' ? ' active' : ''}`} onClick={() => setTab('items')}><i className="bi bi-grid-3x3-gap me-1"></i>Product Table</button>
            </div>

            {tab === 'content'
              ? <PermissionGate moduleKey="web.resources.products.content"><WebPageEditor slug="resources/products" moduleKey="web.resources.products.content" /></PermissionGate>
              : <PermissionGate moduleKey="web.resources.products.items"><ProductsTable icons={ICONS} /></PermissionGate>}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}

function ProductsTable({ icons }: { icons: string[] }) {
  const { can } = usePermissions();
  const canCreate = can('web.resources.products.items', 'Create');
  const canUpdate = can('web.resources.products.items', 'Update');
  const canDelete = can('web.resources.products.items', 'Delete');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; id?: number } | null>(null);
  const [del, setDel] = useState<any | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/web/products')).json(); if (j.success) setItems(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const q = search.toLowerCase();
  const filtered = items.filter(it => [it.title, it.category, it.tag, it.brands].some(v => String(v ?? '').toLowerCase().includes(q)));

  const doDelete = async () => {
    if (!del) return;
    const j = await (await fetch(`/api/web/products/${del.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDel(null); fetchItems(); } else alert(j.message || 'Delete failed.');
  };

  return (
    <>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
          <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {canCreate && <button className="rm-btn-primary" onClick={() => setModal({ mode: 'create' })}><i className="bi bi-plus-lg"></i> Add Product</button>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
      ) : (
        <div className="rm-table-wrap">
          <table className="rm-table" style={{ minWidth: 880 }}>
            <thead><tr>
              <th className="rm-th-module">Product</th><th className="rm-th-perm">Category</th>
              <th className="rm-th-perm">Brands</th><th className="rm-th-perm">Image</th>
              <th className="rm-th-perm">Status</th><th className="rm-th-perm">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-box-seam" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No products yet. Add one to show it on the website.</td></tr>
              ) : filtered.map(it => (
                <tr key={it.id} className="rm-data-row">
                  <td className="rm-td-module" style={{ color: '#1f2937' }}><i className={`bi ${it.icon} me-2`} style={{ color: '#3b82f6' }}></i>{it.title}{it.tag ? <div style={{ fontSize: 11.5, color: '#9ca3af', marginLeft: 24 }}>{it.tag}</div> : null}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className="usr-role-badge">{it.category}</span></td>
                  <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>{it.brands || '—'}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center' }}>{(it.has_image === 1 || it.has_image === true) ? <i className="bi bi-image-fill" style={{ color: '#16a34a' }}></i> : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                  <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${it.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{it.status}</span></td>
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
      <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</div>

      {modal && <ProductModal mode={modal.mode} itemId={modal.id} icons={icons} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchItems(); }} />}
      {del && (
        <div className="rm-modal-overlay">
          <div className="rm-modal">
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Product?</h3>
            <p>This permanently removes <strong>{del.title}</strong> from the catalog.</p>
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

function ProductModal({ mode, itemId, icons, onClose, onSaved }: { mode: 'create' | 'edit'; itemId?: number; icons: string[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>({ title: '', tag: '', category: 'Network', description: '', specs: '', brands: '', icon: 'bi-box-seam', status: 'Active', sort_order: 0 });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [hasImage, setHasImage] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !itemId) return;
    fetch(`/api/web/products/${itemId}`).then(r => r.json()).then(j => {
      if (j.success) {
        const d = j.data;
        setF({ title: d.title || '', tag: d.tag || '', category: d.category || 'General', description: d.description || '', specs: d.specs || '', brands: d.brands || '', icon: d.icon || 'bi-box-seam', status: d.status || 'Active', sort_order: d.sort_order || 0 });
        setHasImage(!!d.has_image);
        if (d.has_image) setPreview(`/api/web/products/${itemId}?image=1&t=${Date.now()}`);
      }
    }).finally(() => setLoading(false));
  }, [mode, itemId]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files?.[0];
    if (!fl) return;
    setError(''); setFile(fl); setPreview(URL.createObjectURL(fl));
  };

  const save = async () => {
    if (!f.title?.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.keys(f).forEach(k => fd.append(k, String(f[k] ?? '')));
      if (file) fd.append('file', file);
      const url = mode === 'create' ? '/api/web/products' : `/api/web/products/${itemId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const j = await (await fetch(url, { method, body: fd })).json();
      if (!j.success) { setError(j.message || 'Failed to save.'); setSaving(false); return; }
      onSaved();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 720 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-box-seam-fill" style={{ marginRight: 8 }}></i>{mode === 'create' ? 'Add Product' : 'Edit Product'}</p></div>
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
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Title <span style={{ color: '#ef4444' }}>*</span></label><input className="rm-input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Network Switches" /></div>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Tag</label><input className="rm-input" value={f.tag} onChange={e => set('tag', e.target.value)} placeholder="e.g. Layer 2 / Layer 3" /></div>
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Category</label><input className="rm-input" value={f.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Network" /></div>
                  <div style={{ flex: '1 1 150px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Icon</label><select className="rm-input" value={f.icon} onChange={e => set('icon', e.target.value)}>{icons.map(ic => <option key={ic} value={ic}>{ic.replace('bi-', '')}</option>)}</select></div>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Description</label><textarea className="rm-input" rows={2} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Short description of this product category" /></div>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-list-check"></i> Specs &amp; Brands</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Key Specifications</label><textarea className="rm-input" rows={4} value={f.specs} onChange={e => set('specs', e.target.value)} placeholder={'One per line, e.g.\nPoE+ & PoE++ Support\nVLAN / QoS / STP'} /><div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>One specification per line.</div></div>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Available Brands</label><input className="rm-input" value={f.brands} onChange={e => set('brands', e.target.value)} placeholder="Comma separated, e.g. Cisco, Aruba, Huawei" /></div>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-image-fill"></i> Image (optional)</div>
                <div className="d-flex gap-3 align-items-center flex-wrap" style={{ padding: '0 2px' }}>
                  <div style={{ width: 96, height: 72, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {preview ? <img src={preview} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <i className="bi bi-image" style={{ color: '#cbd5e1', fontSize: 22 }}></i>}
                  </div>
                  <label className="srm-file-btn" style={{ justifyContent: 'flex-start' }}><i className="bi bi-upload"></i><span>{file ? file.name : (hasImage ? 'Replace image' : 'Choose image')}</span><input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={pickImage} /></label>
                </div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', padding: '6px 2px 0' }}>PNG, JPG, WEBP or SVG. Leave empty to use only the icon.</div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-toggles"></i> Visibility</div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '0 0 180px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Status</label><select className="rm-input" value={f.status} onChange={e => set('status', e.target.value)}><option>Active</option><option>Hidden</option></select></div>
                  <div style={{ flex: '0 0 120px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Order</label><input type="number" className="rm-input" value={f.sort_order} onChange={e => set('sort_order', e.target.value)} /></div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-check-circle-fill"></i> {mode === 'create' ? 'Add Product' : 'Save Changes'}</>}</button>
        </div>
      </div>
    </div>
  );
}
