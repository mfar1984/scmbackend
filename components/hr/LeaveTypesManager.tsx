'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../../lib/usePermissions';

type LeaveType = {
  id: number; code: string | null; name: string; color: string; days_per_year: number;
  paid: 'Paid' | 'Unpaid'; gender_eligibility: 'All' | 'Male' | 'Female'; carry_forward: number; requires_approval: number;
  allow_half_day: number; requires_document: number; description: string | null;
  status: 'Active' | 'Inactive';
};

function YesNo({ on }: { on: boolean }) {
  return on
    ? <i className="bi bi-check-circle-fill" style={{ color: '#22c55e', fontSize: 15 }}></i>
    : <i className="bi bi-dash-circle-fill" style={{ color: '#cbd5e1', fontSize: 15 }}></i>;
}

const EMPTY = {
  code: '', name: '', description: '', days_per_year: '', color: '#3b82f6', status: 'Active', gender_eligibility: 'All',
  paid: true, requires_approval: true, allow_half_day: false, carry_forward: false, requires_document: false,
};

export default function LeaveTypesManager({ moduleKey }: { moduleKey?: string }) {
  const { can } = usePermissions();
  const canCreate = moduleKey ? can(moduleKey, 'Create') : true;
  const canUpdate = moduleKey ? can(moduleKey, 'Update') : true;
  const canDelete = moduleKey ? can(moduleKey, 'Delete') : true;
  const [items, setItems] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<LeaveType | null>(null);
  const [f, setF] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/leave-types');
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(it => {
    const q = search.toLowerCase();
    const ms = it.name.toLowerCase().includes(q) || (it.code || '').toLowerCase().includes(q);
    const mst = statusFilter === 'All' || it.status === statusFilter;
    return ms && mst;
  });

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const openCreate = () => { setF(EMPTY); setError(''); setModal('create'); };
  const openEdit = (it: LeaveType) => {
    setSelected(it);
    setF({
      code: it.code || '', name: it.name, description: it.description || '',
      days_per_year: String(it.days_per_year ?? ''), color: it.color || '#3b82f6', status: it.status,
      gender_eligibility: it.gender_eligibility || 'All',
      paid: it.paid === 'Paid', requires_approval: !!it.requires_approval, allow_half_day: !!it.allow_half_day,
      carry_forward: !!it.carry_forward, requires_document: !!it.requires_document,
    });
    setError(''); setModal('edit');
  };

  const handleSave = async () => {
    if (!f.code.trim()) { setError('Code is required.'); return; }
    if (!f.name.trim()) { setError('Leave type name is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        code: f.code, name: f.name, description: f.description,
        days_per_year: parseInt(f.days_per_year) || 0, color: f.color, status: f.status,
        paid: f.paid ? 'Paid' : 'Unpaid', gender_eligibility: f.gender_eligibility,
        requires_approval: f.requires_approval, allow_half_day: f.allow_half_day,
        carry_forward: f.carry_forward, requires_document: f.requires_document,
      };
      const url = modal === 'edit' ? `/api/hr/leave-types?id=${selected!.id}` : '/api/hr/leave-types';
      const method = modal === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
      const res = await fetch(`/api/hr/leave-types?id=${selected.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setModal(null); fetchItems(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
    finally { setSaving(false); }
  };

  const CheckCard = ({ field, icon, title, desc, variant }: { field: string; icon: string; title: string; desc?: string; variant?: 'blue' | 'amber' }) => (
    <label className={`lt-check-card${f[field] ? ' active' : ''}${variant ? ` lt-${variant}` : ''}`}>
      <input type="checkbox" checked={!!f[field]} onChange={e => set(field, e.target.checked)} />
      <div className="lt-check-body">
        <div className="lt-check-title"><i className={`bi ${icon}`}></i> {title}</div>
        {desc && <div className="lt-check-desc">{desc}</div>}
      </div>
    </label>
  );

  return (
    <>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
          <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search by name or code…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="rm-input" style={{ width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option><option>Active</option><option>Inactive</option>
        </select>
        {canCreate && <button className="rm-btn-primary" onClick={openCreate}><i className="bi bi-plus-lg"></i> Add Leave Type</button>}
      </div>

      <div className="rm-table-wrap">
        <table className="rm-table">
          <thead>
            <tr>
              <th className="rm-th-module" style={{ width: 70 }}>Code</th>              <th className="rm-th-module">Leave Type</th>
              <th className="rm-th-module">Eligibility</th>
              <th className="rm-th-module">Max Days/Year</th>
              <th className="rm-th-perm">Paid</th>
              <th className="rm-th-perm">Approval</th>
              <th className="rm-th-perm">Carry Forward</th>
              <th className="rm-th-perm">Status</th>
              <th className="rm-th-perm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                <i className="bi bi-calendar-check" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No leave types found.
              </td></tr>
            ) : filtered.map(it => (
              <tr key={it.id} className="rm-data-row">
                <td className="rm-td-module">
                  <span className="lt-code-badge" style={{ color: it.color, background: `${it.color}1a` }}>{it.code || '—'}</span>
                </td>
                <td className="rm-td-module" style={{ color: '#1f2937' }}>{it.name}</td>
                <td className="rm-td-module">
                  {it.gender_eligibility === 'Male' ? <span className="lt-gender-badge lt-gender-male"><i className="bi bi-gender-male"></i> Male</span>
                    : it.gender_eligibility === 'Female' ? <span className="lt-gender-badge lt-gender-female"><i className="bi bi-gender-female"></i> Female</span>
                    : <span className="lt-gender-badge lt-gender-all"><i className="bi bi-people-fill"></i> All</span>}
                </td>
                <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.days_per_year > 0 ? `${it.days_per_year} days` : 'Unlimited'}</td>
                <td className="rm-td-perm"><YesNo on={it.paid === 'Paid'} /></td>
                <td className="rm-td-perm"><YesNo on={!!it.requires_approval} /></td>
                <td className="rm-td-perm"><YesNo on={!!it.carry_forward} /></td>
                <td className="rm-td-perm"><span className={`badge-status ${it.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{it.status}</span></td>
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
      <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>{filtered.length} leave type{filtered.length !== 1 ? 's' : ''}</div>

      {(modal === 'create' || modal === 'edit') && (
        <div className="usr-modal-overlay">
          <div className="usr-modal" style={{ maxWidth: 640 }}>
            <div className="usr-modal-header">
              <div>
                <p className="usr-modal-title">{modal === 'edit' ? 'Edit Leave Type' : 'Add Leave Type'}</p>
                <p className="usr-modal-sub">{modal === 'edit' ? selected?.name : 'Define a new leave type'}</p>
              </div>
              <button className="usr-modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="usr-modal-body">
              {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

              <div className="d-flex flex-wrap gap-3 mb-3">
                <div style={{ flex: '1 1 160px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Code <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="rm-input" value={f.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. AL" maxLength={10} />
                </div>
                <div style={{ flex: '2 1 280px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Leave Type Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="rm-input" value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Annual Leave" />
                </div>
              </div>

              <div className="mb-3">
                <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Description</label>
                <textarea className="rm-input" rows={2} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Brief description" />
              </div>

              <div className="d-flex flex-wrap gap-3 mb-3">
                <div style={{ flex: '1 1 160px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Max Days/Year <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="number" className="rm-input" value={f.days_per_year} onChange={e => set('days_per_year', e.target.value)} placeholder="0 for unlimited" min={0} />
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>0 = Unlimited</div>
                </div>
                <div style={{ flex: '1 1 120px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Color</label>
                  <input type="color" className="rm-input" style={{ height: 42, padding: 4 }} value={f.color} onChange={e => set('color', e.target.value)} />
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Status <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="rm-input" value={f.status} onChange={e => set('status', e.target.value)}>
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Gender Eligibility <span style={{ color: '#ef4444' }}>*</span></label>
                <select className="rm-input" value={f.gender_eligibility} onChange={e => set('gender_eligibility', e.target.value)}>
                  <option value="All">All Employees</option>
                  <option value="Male">Male only (e.g. Paternity Leave)</option>
                  <option value="Female">Female only (e.g. Maternity Leave)</option>
                </select>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Only employees of this gender can apply for this leave type.</div>
              </div>

              <div className="d-flex flex-column gap-2">
                <CheckCard field="paid" icon="bi-cash-coin" title="Paid Leave" />
                <CheckCard field="requires_approval" icon="bi-check-circle" title="Requires Approval" />
                <CheckCard field="allow_half_day" icon="bi-calendar-week" title="Allow Half Days" desc="Staff can apply for 0.5 days (half day) for this leave type" variant="blue" />
                <CheckCard field="carry_forward" icon="bi-arrow-right-circle" title="Allow Carry Forward to Next Year" />
                <CheckCard field="requires_document" icon="bi-file-earmark-text" title="Requires Supporting Document" desc="Staff must upload supporting document when applying for this leave type" variant="amber" />
              </div>
            </div>
            <div className="usr-modal-footer">
              <button className="rm-btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="rm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-check-circle-fill"></i> {modal === 'edit' ? 'Save Changes' : 'Create'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && selected && (
        <div className="rm-modal-overlay">
          <div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Leave Type?</h3>
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
