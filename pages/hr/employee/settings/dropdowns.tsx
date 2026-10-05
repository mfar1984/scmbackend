'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import EmployeeSettingsLayout from '../../../../components/EmployeeSettingsLayout';
import { usePermissions } from '../../../../lib/usePermissions';

type Option = { id: number; category: string; value: string; sort_order: number; status: 'Active' | 'Inactive'; };

const CATEGORIES = [
  { key: 'gender',          label: 'Gender',           icon: 'bi-gender-ambiguous' },
  { key: 'marital_status',  label: 'Marital Status',   icon: 'bi-heart-fill' },
  { key: 'race',            label: 'Race',             icon: 'bi-people-fill' },
  { key: 'religion',        label: 'Religion',         icon: 'bi-stars' },
  { key: 'employee_status', label: 'Employee Status',  icon: 'bi-person-check-fill' },
  { key: 'nationality',     label: 'Nationality',      icon: 'bi-flag-fill' },
  { key: 'job_type',        label: 'Job Type',         icon: 'bi-clock-fill' },
];

export default function DropdownsSettingsPage() {
  const { can } = usePermissions();
  const canCreate = can('hr.employee.settings.dropdowns', 'Create');
  const canUpdate = can('hr.employee.settings.dropdowns', 'Update');
  const canDelete = can('hr.employee.settings.dropdowns', 'Delete');
  const [options, setOptions]   = useState<Option[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeCat, setActiveCat] = useState('gender');
  const [modal, setModal]       = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Option | null>(null);
  const [value, setValue]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/dropdowns');
      const json = await res.json();
      if (json.success) setOptions(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  const catOptions = options.filter(o => o.category === activeCat);

  const openCreate = () => { setValue(''); setError(''); setModal('create'); };
  const openEdit = (o: Option) => { setSelected(o); setValue(o.value); setError(''); setModal('edit'); };

  const handleSave = async () => {
    if (!value.trim()) { setError('Value is required.'); return; }
    setSaving(true); setError('');
    try {
      const url    = modal === 'edit' ? `/api/hr/dropdowns?id=${selected!.id}` : '/api/hr/dropdowns';
      const method = modal === 'edit' ? 'PUT' : 'POST';
      const body   = modal === 'edit'
        ? { value, sort_order: selected!.sort_order, status: selected!.status }
        : { category: activeCat, value, sort_order: catOptions.length + 1 };
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json   = await res.json();
      if (json.success) { setModal(null); fetchOptions(); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/dropdowns?id=${selected.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setModal(null); fetchOptions(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
    finally { setSaving(false); }
  };

  const activeLabel = CATEGORIES.find(c => c.key === activeCat)?.label || '';

  return (
    <>
      <Head><title>Dropdown Options — Employee Settings | ATLINE Admin</title></Head>
      <EmployeeSettingsLayout activeTab="dropdowns">

        <div className="int-info-note mb-4">
          <i className="bi bi-info-circle-fill"></i>
          Manage dropdown values used in the employee form. Select a category below to view and edit its options.
        </div>

        {/* Category sub-tabs */}
        <div className="d-flex gap-2 flex-wrap mb-4">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`int-tab-btn${activeCat === c.key ? ' active' : ''}`}
              onClick={() => setActiveCat(c.key)}
            >
              <i className={`bi ${c.icon}`}></i> {c.label}
            </button>
          ))}
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ fontSize: 14, color: '#374151' }}>
            <strong>{activeLabel}</strong> options
          </div>
          {canCreate && (
            <button className="rm-btn-primary" onClick={openCreate}>
              <i className="bi bi-plus-lg"></i> Add Option
            </button>
          )}
        </div>

        <div className="rm-table-wrap">
          <table className="rm-table">
            <thead>
              <tr>
                <th className="rm-th-module" style={{ width: 40 }}>#</th>
                <th className="rm-th-module">Value</th>
                <th className="rm-th-perm">Status</th>
                <th className="rm-th-perm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                  <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...
                </td></tr>
              ) : catOptions.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                  <i className="bi bi-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No options for {activeLabel}.
                </td></tr>
              ) : catOptions.map((o, i) => (
                <tr key={o.id} className="rm-data-row">
                  <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                  <td className="rm-td-module" style={{ color: '#1f2937' }}>{o.value}</td>
                  <td className="rm-td-perm">
                    <span className={`badge-status ${o.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{o.status}</span>
                  </td>
                  <td className="rm-td-perm">
                    <div className="d-flex gap-2 justify-content-center">
                      {canUpdate && <button className="rm-action-btn rm-action-edit" onClick={() => openEdit(o)}><i className="bi bi-pencil-fill"></i></button>}
                      {canDelete && <button className="rm-action-btn rm-action-delete" onClick={() => { setSelected(o); setModal('delete'); }}><i className="bi bi-trash-fill"></i></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>{catOptions.length} option{catOptions.length !== 1 ? 's' : ''}</div>

        {(modal === 'create' || modal === 'edit') && (
          <div className="usr-modal-overlay">
            <div className="usr-modal">
              <div className="usr-modal-header">
                <div>
                  <p className="usr-modal-title">{modal === 'edit' ? 'Edit Option' : `Add ${activeLabel} Option`}</p>
                  <p className="usr-modal-sub">{modal === 'edit' ? selected?.value : `New value for ${activeLabel}`}</p>
                </div>
                <button className="usr-modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="usr-modal-body">
                {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
                <div className="usr-form-row usr-form-row-last">
                  <label className="usr-form-label">Value <span>*</span></label>
                  <div className="usr-form-field"><input className="rm-input" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. Male" /></div>
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
              <h3>Delete Option?</h3>
              <p>This will permanently remove <strong>{selected.value}</strong>.</p>
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
