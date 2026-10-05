'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import EssLayout from '../../components/ess/EssLayout';
import { useDateFormat } from '../../lib/useDateFormat';
import { DonutChart, BarChart, LineChart } from '../../components/charts/Charts';

const STATUS_BADGE: Record<string, string> = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' };
const CLAIM_COLORS: Record<string, string> = { Pending: '#f59e0b', Approved: '#16a34a', Rejected: '#ef4444' };

export default function EssDashboard() {
  const { fmt } = useDateFormat();
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any[]>([]);
  const [leave, setLeave] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/ess/profile').then(r => r.json()).then(j => { if (j.success) setProfile(j.data); });
    fetch('/api/ess/leave-balance').then(r => r.json()).then(j => { if (j.success) setBalance(j.data); });
    fetch('/api/ess/leave').then(r => r.json()).then(j => { if (j.success) setLeave(j.data); });
    fetch('/api/ess/stats').then(r => r.json()).then(j => { if (j.success) setStats(j.data); });
  }, []);

  const tiles = [
    { label: 'My Leave', icon: 'bi-calendar-check', href: '/ess/leave', color: '#3b82f6' },
    { label: 'My Claims', icon: 'bi-receipt', href: '/ess/claims', color: '#16a34a' },
    { label: 'My Overtime', icon: 'bi-clock-history', href: '/ess/overtime', color: '#f59e0b' },
    { label: 'My Expenses', icon: 'bi-wallet2', href: '/ess/expenses', color: '#8b5cf6' },
    { label: 'My Payslips', icon: 'bi-file-earmark-text', href: '/ess/payslips', color: '#06b6d4' },
    { label: 'My KPIs', icon: 'bi-bar-chart-line', href: '/ess/kpi', color: '#db2777' },
  ];

  return (
    <>
      <Head><title>Dashboard | ATLINE Self-Service</title></Head>
      <EssLayout breadcrumb={['Dashboard']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>

            {/* Welcome */}
            <h1 className="page-title">Welcome{profile ? `, ${profile.full_name}` : ''}</h1>
            <p className="page-subtitle">
              {profile ? `${profile.position_name || '—'} · ${profile.department_name || '—'} · ${profile.employee_id}` : 'Your employee self-service portal.'}
            </p>

            {/* Leave balance */}
            {balance.length > 0 && (
              <>
                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eef2f7' }} />
                <div style={{ fontSize: 15, color: '#1f2937', fontWeight: 600, marginBottom: 4 }}>Leave Balance</div>
                <p className="page-subtitle" style={{ marginBottom: 16 }}>Your remaining days for {new Date().getFullYear()}.</p>
                <div className="d-flex flex-wrap gap-3">
                  {balance.map(b => (
                    <div key={b.leave_type_id} className="ess-bal-card" style={{ flex: '1 1 170px', minWidth: 150 }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color }}></span>
                        <span style={{ fontSize: 12.5, color: '#374151' }}>{b.name}</span>
                      </div>
                      {b.unlimited ? (
                        <div style={{ fontSize: 22, fontWeight: 600, color: '#3b82f6' }}>∞</div>
                      ) : (
                        <>
                          <div style={{ fontSize: 24, fontWeight: 600, color: (b.balance ?? 0) > 0 ? '#16a34a' : '#dc2626' }}>{b.balance}<span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}> / {b.entitlement}</span></div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>used {b.used}{b.pending > 0 ? ` · pending ${b.pending}` : ''}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Quick links */}
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eef2f7' }} />
            <div style={{ fontSize: 15, color: '#1f2937', fontWeight: 600, marginBottom: 14 }}>Quick Access</div>
            <div className="d-flex flex-wrap gap-3">
              {tiles.map(t => (
                <Link key={t.label} href={t.href} style={{ textDecoration: 'none', flex: '1 1 180px' }}>
                  <div className="ess-bal-card d-flex align-items-center gap-3" style={{ padding: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${t.color}1a`, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><i className={`bi ${t.icon}`}></i></div>
                    <div style={{ fontSize: 14.5, color: '#1f2937', fontWeight: 500 }}>{t.label}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Charts */}
            {stats && (
              <>
                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eef2f7' }} />
                <div style={{ fontSize: 15, color: '#1f2937', fontWeight: 600, marginBottom: 16 }}>My Insights ({new Date().getFullYear()})</div>
                <div className="d-flex flex-wrap gap-3">
                  <div className="ess-bal-card" style={{ flex: '1 1 280px', minWidth: 260, background: '#fff' }}>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 500, marginBottom: 12 }}>Leave Used by Type</div>
                    <DonutChart
                      data={stats.leaveByType.length ? stats.leaveByType : [{ label: 'No leave taken', value: 1, color: '#e5e7eb' }]}
                      centerValue={String(stats.leaveByType.reduce((s: number, d: any) => s + d.value, 0))}
                      centerLabel="days" />
                  </div>
                  <div className="ess-bal-card" style={{ flex: '1 1 320px', minWidth: 280, background: '#fff' }}>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 500, marginBottom: 12 }}>Leave Days per Month</div>
                    <BarChart data={stats.monthly} color="#3b82f6" valuePrefix="" />
                  </div>
                  {stats.payTrend.length > 0 && (
                    <div className="ess-bal-card" style={{ flex: '1 1 320px', minWidth: 280, background: '#fff' }}>
                      <div style={{ fontSize: 13, color: '#374151', fontWeight: 500, marginBottom: 12 }}>Net Pay Trend</div>
                      <LineChart data={stats.payTrend} color="#16a34a" valuePrefix="RM " />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Recent leave history */}
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eef2f7' }} />
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div style={{ fontSize: 15, color: '#1f2937', fontWeight: 600 }}>Recent Leave History</div>
              <Link href="/ess/leave" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>View all <i className="bi bi-arrow-right"></i></Link>
            </div>
            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Reference</th><th className="rm-th-module">Type</th>
                  <th className="rm-th-module">From</th><th className="rm-th-module">To</th>
                  <th className="rm-th-perm">Days</th><th className="rm-th-perm">Doc</th><th className="rm-th-perm">Status</th>
                </tr></thead>
                <tbody>
                  {leave.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 28, color: '#9ca3af', fontSize: 13 }}>No leave history.</td></tr>
                  ) : leave.slice(0, 6).map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{r.reference_no}</td>
                      <td className="rm-td-module" style={{ color: '#1f2937' }}>{r.leave_type_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.start_date ? fmt(r.start_date) : '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.end_date ? fmt(r.end_date) : '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 13 }}>{r.days ?? '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}>{(r.has_document === 1 || r.has_document === true) ? <a href={`/api/ess/leave?doc=${r.id}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}><i className="bi bi-paperclip"></i></a> : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${STATUS_BADGE[r.status] || 'badge-pending'}`}>{r.status}</span></td>
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
