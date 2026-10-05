'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import EmployeeSettingsLayout from '../../../../components/EmployeeSettingsLayout';
import { usePermissions } from '../../../../lib/usePermissions';

type Dept = {
  id: number; name: string; code: string | null;
  description: string | null; status: 'Active' | 'Inactive';
};

export default function DepartmentsSettingsPage() {
  const { can } = usePermissions();
  const canCreate = can('hr.employee.settings.departments', 'Create');
  const canUpdate = can('hr.employee.settings.departments', 'Update');
  const canDelete = can('hr.employee.settings.departments', 'Delete');
  const [items, setItems]     = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Dept | null>(null);

  // form fields
  const [name, setName]   = useState('');
  const [code, setCode]   = useState('');
  const [desc, setDesc]   = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/departments');
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setName(''); setCode(''); setDesc(''); setStatus('Active'); setError('');
    setModal('create');
  };
  const openEdit = (d: Dept) => {
    setSelected(d);
    setName(d.name); setCode(d.code || ''); setDesc(d.description || '');
    setStatus(d.status); setError('');
    setModal('edit');
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Department name is required.'); return; }
    setSaving(true); setError('');
    try {
      const url    = modal === 'edit' ? `/api/hr/departments?id=${selected!.id}` : '/api/hr/departments';
      const method = modal === 'edit' ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, description: desc, status }),
      });
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
      const res = await fetch(`/api/hr/departments?id=${selected.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setModal(null); fetchItems(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>Departments — Employee Settings | ATLINE Admin</title></Head>
      <EmployeeSettingsLayout activeTab="departments">

        {/* Toolbar */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
            <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search department…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {canCreate && (
            <button className="rm-btn-primary" onClick={openCreate}>
              <i className="bi bi-plus-lg"></i> Add Department
            </button>
          )}
        </div>

        {/* Table */}        {/* Table */}
        <div className="rm-table-wrap">
          <table className="rm-table">
            <thead>
              <tr>
                <th className="rm-th-module" style={{ width: 40 }}>#</th>
                <th className="rm-th-module">Department Name</th>
                <th className="rm-th-module">Code</th>
                <th className="rm-th-module">Description</th>
                <th className="rm-th-perm">Status</th>
                <th className="rm-th-perm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                  <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                  <i className="bi bi-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No departments found.
                </td></tr>
              ) : filtered.map((d, i) => (
                <tr key={d.id} className="rm-data-row">
                  <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                  <td className="rm-td-module" style={{ color: '#1f2937' }}>{d.name}</td>
                  <td className="rm-td-module" style={{ fontSize: 12.5, color: '#6b7280' }}>{d.code || '—'}</td>
                  <td style={{ padding: '9px 16px', fontSize: 13, color: '#6b7280' }}>{d.description || '—'}</td>
                  <td className="rm-td-perm">
                    <span className={`badge-status ${d.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{d.status}</span>
                  </td>
                  <td className="rm-td-perm">
                    <div className="d-flex gap-2 justify-content-center">
                      {canUpdate && <button className="rm-action-btn rm-action-edit" onClick={() => openEdit(d)}><i className="bi bi-pencil-fill"></i></button>}
                      {canDelete && <button className="rm-action-btn rm-action-delete" onClick={() => { setSelected(d); setModal('delete'); }}><i className="bi bi-trash-fill"></i></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>
          {filtered.length} department{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* Create / Edit Modal */}
        {(modal === 'create' || modal === 'edit') && (
          <div className="usr-modal-overlay">
            <div className="usr-modal">
              <div className="usr-modal-header">
                <div>
                  <p className="usr-modal-title">{modal === 'edit' ? 'Edit Department' : 'Add Department'}</p>
                  <p className="usr-modal-sub">{modal === 'edit' ? selected?.name : 'Create a new department'}</p>
                </div>
                <button className="usr-modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="usr-modal-body">
                {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
                <div className="usr-form-row">
                  <label className="usr-form-label">Name <span>*</span></label>
                  <div className="usr-form-field"><input className="rm-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Engineering" /></div>
                </div>
                <div className="usr-form-row">
                  <label className="usr-form-label">Code</label>
                  <div className="usr-form-field"><input className="rm-input" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. ENG" /></div>
                </div>
                <div className="usr-form-row">
                  <label className="usr-form-label">Description</label>
                  <div className="usr-form-field"><input className="rm-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description" /></div>
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
                  {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-floppy-fill"></i> {modal === 'edit' ? 'Save Changes' : 'Add Department'}</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {modal === 'delete' && selected && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Department?</h3>
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
