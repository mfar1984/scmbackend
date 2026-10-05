'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';

type Advance = {
  id: number; reference_no: string; employee_name: string | null; employee_code: string | null;
  amount: number; monthly_deduction: number; balance: number;
  repayment_months: number; paid_months: number; status: string;
};

const STATUS_BADGE: Record<string, string> = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected', Paid: 'badge-status pr-badge-paid' };

export default function AdvancesPage() {
  const { can } = usePermissions();
  const canCreate = can('hr.payroll.advances', 'Create');
  const canUpdate = can('hr.payroll.advances', 'Update');
  const canDelete = can('hr.payroll.advances', 'Delete');
  const [rows, setRows] = useState<Advance[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [delRow, setDelRow] = useState<Advance | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/hr/payroll/advances')).json(); if (j.success) setRows(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    fetchRows();
    fetch('/api/hr/employees-list').then(r => r.json()).then(j => { if (j.success) setEmployees(j.data); });
  }, [fetchRows]);

  const money = (v: any) => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 });

  const openCreate = () => { setForm({ employee_id: '', amount: '', repayment_months: '3', start_date: new Date().toISOString().slice(0, 10), remarks: '' }); setError(''); setModal(true); };
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const monthlyPreview = (() => { const a = parseFloat(form.amount) || 0; const n = parseInt(form.repayment_months) || 0; return n > 0 ? a / n : 0; })();

  const save = async () => {
    if (!form.employee_id) { setError('Please select an employee.'); return; }
    if (!(parseFloat(form.amount) > 0)) { setError('A valid advance amount is required.'); return; }
    if (!(parseInt(form.repayment_months) > 0)) { setError('Repayment months must be at least 1.'); return; }
    setSaving(true); setError('');
    try {
      const j = await (await fetch('/api/hr/payroll/advances', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })).json();
      if (j.success) { setModal(false); fetchRows(); } else setError(j.message || 'Failed.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const changeStatus = async (r: Advance, status: string) => {
    const j = await (await fetch(`/api/hr/payroll/advances?id=${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })).json();
    if (j.success) fetchRows();
  };

  const doDelete = async () => {
    if (!delRow) return;
    const j = await (await fetch(`/api/hr/payroll/advances?id=${delRow.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDelRow(null); fetchRows(); } else alert(j.message || 'Delete failed.');
  };

  const filtered = rows.filter(r => [r.employee_name, r.reference_no].some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase())));

  return (
    <>
      <Head><title>Advances Management | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Payroll', 'Advances Management']}>
        <PermissionGate moduleKey="hr.payroll.advances">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4"><h1 className="page-title">Salary Advances</h1><p className="page-subtitle">Salary advances auto-deduct monthly from payroll until fully repaid.</p></div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search employee or advance number…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {canCreate && <button className="rm-btn-primary" onClick={openCreate}><i className="bi bi-plus-lg"></i> New Advance</button>}
            </div>

            <div className="rm-table-wrap" style={{ overflow: 'visible' }}>
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Advance Number</th><th className="rm-th-module">Employee</th>
                  <th className="rm-th-perm">Advance Amount</th><th className="rm-th-perm">Monthly</th>
                  <th className="rm-th-perm">Balance</th><th className="rm-th-perm">Progress</th>
                  <th className="rm-th-perm">Status</th><th className="rm-th-perm">Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-cash-stack" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No advances found.</td></tr>
                  ) : filtered.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{r.reference_no}</td>
                      <td className="rm-td-module"><div style={{ color: '#1f2937' }}>{r.employee_name || '—'}</div>{r.employee_code && <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.employee_code}</div>}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#1f2937' }}>RM {money(r.amount)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#6b7280' }}>RM {money(r.monthly_deduction)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#dc2626' }}>RM {money(r.balance)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280' }}>{r.paid_months} / {r.repayment_months} months</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}>
                        {canUpdate ? (
                          <select className="pr-status-select" value={r.status} onChange={e => changeStatus(r, e.target.value)}>
                            {['Pending', 'Approved', 'Rejected', 'Paid'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={`badge-status ${STATUS_BADGE[r.status] || 'badge-pending'}`}>{r.status}</span>
                        )}
                      </td>
                      <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                        {canDelete && <button className="rm-action-btn rm-action-delete" onClick={() => setDelRow(r)}><i className="bi bi-trash-fill"></i></button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {modal && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" style={{ maxWidth: 620 }}>
              <div className="usr-modal-header"><div><p className="usr-modal-title">New Advance Setup</p></div><button className="usr-modal-close" onClick={() => setModal(false)}><i className="bi bi-x-lg"></i></button></div>
              <div className="usr-modal-body">
                {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
                <div className="mb-3">
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Employee <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="rm-input" value={form.employee_id} onChange={e => set('employee_id', e.target.value)}><option value="">Select employee...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>)}</select>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div style={{ flex: '1 1 240px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Advance Amount (RM) <span style={{ color: '#ef4444' }}>*</span></label><input type="number" step="0.01" className="rm-input" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" /></div>
                  <div style={{ flex: '1 1 240px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Repayment Months <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="rm-input" value={form.repayment_months} onChange={e => set('repayment_months', e.target.value)}>
                      {[1, 2, 3, 4, 5, 6, 9, 12].map(m => <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-3"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Start Date <span style={{ color: '#ef4444' }}>*</span></label><input type="date" className="rm-input" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
                {monthlyPreview > 0 && <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1d4ed8', marginBottom: 14 }}><i className="bi bi-calculator me-1"></i> Monthly deduction: <strong>RM {money(monthlyPreview)}</strong></div>}
                <div className="mb-1"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Remarks</label><textarea className="rm-input" rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} /></div>
              </div>
              <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setModal(false)} disabled={saving}>Cancel</button><button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-check-circle-fill"></i> Create</>}</button></div>
            </div>
          </div>
        )}

        {delRow && (
          <div className="rm-modal-overlay"><div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Advance?</h3><p>Remove <strong>{delRow.reference_no}</strong> for {delRow.employee_name}.</p>
            <div className="rm-modal-actions"><button className="rm-btn-outline" onClick={() => setDelRow(null)}>Cancel</button><button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button></div>
          </div></div>
        )}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
