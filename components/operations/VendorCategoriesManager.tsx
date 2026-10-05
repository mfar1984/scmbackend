'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../../lib/usePermissions';

type Cat = { id: number; name: string; short_label: string | null; icon: string; description: string | null; sort_order: number; status: string; vendor_count: number };

const EMPTY = { name: '', short_label: '', icon: 'bi-clipboard-check', description: '', sort_order: 0, status: 'Active' };
const COMMON_ICONS = ['bi-clipboard-check', 'bi-soundwave', 'bi-water', 'bi-broadcast-pin', 'bi-record-circle', 'bi-fire', 'bi-life-preserver', 'bi-lifebuoy', 'bi-droplet-half', 'bi-tools', 'bi-shield-check', 'bi-gear'];

export default function VendorCategoriesManager({ permKey = 'ops.procurement' }: { permKey?: string }) {
  const { can } = usePermissions();
  const canCreate = can(permKey, 'Create');
  const canUpdate = can(permKey, 'Update');
  const canDelete = can(permKey, 'Delete');

  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; cat?: Cat } | null>(null);
  const [del, setDel] = useState<Cat | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/operations/vendor-categories')).json(); if (j.success) setItems(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const doDelete = async () => {
    if (!del) return;
    const j = await (await fetch(`/api/operations/vendor-categories/${del.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDel(null); fetchItems(); } else alert(j.message || 'Delete failed.');
  };

  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
      <div className="card-body" style={{ padding: 24 }}>
        <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
          <div>
            <h1 className="page-title">Service Categories</h1>
            <p className="page-subtitle">Manage the vendor service categories shown on the website directory and registration form.</p>
          </div>
          {canCreate && <button className="rm-btn-primary" onClick={() => setModal({ mode: 'create' })}><i className="bi bi-plus-lg"></i> Add Category</button>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
        ) : (
          <div className="rm-table-wrap">
            <table className="rm-table" style={{ minWidth: 820 }}>
              <thead><tr>
                <th className="rm-th-perm" style={{ width: 40 }}>#</th>
                <th className="rm-th-module">Category</th>
                <th className="rm-th-perm">Icon</th>
                <th className="rm-th-module">Description</th>
                <th className="rm-th-perm">Vendors</th>
                <th className="rm-th-perm">Status</th>
                <th className="rm-th-perm">Actions</th>
              </tr></thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>No categories yet.</td></tr>
                ) : items.map((c, i) => (
                  <tr key={c.id} className="rm-data-row">
                    <td className="rm-td-perm" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                    <td className="rm-td-module" style={{ color: '#1f2937' }}>{c.name}{c.short_label && c.short_label !== c.name ? <div style={{ fontSize: 11.5, color: '#9ca3af' }}>Label: {c.short_label}</div> : null}</td>
                    <td className="rm-td-perm" style={{ textAlign: 'center' }}><i className={`bi ${c.icon}`} style={{ fontSize: 18, color: '#0052cc' }}></i></td>
                    <td className="rm-td-module" style={{ fontSize: 12.5, color: '#6b7280', maxWidth: 320 }}>{c.description || '—'}</td>
                    <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 13 }}>{c.vendor_count}</td>
                    <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${c.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{c.status}</span></td>
                    <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                      {canUpdate && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => setModal({ mode: 'edit', cat: c })}><i className="bi bi-pencil-fill"></i></button>}
                      {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDel(c)}><i className="bi bi-trash-fill"></i></button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>{items.length} categor{items.length !== 1 ? 'ies' : 'y'}</div>
      </div>

      {modal && <CategoryModal mode={modal.mode} cat={modal.cat} icons={COMMON_ICONS} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchItems(); }} />}

      {del && (
        <div className="rm-modal-overlay">
          <div className="rm-modal">
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Category?</h3>
            <p>This removes <strong>{del.name}</strong>. {del.vendor_count > 0 ? <span style={{ color: '#b45309' }}>It is used by {del.vendor_count} vendor(s) — reassign or set Inactive instead.</span> : 'This action cannot be undone.'}</p>
            <div className="rm-modal-actions">
              <button className="rm-btn-outline" onClick={() => setDel(null)}>Cancel</button>
              <button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryModal({ mode, cat, icons, onClose, onSaved }: { mode: 'create' | 'edit'; cat?: Cat; icons: string[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>(cat ? { name: cat.name, short_label: cat.short_label || '', icon: cat.icon, description: cat.description || '', sort_order: cat.sort_order, status: cat.status } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.name?.trim()) { setError('Category name is required.'); return; }
    setSaving(true); setError('');
    try {
      const url = mode === 'create' ? '/api/operations/vendor-categories' : `/api/operations/vendor-categories/${cat!.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const j = await (await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })).json();
      if (!j.success) { setError(j.message || 'Failed to save.'); setSaving(false); return; }
      onSaved();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 640 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-tags-fill" style={{ marginRight: 8 }}></i>{mode === 'create' ? 'Add Category' : 'Edit Category'}</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          <div className="int-card">
            <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
              <div style={{ flex: '1 1 100%' }}>
                <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Category Name <span style={{ color: '#ef4444' }}>*</span> <span style={{ fontSize: 11.5, color: '#9ca3af' }}>(canonical — must match vendor records)</span></label>
                <input className="rm-input" value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. In-Water Survey" />
              </div>
            </div>
            <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
              <div style={{ flex: '1 1 260px' }}>
                <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Short Label <span style={{ fontSize: 11.5, color: '#9ca3af' }}>(shown on website)</span></label>
                <input className="rm-input" value={f.short_label} onChange={e => set('short_label', e.target.value)} placeholder="e.g. In-Water Survey" />
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Icon</label>
                <select className="rm-input" value={f.icon} onChange={e => set('icon', e.target.value)}>{icons.map(ic => <option key={ic} value={ic}>{ic}</option>)}</select>
              </div>
              <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                <i className={`bi ${f.icon}`} style={{ fontSize: 24, color: '#0052cc' }}></i>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
              <div style={{ flex: '1 1 100%' }}>
                <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Description</label>
                <textarea className="rm-input" rows={2} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Short scope description shown in the vendor detail view." />
              </div>
            </div>
            <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
              <div style={{ flex: '1 1 120px' }}>
                <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Sort Order</label>
                <input type="number" className="rm-input" value={f.sort_order} onChange={e => set('sort_order', e.target.value)} />
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Status</label>
                <select className="rm-input" value={f.status} onChange={e => set('status', e.target.value)}><option>Active</option><option>Inactive</option></select>
              </div>
            </div>
          </div>
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-check-circle-fill"></i> {mode === 'create' ? 'Add Category' : 'Save Changes'}</>}</button>
        </div>
      </div>
    </div>
  );
}
