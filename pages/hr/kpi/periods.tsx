'use client';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import ManagedTable from '../../../components/hr/ManagedTable';
import { useDateFormat } from '../../../lib/useDateFormat';

const CYCLES = ['Annual', 'Half-Yearly', 'Quarterly', 'Monthly', 'Probation'];

export default function KpiPeriodsPage() {
  const { fmt } = useDateFormat();
  return (
    <>
      <Head><title>KPI Periods | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'KPI', 'Periods']}>
        <PermissionGate moduleKey="hr.kpi.periods">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">KPI Periods</h1>
              <p className="page-subtitle">Appraisal review cycles. Assignments are created against an open period.</p>
            </div>
            <ManagedTable
              api="/api/hr/kpi/periods"
              title="KPI Period"
              moduleKey="hr.kpi.periods"
              showStatus={false}
              searchKeys={['name', 'cycle']}
              columns={[
                { key: 'name', label: 'Period Name' },
                { key: 'cycle', label: 'Cycle', render: r => <span className="usr-role-badge">{r.cycle}</span> },
                { key: 'start_date', label: 'Start', render: r => r.start_date ? fmt(r.start_date) : '—' },
                { key: 'end_date', label: 'End', render: r => r.end_date ? fmt(r.end_date) : '—' },
                { key: 'status', label: 'Status', render: r => <span className={`badge-status ${r.status === 'Open' ? 'badge-approved' : 'badge-rejected'}`}>{r.status}</span> },
              ]}
              fields={[
                { key: 'name', label: 'Period Name', required: true, placeholder: 'e.g. Annual Review 2026' },
                { key: 'cycle', label: 'Cycle', type: 'select', options: CYCLES.map(c => ({ value: c, label: c })) },
                { key: 'start_date', label: 'Start Date', type: 'date' },
                { key: 'end_date', label: 'End Date', type: 'date' },
                { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'].map(s => ({ value: s, label: s })) },
              ]}
              defaults={{ cycle: 'Annual', status: 'Open' }}
            />
          </div>
        </div>
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
