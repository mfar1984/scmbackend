'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import KpiReviewModal from '../../../components/hr/kpi/KpiReviewModal';

type Assignment = {
  id: number; reference_no: string | null; employee_name: string | null; employee_code: string | null;
  period_name: string | null; template_name: string | null; reviewer_name: string | null;
  status: string; final_score: number | null; grade: string | null;
};

const STATUS_BADGE: Record<string, string> = {
  Pending: 'badge-pending', 'In Progress': 'badge-review', Reviewed: 'badge-review', Completed: 'badge-approved',
};

export default function KpiAssignmentsPage() {
  const { can } = usePermissions();
  const canCreate = can('hr.kpi.assignments', 'Create');
  const canUpdate = can('hr.kpi.assignments', 'Update');
  const canDelete = can('hr.kpi.assignments', 'Delete');
  const [rows, setRows] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [lists, setLists] = useState<{ templates: any[]; periods: any[] }>({ templates: [], periods: [] });
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [delRow, setDelRow] = useState<Assignment | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/hr/kpi/assignments')).json(); if (j.success) setRows(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    fetchRows();
    fetch('/api/hr/employees-list').then(r => r.json()).then(j => { if (j.success) setEmployees(j.data); });
    fetch('/api/hr/kpi/lists').then(r => r.json()).then(j => { if (j.success) setLists({ templates: j.data.templates, periods: j.data.periods }); });
    fetch('/api/users/admins').then(r => r.json()).then(j => { if (j.success) setAdmins(j.data); });
  }, [fetchRows]);

  const openCreate = () => { setForm({ period_id: '', template_id: '', employee_id: '', reviewer_user_id: '' }); setError(''); setModal(true); };
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.period_id) { setError('Please select a KPI period.'); return; }
    if (!form.template_id) { setError('Please select a template.'); return; }
    if (!form.employee_id) { setError('Please select an employee.'); return; }
    setSaving(true); setError('');
    try {
      const j = await (await fetch('/api/hr/kpi/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })).json();
      if (j.success) { setModal(false); fetchRows(); } else setError(j.message || 'Failed.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!delRow) return;
    const j = await (await fetch(`/api/hr/kpi/assignments/${delRow.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDelRow(null); fetchRows(); } else alert(j.message || 'Delete failed.');
  };

  const filtered = rows.filter(r => [r.employee_name, r.reference_no, r.period_name, r.template_name].some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase())));

  return (
    <>
      <Head><title>KPI Assignments | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'KPI', 'Assignments']}>
        <PermissionGate moduleKey="hr.kpi.assignments">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4"><h1 className="page-title">KPI Assignments</h1><p className="page-subtitle">Assign an appraisal template + period to an employee and a reviewer.</p></div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search employee, period or template…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {canCreate && <button className="rm-btn-primary" onClick={openCreate}><i className="bi bi-plus-lg"></i> New Assignment</button>}
            </div>

            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Reference</th><th className="rm-th-module">Employee</th>
                  <th className="rm-th-module">Period</th><th className="rm-th-module">Template</th>
                  <th className="rm-th-module">Reviewer</th><th className="rm-th-perm">Score</th>
                  <th className="rm-th-perm">Status</th><th className="rm-th-perm">Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-person-check" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No assignments yet.</td></tr>
                  ) : filtered.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{r.reference_no}</td>
                      <td className="rm-td-module"><div style={{ color: '#1f2937' }}>{r.employee_name || '—'}</div>{r.employee_code && <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.employee_code}</div>}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.period_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.template_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.reviewer_name || '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 13, color: '#1f2937' }}>{r.final_score != null ? `${Number(r.final_score)}% (${r.grade || '—'})` : '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${STATUS_BADGE[r.status] || 'badge-pending'}`}>{r.status}</span></td>
                      <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                        {canUpdate && <button className="rm-action-btn rm-action-view" title="Review / Score" onClick={() => setReviewId(r.id)}><i className="bi bi-clipboard-check-fill"></i></button>}
                        {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDelRow(r)}><i className="bi bi-trash-fill"></i></button>}
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
              <div className="usr-modal-header"><div><p className="usr-modal-title">New KPI Assignment</p></div><button className="usr-modal-close" onClick={() => setModal(false)}><i className="bi bi-x-lg"></i></button></div>
              <div className="usr-modal-body">
                {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div style={{ flex: '1 1 240px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>KPI Period <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="rm-input" value={form.period_id} onChange={e => set('period_id', e.target.value)}><option value="">Select period...</option>{lists.periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  </div>
                  <div style={{ flex: '1 1 240px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Template <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="rm-input" value={form.template_id} onChange={e => set('template_id', e.target.value)}><option value="">Select template...</option>{lists.templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                  </div>
                </div>
                <div className="mb-3"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Employee <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="rm-input" value={form.employee_id} onChange={e => set('employee_id', e.target.value)}><option value="">Select employee...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>)}</select>
                </div>
                <div className="mb-1"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Reviewer (Administrator)</label>
                  <select className="rm-input" value={form.reviewer_user_id} onChange={e => set('reviewer_user_id', e.target.value)}><option value="">— Optional —</option>{admins.map(a => <option key={a.id} value={a.id}>{a.name}{a.role ? ` (${a.role})` : ''}</option>)}</select>
                </div>
              </div>
              <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setModal(false)} disabled={saving}>Cancel</button><button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-check-circle-fill"></i> Create</>}</button></div>
            </div>
          </div>
        )}

        {reviewId != null && <KpiReviewModal assignmentId={reviewId} onClose={() => setReviewId(null)} onSaved={() => { setReviewId(null); fetchRows(); }} />}

        {delRow && (
          <div className="rm-modal-overlay"><div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Assignment?</h3><p>Remove <strong>{delRow.reference_no}</strong> and its review scores.</p>
            <div className="rm-modal-actions"><button className="rm-btn-outline" onClick={() => setDelRow(null)}>Cancel</button><button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button></div>
          </div></div>
        )}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
