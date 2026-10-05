import Head from 'next/head';
import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import PermissionGate from '../components/PermissionGate';
import { DonutChart, BarChart, LineChart } from '../components/charts/Charts';
import { useDateFormat } from '../lib/useDateFormat';

const DEPT_COLORS = ['#3b82f6', '#16a34a', '#f59e0b', '#8b5cf6', '#06b6d4', '#db2777', '#ef4444', '#0ea5e9', '#84cc16'];

const statCards = [
  { label: 'New Applications',    value: '12',  change: '+3 today',  trend: 'up',      icon: 'bi-clipboard-fill',     color: 'stat-icon-blue'   },
  { label: 'Active Employees',    value: '24',  change: 'No change', trend: 'neutral', icon: 'bi-people-fill',        color: 'stat-icon-green'  },
  { label: 'Pending Leave',       value: '7',   change: '+2 today',  trend: 'up',      icon: 'bi-calendar-check-fill',color: 'stat-icon-amber'  },
  { label: 'Contact Messages',    value: '5',   change: '+5 today',  trend: 'up',      icon: 'bi-envelope-fill',      color: 'stat-icon-purple' },
  { label: 'Open Tenders',        value: '3',   change: '1 closing', trend: 'down',    icon: 'bi-file-earmark-text',  color: 'stat-icon-red'    },
  { label: 'Newsletter Subs',     value: '148', change: '+12 week',  trend: 'up',      icon: 'bi-megaphone-fill',     color: 'stat-icon-teal'   },
];

const recentApplications = [
  { name: 'Ahmad Faizal bin Razak',  type: 'Career',            role: 'Network Engineer',    date: '2026-05-27', status: 'pending' },
  { name: 'Siti Nurhaliza Binti Ali',type: 'Procurement',       role: 'Supplier Registration',date: '2026-05-27', status: 'review' },
  { name: 'Tan Wei Ming',            type: 'Strategic Partner', role: 'Gold Partner',         date: '2026-05-26', status: 'pending' },
  { name: 'Mohd Hafiz bin Ismail',   type: 'Career',            role: 'ICT Project Manager',  date: '2026-05-26', status: 'approved' },
  { name: 'Nurul Ain binti Hassan',  type: 'Procurement',       role: 'Supplier Registration',date: '2026-05-25', status: 'rejected' },
];

const recentMessages = [
  { from: 'Encik Razif',    subject: 'Network infrastructure inquiry',    time: '2h ago',  status: 'new' },
  { from: 'Puan Salmah',   subject: 'Request for quotation — cabling',   time: '4h ago',  status: 'new' },
  { from: 'Mr. David Lim', subject: 'Partnership discussion',             time: '6h ago',  status: 'review' },
  { from: 'Encik Hafifi',  subject: 'Training workshop availability',     time: '1d ago',  status: 'review' },
];

const activity = [
  { text: <><strong>Ahmad Faizal</strong> submitted a Career application for Network Engineer</>, time: '10 min ago', dot: 'activity-dot-blue' },
  { text: <><strong>Admin</strong> approved supplier registration for Syarikat ABC Sdn Bhd</>, time: '1h ago', dot: 'activity-dot-green' },
  { text: <><strong>Tender ATL-T-2026-003</strong> is closing in 2 days</>, time: '2h ago', dot: 'activity-dot-amber' },
  { text: <><strong>5 new messages</strong> received via Contact form</>, time: '3h ago', dot: 'activity-dot-purple' },
  { text: <><strong>Siti Nurhaliza</strong> submitted a Procurement registration</>, time: '5h ago', dot: 'activity-dot-blue' },
  { text: <><strong>Admin</strong> updated FAQ content on website</>, time: '1d ago', dot: 'activity-dot-green' },
];

const quickActions = [
  { icon: 'bi-person-plus-fill',    label: 'Add Employee',    href: '/hr/employee' },
  { icon: 'bi-file-earmark-plus',   label: 'New Tender',      href: '/application/tender' },
  { icon: 'bi-envelope-open-fill',  label: 'View Messages',   href: '/web/contact' },
  { icon: 'bi-images',              label: 'Upload Gallery',  href: '/web/resources/gallery' },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending:  'badge-status badge-pending',
    approved: 'badge-status badge-approved',
    rejected: 'badge-status badge-rejected',
    review:   'badge-status badge-review',
    new:      'badge-status badge-new',
  };
  return map[status] || 'badge-status badge-review';
};

