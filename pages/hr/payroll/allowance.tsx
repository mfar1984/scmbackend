'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import { useDateFormat } from '../../../lib/useDateFormat';

type Row = {
  id: number; employee_name: string | null; employee_code: string | null;
  housing: number; transport: number; meal: number; other_allowance: number; total: number;
  effective_date: string | null; status: string;
};

export default function AllowancePage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can('hr.payroll.allowance', 'Create');
  const canUpdate = can('hr.payroll.allowance', 'Update');
  const canDelete = can('hr.payroll.allowance', 'Delete');
  const [rows, setRows] = useState<Row[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [delRow, setDelRow] = useState<Row | null>(null);
  const [sel, setSel] = useState<Row | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/hr/payroll/allowance')).json(); if (j.success) setRows(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    fetchRows();
    fetch('/api/hr/employees-list').then(r => r.json()).then(j => { if (j.success) setEmployees(j.data); });
  }, [fetchRows]);

  const money = (v: any) => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 });

  const openCreate = () => { setForm({ employee_id: '', housing: '0', transport: '0', meal: '0', other_allowance: '0', effective_date: new Date().toISOString().slice(0, 10), status: 'Active', remarks: '' }); setError(''); setModal('create'); };
  const openEdit = (r: any) => { setSel(r); setForm({ employee_id: String(r.employee_id || ''), housing: String(r.housing), transport: String(r.transport), meal: String(r.meal), other_allowance: String(r.other_allowance), effective_date: r.effective_date ? String(r.effective_date).slice(0, 10) : '', status: r.status, remarks: r.remarks || '' }); setError(''); setModal('edit'); };
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.employee_id) { setError('Please select an employee.'); return; }
    if (!form.effective_date) { setError('Effective date is required.'); return; }
    setSaving(true); setError('');
    try {
      const url = modal === 'edit' ? `/api/hr/payroll/allowance?id=${sel!.id}` : '/api/hr/payroll/allowance';
      const res = await fetch(url, { method: modal === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const j = await res.json();
      if (j.success) { setModal(null); fetchRows(); } else setError(j.message || 'Failed.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!delRow) return;
    const j = await (await fetch(`/api/hr/payroll/allowance?id=${delRow.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDelRow(null); fetchRows(); } else alert(j.message || 'Delete failed.');
  };

  const filtered = rows.filter(r => String(r.employee_name ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Head><title>Allowance Management | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Payroll', 'Allowance Management']}>
        <PermissionGate moduleKey="hr.payroll.allowance">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4"><h1 className="page-title">Allowance Management</h1><p className="page-subtitle">Assign fixed monthly allowances that flow into payslips.</p></div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {canCreate && <button className="rm-btn-primary" onClick={openCreate}><i className="bi bi-plus-lg"></i> New Allowance</button>}
            </div>

            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Employee</th>
                  <th className="rm-th-perm">Housing</th><th className="rm-th-perm">Transport</th>
                  <th className="rm-th-perm">Meal</th><th className="rm-th-perm">Other</th>
                  <th className="rm-th-perm">Total (RM)</th><th className="rm-th-module">Effective</th>
                  <th className="rm-th-perm">Status</th><th className="rm-th-perm">Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-cash-coin" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No allowances set.</td></tr>
                  ) : filtered.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module"><div style={{ color: '#1f2937' }}>{r.employee_name || '—'}</div>{r.employee_code && <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.employee_code}</div>}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#6b7280' }}>{money(r.housing)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#6b7280' }}>{money(r.transport)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#6b7280' }}>{money(r.meal)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#6b7280' }}>{money(r.other_allowance)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#16a34a' }}>{money(r.total)}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.effective_date ? fmt(r.effective_date) : '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${r.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{r.status}</span></td>
                      <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                        {canUpdate && <button className="rm-action-btn rm-action-edit" onClick={() => openEdit(r)}><i className="bi bi-pencil-fill"></i></button>}
                        {canDelete && <button className="rm-action-btn rm-action-delete" onClick={() => setDelRow(r)}><i className="bi bi-trash-fill"></i></button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {(modal === 'create' || modal === 'edit') && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" style={{ maxWidth: 640 }}>
              <div className="usr-modal-header"><div><p className="usr-modal-title">{modal === 'edit' ? 'Edit Allowance' : 'New Allowance Setup'}</p></div><button className="usr-modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button></div>
              <div className="usr-modal-body">
                {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
                <div className="mb-3">
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Employee <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="rm-input" value={form.employee_id} onChange={e => set('employee_id', e.target.value)} disabled={modal === 'edit'}>
                    <option value="">Select employee...</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>)}
                  </select>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div style={{ flex: '1 1 240px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Housing Allowance (RM)</label><input type="number" step="0.01" className="rm-input" value={form.housing} onChange={e => set('housing', e.target.value)} /></div>
                  <div style={{ flex: '1 1 240px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Transport Allowance (RM)</label><input type="number" step="0.01" className="rm-input" value={form.transport} onChange={e => set('transport', e.target.value)} /></div>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div style={{ flex: '1 1 240px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Meal Allowance (RM)</label><input type="number" step="0.01" className="rm-input" value={form.meal} onChange={e => set('meal', e.target.value)} /></div>
                  <div style={{ flex: '1 1 240px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Other Allowances (RM)</label><input type="number" step="0.01" className="rm-input" value={form.other_allowance} onChange={e => set('other_allowance', e.target.value)} /></div>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div style={{ flex: '1 1 240px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Effective Date <span style={{ color: '#ef4444' }}>*</span></label><input type="date" className="rm-input" value={form.effective_date} onChange={e => set('effective_date', e.target.value)} /></div>
                  <div style={{ flex: '1 1 240px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Status</label><select className="rm-input" value={form.status} onChange={e => set('status', e.target.value)}><option>Active</option><option>Inactive</option></select></div>
                </div>
                <div className="mb-1"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Remarks</label><textarea className="rm-input" rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} /></div>
              </div>
              <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setModal(null)} disabled={saving}>Cancel</button><button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-check-circle-fill"></i> {modal === 'edit' ? 'Update' : 'Create'}</>}</button></div>
            </div>
          </div>
        )}

        {delRow && (
          <div className="rm-modal-overlay"><div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Allowance?</h3><p>Remove allowance for <strong>{delRow.employee_name}</strong>.</p>
            <div className="rm-modal-actions"><button className="rm-btn-outline" onClick={() => setDelRow(null)}>Cancel</button><button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button></div>
          </div></div>
        )}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
