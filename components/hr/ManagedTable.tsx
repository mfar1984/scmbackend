'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../../lib/usePermissions';

export type Column = { key: string; label: string; width?: number; render?: (row: any) => React.ReactNode };
export type Field = {
  key: string; label: string; type?: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'employee';
  options?: { value: string; label: string }[]; required?: boolean; placeholder?: string; hint?: string;
};

type Props = {
  api: string;                 // endpoint base e.g. /api/hr/leave-types
  title: string;               // e.g. "Leave Type"
  columns: Column[];
  fields: Field[];
  defaults?: Record<string, any>;
  searchKeys?: string[];
  showStatus?: boolean;        // show the Active/Inactive status column + selector (default true)
  moduleKey?: string;          // permission module key — gates Add/Edit/Delete buttons
};

/**
 * Generic master-data CRUD table with create/edit/delete modals.
 * Used across HR settings pages.
 */
export default function ManagedTable({ api, title, columns, fields, defaults = {}, searchKeys = ['name'], showStatus = true, moduleKey }: Props) {
  const { can } = usePermissions();
  const canCreate = moduleKey ? can(moduleKey, 'Create') : true;
  const canUpdate = moduleKey ? can(moduleKey, 'Update') : true;
  const canDelete = moduleKey ? can(moduleKey, 'Delete') : true;
  const [items, setItems] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const needsEmployees = fields.some(f => f.type === 'employee');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(api);
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => {
    fetchItems();
    if (needsEmployees) fetch('/api/hr/employees-list').then(r => r.json()).then(j => { if (j.success) setEmployees(j.data); });
  }, [fetchItems, needsEmployees]);

  const filtered = items.filter(it =>
    searchKeys.some(k => String(it[k] ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    const init: Record<string, any> = { status: 'Active', ...defaults };
    fields.forEach(f => { if (!(f.key in init)) init[f.key] = f.type === 'checkbox' ? false : ''; });
    setForm(init); setError(''); setModal('create');
  };
  const openEdit = (it: any) => {
    const init: Record<string, any> = {};
    fields.forEach(f => { init[f.key] = it[f.key] ?? (f.type === 'checkbox' ? false : ''); });
    init.status = it.status || 'Active';
    setSelected(it); setForm(init); setError(''); setModal('edit');
  };

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const reqField = fields.find(f => f.required && !String(form[f.key] ?? '').trim());
    if (reqField) { setError(`${reqField.label} is required.`); return; }
    setSaving(true); setError('');
    try {
      const url = modal === 'edit' ? `${api}?id=${selected.id}` : api;
      const method = modal === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { setModal(null); fetchItems(); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${api}?id=${selected.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setModal(null); fetchItems(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
          <input className="rm-input" style={{ paddingLeft: 34 }} placeholder={`Search ${title.toLowerCase()}…`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {canCreate && <button className="rm-btn-primary" onClick={openCreate}><i className="bi bi-plus-lg"></i> Add {title}</button>}
      </div>      <div className="rm-table-wrap">
        <table className="rm-table">
          <thead>
            <tr>
              <th className="rm-th-module" style={{ width: 40 }}>#</th>
              {columns.map(c => <th key={c.key} className="rm-th-module" style={c.width ? { width: c.width } : undefined}>{c.label}</th>)}
              {showStatus && <th className="rm-th-perm">Status</th>}
              <th className="rm-th-perm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + (showStatus ? 3 : 2)} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={columns.length + (showStatus ? 3 : 2)} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                <i className="bi bi-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No {title.toLowerCase()} found.
              </td></tr>
            ) : filtered.map((it, i) => (
              <tr key={it.id} className="rm-data-row">
                <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                {columns.map(c => (
                  <td key={c.key} className="rm-td-module" style={{ fontSize: 13, color: '#374151' }}>
                    {c.render ? c.render(it) : (it[c.key] ?? '—')}
                  </td>
                ))}
                {showStatus && (
                  <td className="rm-td-perm">
                    <span className={`badge-status ${it.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{it.status}</span>
                  </td>
                )}
                <td className="rm-td-perm">
                  <div className="d-flex gap-2 justify-content-center">
                    {canUpdate && <button className="rm-action-btn rm-action-edit" onClick={() => openEdit(it)}><i className="bi bi-pencil-fill"></i></button>}
                    {canDelete && <button className="rm-action-btn rm-action-delete" onClick={() => { setSelected(it); setModal('delete'); }}><i className="bi bi-trash-fill"></i></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>{filtered.length} {title.toLowerCase()}{filtered.length !== 1 ? 's' : ''}</div>

      {(modal === 'create' || modal === 'edit') && (
        <div className="usr-modal-overlay">
          <div className="usr-modal">
            <div className="usr-modal-header">
              <div>
                <p className="usr-modal-title">{modal === 'edit' ? `Edit ${title}` : `Add ${title}`}</p>
                <p className="usr-modal-sub">{modal === 'edit' ? selected?.name : `Create a new ${title.toLowerCase()}`}</p>
              </div>
              <button className="usr-modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="usr-modal-body">
              {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
              {fields.map((f, i) => (
                <div key={f.key} className={`usr-form-row ${i === fields.length - 1 ? 'usr-form-row-last' : ''}`}>
                  <label className="usr-form-label" style={{ paddingTop: 8 }}>
                    {f.label} {f.required && <span>*</span>}
                    {f.hint && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 2 }}>{f.hint}</div>}
                  </label>
                  <div className="usr-form-field">
                    {f.type === 'textarea' ? (
                      <textarea className="rm-input" rows={3} value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
                    ) : f.type === 'employee' ? (
                      <select className="rm-input" value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}>
                        <option value="">— Select Employee —</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>)}
                      </select>
                    ) : f.type === 'select' ? (
                      <select className="rm-input" value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}>
                        {!f.options?.some(o => o.value === '') && <option value="">— Select —</option>}
                        {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : f.type === 'checkbox' ? (
                      <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                        <input type="checkbox" checked={!!form[f.key]} onChange={e => set(f.key, e.target.checked)} style={{ width: 16, height: 16, accentColor: '#3b82f6' }} />
                        {f.placeholder || 'Enable'}
                      </label>
                    ) : (
                      <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} className="rm-input" value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
                    )}
                  </div>
                </div>
              ))}
              {/* status toggle */}
              {showStatus && (
                <div className="usr-form-row usr-form-row-last">
                  <label className="usr-form-label" style={{ paddingTop: 8 }}>Status</label>
                  <div className="usr-form-field">
                    <select className="rm-input" style={{ maxWidth: 200 }} value={form.status ?? 'Active'} onChange={e => set('status', e.target.value)}>
                      <option>Active</option><option>Inactive</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="usr-modal-footer">
              <button className="rm-btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="rm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-floppy-fill"></i> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && selected && (
        <div className="rm-modal-overlay">
          <div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete {title}?</h3>
            <p>This will permanently remove <strong>{selected.name}</strong>.</p>
            <div className="rm-modal-actions">
              <button className="rm-btn-outline" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
              <button className="rm-btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Deleting...</> : <><i className="bi bi-trash-fill"></i> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
