'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';

type Result = {
  id: number; reference_no: string | null; employee_name: string | null; employee_code: string | null;
  period_name: string | null; basic_salary: number | null; final_score: number;
  grade: string | null; grade_label: string | null; bonus_multiplier: number; bonus_generated: number;
};

const GRADE_COLOR: Record<string, string> = { A: '#16a34a', B: '#3b82f6', C: '#f59e0b', D: '#f97316', E: '#ef4444' };

export default function KpiResultsPage() {
  const { can } = usePermissions();
  const canGenerate = can('hr.kpi.results', 'Update');
  const [rows, setRows] = useState<Result[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genRow, setGenRow] = useState<Result | null>(null);
  const [genPeriod, setGenPeriod] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/hr/kpi/results')).json(); if (j.success) setRows(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    fetchRows();
    fetch('/api/hr/payroll/periods-list').then(r => r.json()).then(j => { if (j.success) setPeriods(j.data); });
  }, [fetchRows]);

  const money = (v: any) => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 });
  const bonusPreview = genRow ? (parseFloat(String(genRow.basic_salary)) || 0) * (parseFloat(String(genRow.bonus_multiplier)) || 0) : 0;

  const generate = async () => {
    if (!genRow) return;
    if (!genPeriod) { setError('Please select a payroll period.'); return; }
    setBusy(true); setError('');
    try {
      const j = await (await fetch('/api/hr/kpi/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate_bonus', result_id: genRow.id, period_id: genPeriod }) })).json();
      if (j.success) { setGenRow(null); setGenPeriod(''); fetchRows(); alert(`Bonus of RM ${money(j.amount)} generated successfully.`); }
      else setError(j.message || 'Failed.');
    } catch { setError('Network error.'); } finally { setBusy(false); }
  };

  const filtered = rows.filter(r => [r.employee_name, r.period_name].some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase())));

  return (
    <>
      <Head><title>KPI Results | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'KPI', 'Results']}>
        <PermissionGate moduleKey="hr.kpi.results">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4"><h1 className="page-title">KPI Results</h1><p className="page-subtitle">Final appraisal scores and grades. Generate a performance bonus tied to a payroll period.</p></div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search employee or period…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Employee</th><th className="rm-th-module">Period</th>
                  <th className="rm-th-perm">Final Score</th><th className="rm-th-perm">Grade</th>
                  <th className="rm-th-perm">Bonus (× basic)</th><th className="rm-th-perm">Bonus</th><th className="rm-th-perm">Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-graph-up-arrow" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No results yet. Finalize a review first.</td></tr>
                  ) : filtered.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module"><div style={{ color: '#1f2937' }}>{r.employee_name || '—'}</div>{r.employee_code && <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.employee_code}</div>}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.period_name || '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 14, color: '#1f2937' }}>{Number(r.final_score)}%</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}>{r.grade ? <span className="kpi-grade-chip" style={{ background: GRADE_COLOR[r.grade] || '#3b82f6' }} title={r.grade_label || ''}>{r.grade}</span> : '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>{Number(r.bonus_multiplier)}×</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}>{r.bonus_generated ? <span className="badge-status badge-approved">Generated</span> : <span className="badge-status badge-pending">—</span>}</td>
                      <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                        {canGenerate && !r.bonus_generated && Number(r.bonus_multiplier) > 0 && (
                          <button className="rm-btn-primary" style={{ padding: '5px 12px', fontSize: 12.5, background: '#16a34a' }} onClick={() => { setGenRow(r); setError(''); }}><i className="bi bi-trophy-fill"></i> Generate Bonus</button>
                        )}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {genRow && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" style={{ maxWidth: 480 }}>
              <div className="usr-modal-header"><div><p className="usr-modal-title">Generate Performance Bonus</p></div><button className="usr-modal-close" onClick={() => setGenRow(null)}><i className="bi bi-x-lg"></i></button></div>
              <div className="usr-modal-body">
                {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
                <div className="pr-approve-row"><span className="pr-approve-label">Employee</span><span className="pr-approve-value">{genRow.employee_name}</span></div>
                <div className="pr-approve-row"><span className="pr-approve-label">Grade / Score</span><span className="pr-approve-value">{genRow.grade} · {Number(genRow.final_score)}%</span></div>
                <div className="pr-approve-row"><span className="pr-approve-label">Basic Salary</span><span className="pr-approve-value">RM {money(genRow.basic_salary)}</span></div>
                <div className="pr-approve-row"><span className="pr-approve-label">Bonus ({Number(genRow.bonus_multiplier)}× basic)</span><span className="pr-approve-value" style={{ color: '#16a34a' }}>RM {money(bonusPreview)}</span></div>
                <div style={{ marginTop: 14 }}>
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Payroll Period <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="rm-input" value={genPeriod} onChange={e => setGenPeriod(e.target.value)}><option value="">Select period...</option>{periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>The bonus will appear in this period&apos;s payslip when processed.</div>
                </div>
              </div>
              <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setGenRow(null)} disabled={busy}>Cancel</button><button className="rm-btn-primary" style={{ background: '#16a34a' }} onClick={generate} disabled={busy}>{busy ? <><span className="spinner-border spinner-border-sm me-1"></span> Generating...</> : <><i className="bi bi-trophy-fill"></i> Generate Bonus</>}</button></div>
            </div>
          </div>
        )}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
