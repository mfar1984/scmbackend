'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import EssLayout from '../../components/ess/EssLayout';

type Row = { id: number; period_name: string; template_name: string; final_score: number; grade: string | null; grade_label: string | null; reviewer_remarks: string | null };
const GRADE_COLOR: Record<string, string> = { A: '#16a34a', B: '#3b82f6', C: '#f59e0b', D: '#f97316', E: '#ef4444' };

export default function EssKpi() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ess/kpi').then(r => r.json()).then(j => { if (j.success) setRows(j.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Head><title>My KPIs | ATLINE Self-Service</title></Head>
      <EssLayout breadcrumb={['My KPIs']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4"><h1 className="page-title">My KPIs</h1><p className="page-subtitle">Your performance appraisal results.</p></div>
            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Period</th><th className="rm-th-module">Template</th>
                  <th className="rm-th-perm">Score</th><th className="rm-th-perm">Grade</th><th className="rm-th-module">Remarks</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-bar-chart-line" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No KPI results yet.</td></tr>
                  ) : rows.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ color: '#1f2937' }}>{r.period_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.template_name || '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 14, color: '#1f2937' }}>{Number(r.final_score)}%</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}>{r.grade ? <span className="kpi-grade-chip" style={{ background: GRADE_COLOR[r.grade] || '#3b82f6' }} title={r.grade_label || ''}>{r.grade}</span> : '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.reviewer_remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </EssLayout>
    </>
  );
}