export default function Dashboard() {
  const { fmt } = useDateFormat();
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    fetch('/api/hr/dashboard-stats').then(r => r.json()).then(j => { if (j.success) setStats(j.data); }).catch(() => {});
  }, []);
  return (
    <>
      <Head><title>Dashboard — ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Dashboard']}>
        <PermissionGate moduleKey="dashboard">

        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>

            {/* Page header */}
            <div className="page-header">
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Welcome back, Admin. Here&apos;s what&apos;s happening today.</p>
            </div>

            {/* Stat cards */}
            <div className="stat-cards">
              {statCards.map(s => (
                <div key={s.label} className="stat-card">
                  <div className={`stat-icon ${s.color}`}>
                    <i className={`bi ${s.icon}`}></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                    <div className={`stat-change stat-${s.trend}`}>
                      {s.trend === 'up'      && <i className="bi bi-arrow-up-short"></i>}
                      {s.trend === 'down'    && <i className="bi bi-arrow-down-short"></i>}
                      {s.trend === 'neutral' && <i className="bi bi-dash"></i>}
                      {s.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            {stats && (
              <div style={{ marginBottom: 20 }}>
                <div className="d-flex flex-wrap gap-3">
                  <div className="dash-card" style={{ flex: '1 1 300px', minWidth: 280 }}>
                    <div className="dash-card-header"><span className="dash-card-title">Employees by Department</span></div>
                    <div className="dash-card-body">
                      <DonutChart
                        data={(stats.byDept.length ? stats.byDept : [{ label: 'None', value: 1 }]).map((d: any, i: number) => ({ ...d, color: DEPT_COLORS[i % DEPT_COLORS.length] }))}
                        centerValue={String(stats.counts.employees)} centerLabel="staff" />
                    </div>
                  </div>
                  <div className="dash-card" style={{ flex: '1 1 320px', minWidth: 300 }}>
                    <div className="dash-card-header"><span className="dash-card-title">Leave Applications per Month</span></div>
                    <div className="dash-card-body"><BarChart data={stats.monthly} color="#3b82f6" /></div>
                  </div>
                  <div className="dash-card" style={{ flex: '1 1 280px', minWidth: 260 }}>
                    <div className="dash-card-header"><span className="dash-card-title">Pending Approvals</span></div>
                    <div className="dash-card-body"><BarChart data={stats.pendingByModule} color="#f59e0b" /></div>
                  </div>
                  {stats.payrollTrend.length > 0 && (
                    <div className="dash-card" style={{ flex: '1 1 320px', minWidth: 300 }}>
                      <div className="dash-card-header"><span className="dash-card-title">Payroll Net Total Trend</span></div>
                      <div className="dash-card-body"><LineChart data={stats.payrollTrend} color="#16a34a" valuePrefix="RM " /></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main grid */}
            <div className="dash-grid-3" style={{ marginBottom: 20 }}>

              {/* Recent Applications */}
              <div className="dash-card">
                <div className="dash-card-header">
                  <span className="dash-card-title">Recent Applications</span>
                  <a href="/application/career" className="dash-card-action">View all</a>
                </div>
                <div className="dash-card-body" style={{ padding: '0 22px' }}>
                  <table className="recent-table">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApplications.map((a, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{a.name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.role}</div>
                          </td>
                          <td style={{ fontSize: 13 }}>{a.type}</td>
                          <td style={{ fontSize: 12, color: '#94a3b8' }}>{fmt(a.date)}</td>
                          <td>
                            <span className={statusBadge(a.status)}>
                              {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Quick Actions */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <span className="dash-card-title">Quick Actions</span>
                  </div>
                  <div className="dash-card-body">
                    <div className="quick-actions">
                      {quickActions.map(q => (
                        <a key={q.label} href={q.href} style={{ textDecoration: 'none' }}>
                          <div className="quick-action">
                            <i className={`bi ${q.icon}`}></i>
                            <span>{q.label}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Messages */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <span className="dash-card-title">Contact Messages</span>
                    <a href="/web/contact" className="dash-card-action">View all</a>
                  </div>
                  <div className="dash-card-body" style={{ padding: '0 22px' }}>
                    {recentMessages.map((m, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 0', borderBottom: i < recentMessages.length - 1 ? '1px solid #f8fafc' : 'none',
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: '#eff6ff', color: '#3b82f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, flexShrink: 0,
                        }}>
                          <i className="bi bi-person-fill"></i>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{m.from}</div>
                          <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{m.time}</span>
                          <span className={statusBadge(m.status)}>
                            {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Activity Feed */}
            <div className="dash-card">
              <div className="dash-card-header">
                <span className="dash-card-title">Recent Activity</span>
                <a href="/logs" className="dash-card-action">View logs</a>
              </div>
              <div className="dash-card-body">
                <div className="activity-feed">
                  {activity.map((a, i) => (
                    <div key={i} className="activity-item">
                      <div className={`activity-dot ${a.dot}`}></div>
                      <div className="activity-text">{a.text}</div>
                      <div className="activity-time">{a.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        </PermissionGate>
      </AdminLayout>
    </>
  );
}

import type { GetServerSideProps } from 'next';
import { requireAuth } from '../lib/auth';

export const getServerSideProps: GetServerSideProps = async (context) => {
  return requireAuth(context);
};