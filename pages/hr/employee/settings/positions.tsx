'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import EmployeeSettingsLayout from '../../../../components/EmployeeSettingsLayout';
import { usePermissions } from '../../../../lib/usePermissions';

type Position = {
  id: number; name: string; department_id: number | null;
  department_name: string | null; status: 'Active' | 'Inactive';
};
type Dept = { id: number; name: string };

export default function PositionsSettingsPage() {
  const { can } = usePermissions();
  const canCreate = can('hr.employee.settings.positions', 'Create');
  const canUpdate = can('hr.employee.settings.positions', 'Update');
  const canDelete = can('hr.employee.settings.positions', 'Delete');
  const [items, setItems]   = useState<Position[]>([]);
  const [depts, setDepts]   = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Position | null>(null);
  const [name, setName]     = useState('');
  const [deptId, setDeptId] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        fetch('/api/hr/positions'),
        fetch('/api/hr/departments'),
      ]);
      const pJson = await pRes.json();
      const dJson = await dRes.json();
      if (pJson.success) setItems(pJson.data);
      if (dJson.success) setDepts(dJson.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = items.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.department_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setName(''); setDeptId(''); setStatus('Active'); setError(''); setModal('create'); };
  const openEdit = (p: Position) => {
    setSelected(p); setName(p.name);
    setDeptId(p.department_id ? String(p.department_id) : '');
    setStatus(p.status); setError(''); setModal('edit');
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Position name is required.'); return; }
    setSaving(true); setError('');
    try {
      const url    = modal === 'edit' ? `/api/hr/positions?id=${selected!.id}` : '/api/hr/positions';
      const method = modal === 'edit' ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department_id: deptId ? parseInt(deptId) : null, status }),
      });
      const json = await res.json();
      if (json.success) { setModal(null); fetchAll(); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/positions?id=${selected.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setModal(null); fetchAll(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>Positions — Employee Settings | ATLINE Admin</title></Head>
      <EmployeeSettingsLayout activeTab="positions">

        <div className="d-flex gap-2 mb-3 flex-wrap">
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
            <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search position or department…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {canCreate && (
            <button className="rm-btn-primary" onClick={openCreate}>
              <i className="bi bi-plus-lg"></i> Add Position
            </button>
          )}
        </div>

        <div className="rm-table-wrap">
          <table className="rm-table">
            <thead>
              <tr>
                <th className="rm-th-module" style={{ width: 40 }}>#</th>
                <th className="rm-th-module">Position Name</th>
                <th className="rm-th-module">Department</th>
                <th className="rm-th-perm">Status</th>
                <th className="rm-th-perm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                  <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                  <i className="bi bi-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No positions found.
                </td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id} className="rm-data-row">
                  <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                  <td className="rm-td-module" style={{ color: '#1f2937' }}>{p.name}</td>
                  <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{p.department_name || '—'}</td>
                  <td className="rm-td-perm">
                    <span className={`badge-status ${p.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{p.status}</span>
                  </td>
                  <td className="rm-td-perm">
                    <div className="d-flex gap-2 justify-content-center">
                      {canUpdate && <button className="rm-action-btn rm-action-edit" onClick={() => openEdit(p)}><i className="bi bi-pencil-fill"></i></button>}
                      {canDelete && <button className="rm-action-btn rm-action-delete" onClick={() => { setSelected(p); setModal('delete'); }}><i className="bi bi-trash-fill"></i></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>{filtered.length} position{filtered.length !== 1 ? 's' : ''}</div>

        {(modal === 'create' || modal === 'edit') && (
          <div className="usr-modal-overlay">
            <div className="usr-modal">
              <div className="usr-modal-header">
                <div>
                  <p className="usr-modal-title">{modal === 'edit' ? 'Edit Position' : 'Add Position'}</p>
                  <p className="usr-modal-sub">{modal === 'edit' ? selected?.name : 'Create a new position'}</p>
                </div>
                <button className="usr-modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="usr-modal-body">
                {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
                <div className="usr-form-row">
                  <label className="usr-form-label">Position Name <span>*</span></label>
                  <div className="usr-form-field"><input className="rm-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Network Engineer" /></div>
                </div>
                <div className="usr-form-row">
                  <label className="usr-form-label">Department</label>
                  <div className="usr-form-field">
                    <select className="rm-input" value={deptId} onChange={e => setDeptId(e.target.value)}>
                      <option value="">— Select Department —</option>
                      {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="usr-form-row usr-form-row-last">
                  <label className="usr-form-label">Status</label>
                  <div className="usr-form-field">
                    <select className="rm-input" value={status} onChange={e => setStatus(e.target.value as 'Active' | 'Inactive')}>
                      <option>Active</option><option>Inactive</option>
                    </select>
                  </div>
                </div>
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
              <h3>Delete Position?</h3>
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

      </EmployeeSettingsLayout>
    </>
  );
}
