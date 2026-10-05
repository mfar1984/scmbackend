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

export default function KpiReviewsPage() {
  const { can } = usePermissions();
  const canReview = can('hr.kpi.reviews', 'Update') || can('hr.kpi.reviews', 'Approve');
  const [rows, setRows] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Outstanding');
  const [reviewId, setReviewId] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/hr/kpi/assignments')).json(); if (j.success) setRows(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchRows(); }, [fetchRows]);

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const ms = [r.employee_name, r.reference_no, r.period_name, r.template_name].some(v => String(v ?? '').toLowerCase().includes(q));
    const mst = statusFilter === 'All' || (statusFilter === 'Outstanding' ? r.status !== 'Completed' : r.status === statusFilter);
    return ms && mst;
  });

  return (
    <>
      <Head><title>KPI Reviews | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'KPI', 'Reviews']}>
        <PermissionGate moduleKey="hr.kpi.reviews">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4"><h1 className="page-title">KPI Reviews</h1><p className="page-subtitle">Score employees against their assigned appraisal. Finalizing computes the grade.</p></div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search employee or period…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="rm-input" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="Outstanding">Outstanding</option>
                <option value="All">All</option>
                {['Pending', 'Reviewed', 'Completed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Employee</th><th className="rm-th-module">Period</th>
                  <th className="rm-th-module">Template</th><th className="rm-th-module">Reviewer</th>
                  <th className="rm-th-perm">Score</th><th className="rm-th-perm">Status</th><th className="rm-th-perm">Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-clipboard-check" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>Nothing to review.</td></tr>
                  ) : filtered.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module"><div style={{ color: '#1f2937' }}>{r.employee_name || '—'}</div>{r.employee_code && <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.employee_code}</div>}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.period_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.template_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.reviewer_name || '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 13, color: '#1f2937' }}>{r.final_score != null ? `${Number(r.final_score)}% (${r.grade || '—'})` : '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${STATUS_BADGE[r.status] || 'badge-pending'}`}>{r.status}</span></td>
                      <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                        <button className="rm-btn-primary" style={{ padding: '5px 12px', fontSize: 12.5 }} onClick={() => setReviewId(r.id)}><i className="bi bi-clipboard-check-fill"></i> {r.status === 'Completed' || !canReview ? 'View' : 'Review'}</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {reviewId != null && <KpiReviewModal assignmentId={reviewId} onClose={() => setReviewId(null)} onSaved={() => { setReviewId(null); fetchRows(); }} />}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
