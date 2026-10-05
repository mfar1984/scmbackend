'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDateFormat } from '../../lib/useDateFormat';

export type Col = { key: string; label: string; render?: (row: any, fmt: any) => React.ReactNode };
export type FormField = {
  key: string; label: string; type?: 'text' | 'number' | 'textarea' | 'date' | 'select' | 'employee';
  options?: { value: string; label: string }[]; required?: boolean; placeholder?: string; hint?: string;
};

type Props = {
  api: string;
  title: string;             // "Leave Application"
  addLabel: string;          // "Add Leave Application"
  icon: string;
  columns: Col[];
  formFields: FormField[];
  statuses: string[];
  refField?: string;         // reference column key, default reference_no
};

const STATUS_BADGE: Record<string, string> = {
  Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected',
  Paid: 'badge-approved', Active: 'badge-approved', Completed: 'badge-approved',
  Processing: 'badge-review', Draft: 'badge-pending', Closed: 'badge-rejected', Cancelled: 'badge-rejected',
};
const STATUS_CLASS: Record<string, string> = {
  Pending: 'cr-status-pending', Approved: 'cr-status-offered', Rejected: 'cr-status-rejected',
  Paid: 'cr-status-hired', Active: 'cr-status-hired', Completed: 'cr-status-hired',
  Processing: 'cr-status-interview', Draft: 'cr-status-pending', Closed: 'cr-status-rejected', Cancelled: 'cr-status-rejected',
};

export default function ApplicationManager({ api, title, addLabel, icon, columns, formFields, statuses, refField = 'reference_no' }: Props) {
  const { fmt } = useDateFormat();
  const [items, setItems] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [delItem, setDelItem] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const needsEmployees = formFields.some(f => f.type === 'employee');

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

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = items.filter(it => {
    const q = search.toLowerCase();
    const matchSearch = [it[refField], it.employee_name, it.employee_code].some(v => String(v ?? '').toLowerCase().includes(q));
    const matchStatus = statusFilter === 'All' || it.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const changeStatus = async (it: any, status: string) => {
    if (status === it.status) { setMenuOpen(null); return; }
    setUpdating(true);
    try {
      const res = await fetch(`${api}/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const json = await res.json();
      if (json.success) { setMenuOpen(null); fetchItems(); }
      else alert(json.message || 'Update failed.');
    } catch { alert('Network error.'); }
    finally { setUpdating(false); }
  };

  const openCreate = () => {
    const init: Record<string, any> = {};
    formFields.forEach(f => { init[f.key] = ''; });
    setForm(init); setError(''); setCreateOpen(true);
  };
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    const req = formFields.find(f => f.required && !String(form[f.key] ?? '').trim());
    if (req) { setError(`${req.label} is required.`); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { setCreateOpen(false); fetchItems(); }
      else setError(json.message || 'Failed to create.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!delItem) return;
    setSaving(true);
    try {
      const res = await fetch(`${api}/${delItem.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setDelItem(null); fetchItems(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
          <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search reference or employee…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="rm-input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="rm-btn-primary" onClick={openCreate}><i className="bi bi-plus-lg"></i> {addLabel}</button>
      </div>

      <div className="rm-table-wrap" style={{ overflow: 'visible' }}>
        <table className="rm-table">
          <thead>
            <tr>
              <th className="rm-th-module" style={{ width: 40 }}>#</th>
              {columns.map(c => <th key={c.key} className="rm-th-module">{c.label}</th>)}
              <th className="rm-th-perm">Status</th>
              <th className="rm-th-perm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + 3} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={columns.length + 3} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                <i className={`bi ${icon}`} style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No records found.
              </td></tr>
            ) : filtered.map((it, i) => (
              <tr key={it.id} className="rm-data-row">
                <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                {columns.map(c => (
                  <td key={c.key} className="rm-td-module" style={{ fontSize: 13, color: '#374151' }}>
                    {c.render ? c.render(it, fmt) : (it[c.key] ?? '—')}
                  </td>
                ))}
                <td className="rm-td-perm"><span className={`badge-status ${STATUS_BADGE[it.status] || 'badge-pending'}`}>{it.status}</span></td>
                <td className="rm-td-perm" style={{ position: 'relative' }}>
                  <div className="d-flex gap-2 justify-content-center">
                    <button className="rm-action-btn rm-action-edit" title="Change status" onClick={() => setMenuOpen(menuOpen === it.id ? null : it.id)}><i className="bi bi-list-ul"></i></button>
                    <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDelItem(it)}><i className="bi bi-trash-fill"></i></button>
                  </div>
                  {menuOpen === it.id && (
                    <div className="cr-status-menu" ref={menuRef}>
                      {statuses.map(s => (
                        <button key={s} className={`cr-status-item ${STATUS_CLASS[s] || ''} ${s === it.status ? 'is-current' : ''}`} disabled={updating} onClick={() => changeStatus(it, s)}>
                          {s}{s === it.status ? ' ✓' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>Showing {filtered.length} of {items.length} record{items.length !== 1 ? 's' : ''}</div>

      {createOpen && (
        <div className="usr-modal-overlay">
          <div className="usr-modal">
            <div className="usr-modal-header">
              <div><p className="usr-modal-title">{addLabel}</p><p className="usr-modal-sub">Create a new record</p></div>
              <button className="usr-modal-close" onClick={() => setCreateOpen(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="usr-modal-body">
              {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
              {formFields.map((f, i) => (
                <div key={f.key} className={`usr-form-row ${i === formFields.length - 1 ? 'usr-form-row-last' : ''}`}>
                  <label className="usr-form-label" style={{ paddingTop: 8 }}>
                    {f.label} {f.required && <span>*</span>}
                    {f.hint && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 2 }}>{f.hint}</div>}
                  </label>
                  <div className="usr-form-field">
                    {f.type === 'employee' ? (
                      <select className="rm-input" value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}>
                        <option value="">— Select Employee —</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
                      </select>
                    ) : f.type === 'select' ? (
                      <select className="rm-input" value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}>
                        <option value="">— Select —</option>
                        {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea className="rm-input" rows={3} value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
                    ) : (
                      <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} className="rm-input" value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="usr-modal-footer">
              <button className="rm-btn-outline" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button className="rm-btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-plus-lg"></i> Create</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {delItem && (
        <div className="rm-modal-overlay">
          <div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Record?</h3>
            <p>This will permanently remove <strong>{delItem[refField]}</strong>.</p>
            <div className="rm-modal-actions">
              <button className="rm-btn-outline" onClick={() => setDelItem(null)} disabled={saving}>Cancel</button>
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
