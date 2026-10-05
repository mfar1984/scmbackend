'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../../../lib/usePermissions';

type Props = {
  api: string;
  title: string;
  subtitle: string;
  typeLabel: string;        // "Bonus Type" | "Commission Type"
  typeKey: string;          // "bonus_type" | "commission_type"
  typeOptions: string[];
  emptyIcon: string;
  moduleKey?: string;       // permission module key
};

const STATUS_BADGE: Record<string, string> = { Pending: 'badge-pending', Approved: 'badge-approved', Paid: 'badge-status pr-badge-paid' };

export default function PeriodAmountManager({ api, title, subtitle, typeLabel, typeKey, typeOptions, emptyIcon, moduleKey }: Props) {
  const { can } = usePermissions();
  const canCreate = moduleKey ? can(moduleKey, 'Create') : true;
  const canUpdate = moduleKey ? can(moduleKey, 'Update') : true;
  const canDelete = moduleKey ? can(moduleKey, 'Delete') : true;
  const [rows, setRows] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [sel, setSel] = useState<any>(null);
  const [delRow, setDelRow] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch(api)).json(); if (j.success) setRows(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, [api]);

  useEffect(() => {
    fetchRows();
    fetch('/api/hr/employees-list').then(r => r.json()).then(j => { if (j.success) setEmployees(j.data); });
    fetch('/api/hr/payroll/periods-list').then(r => r.json()).then(j => { if (j.success) setPeriods(j.data); });
  }, [fetchRows]);

  const money = (v: any) => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 });

  const openCreate = () => { setForm({ employee_id: '', period_id: '', [typeKey]: typeOptions[0], amount: '', remarks: '', status: 'Pending' }); setError(''); setModal('create'); };
  const openEdit = (r: any) => { setSel(r); setForm({ employee_id: String(r.employee_id || ''), period_id: String(r.period_id || ''), [typeKey]: r[typeKey] || typeOptions[0], amount: String(r.amount), remarks: r.remarks || '', status: r.status }); setError(''); setModal('edit'); };
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.employee_id) { setError('Please select an employee.'); return; }
    if (!form.period_id) { setError('Please select a payroll period.'); return; }
    if (!(parseFloat(form.amount) > 0)) { setError('A valid amount is required.'); return; }
    setSaving(true); setError('');
    try {
      const url = modal === 'edit' ? `${api}?id=${sel.id}` : api;
      const res = await fetch(url, { method: modal === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const j = await res.json();
      if (j.success) { setModal(null); fetchRows(); } else setError(j.message || 'Failed.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!delRow) return;
    const j = await (await fetch(`${api}?id=${delRow.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDelRow(null); fetchRows(); } else alert(j.message || 'Delete failed.');
  };

  const changeStatus = async (r: any, status: string) => {
    const j = await (await fetch(`${api}?id=${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...r, [typeKey]: r[typeKey], status }) })).json();
    if (j.success) fetchRows();
  };

  const filtered = rows.filter(r => [r.employee_name, r[typeKey], r.period_name].some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase())));

  return (
    <>
      <div className="mb-4"><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
          <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search employee, period or type…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {canCreate && <button className="rm-btn-primary" onClick={openCreate}><i className="bi bi-plus-lg"></i> New {title.split(' ')[0]}</button>}
      </div>

      <div className="rm-table-wrap" style={{ overflow: 'visible' }}>
        <table className="rm-table">
          <thead><tr>
            <th className="rm-th-module">Employee</th>
            <th className="rm-th-module">Period</th>
            <th className="rm-th-module">{typeLabel}</th>
            <th className="rm-th-perm">Amount (RM)</th>
            <th className="rm-th-perm">Status</th>
            <th className="rm-th-perm">Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className={`bi ${emptyIcon}`} style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No records found.</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="rm-data-row">
                <td className="rm-td-module"><div style={{ color: '#1f2937' }}>{r.employee_name || '—'}</div>{r.employee_code && <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.employee_code}</div>}</td>
                <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.period_name || '—'}</td>
                <td className="rm-td-module" style={{ fontSize: 13, color: '#374151' }}>{r[typeKey] || '—'}</td>
                <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#16a34a' }}>{money(r.amount)}</td>
                <td className="rm-td-perm" style={{ textAlign: 'center' }}>
                  {canUpdate ? (
                    <select className="pr-status-select" value={r.status} onChange={e => changeStatus(r, e.target.value)}>
                      {['Pending', 'Approved', 'Paid'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className={`badge-status ${STATUS_BADGE[r.status] || 'badge-pending'}`}>{r.status}</span>
                  )}
                </td>
                <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                  {canUpdate && <button className="rm-action-btn rm-action-edit" onClick={() => openEdit(r)}><i className="bi bi-pencil-fill"></i></button>}
                  {canDelete && <button className="rm-action-btn rm-action-delete" onClick={() => setDelRow(r)}><i className="bi bi-trash-fill"></i></button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <div className="usr-modal-overlay">
          <div className="usr-modal" style={{ maxWidth: 640 }}>
            <div className="usr-modal-header"><div><p className="usr-modal-title">{modal === 'edit' ? `Edit ${title.split(' ')[0]}` : `New ${title.split(' ')[0]} Setup`}</p></div><button className="usr-modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button></div>
            <div className="usr-modal-body">
              {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
              <div className="mb-3">
                <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Employee <span style={{ color: '#ef4444' }}>*</span></label>
                <select className="rm-input" value={form.employee_id} onChange={e => set('employee_id', e.target.value)}>
                  <option value="">Select employee...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>)}
                </select>
              </div>
              <div className="d-flex flex-wrap gap-3 mb-3">
                <div style={{ flex: '1 1 240px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Payroll Period <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="rm-input" value={form.period_id} onChange={e => set('period_id', e.target.value)} disabled={periods.length === 0}>
                    <option value="">Select period...</option>
                    {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {periods.length === 0 && (
                    <div style={{ fontSize: 11.5, color: '#d97706', marginTop: 4 }}>
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>
                      No payroll period yet. Create one under <a href="/hr/payroll/periods" style={{ color: '#2563eb' }}>Payroll Periods</a> first.
                    </div>
                  )}
                </div>
                <div style={{ flex: '1 1 240px' }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>{typeLabel} <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="rm-input" value={form[typeKey]} onChange={e => set(typeKey, e.target.value)}>
                    {typeOptions.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Amount (RM) <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="number" step="0.01" className="rm-input" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" />
              </div>
              <div className="mb-1">
                <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Remarks</label>
                <textarea className="rm-input" rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} />
              </div>
            </div>
            <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setModal(null)} disabled={saving}>Cancel</button><button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-check-circle-fill"></i> {modal === 'edit' ? 'Update' : 'Create'}</>}</button></div>
          </div>
        </div>
      )}

      {delRow && (
        <div className="rm-modal-overlay"><div className="rm-modal" onClick={e => e.stopPropagation()}>
          <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
          <h3>Delete Record?</h3><p>Remove this entry for <strong>{delRow.employee_name}</strong>.</p>
          <div className="rm-modal-actions"><button className="rm-btn-outline" onClick={() => setDelRow(null)}>Cancel</button><button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button></div>
        </div></div>
      )}
    </>
  );
}
