'use client';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import ManagedTable from '../../../components/hr/ManagedTable';

export default function KpiGradeBandsPage() {
  return (
    <>
      <Head><title>KPI Grade Bands | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'KPI', 'Grade Bands']}>
        <PermissionGate moduleKey="hr.kpi.grade_bands">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">KPI Grade Bands</h1>
              <p className="page-subtitle">Score ranges map to a grade and a bonus multiplier (months of basic salary).</p>
            </div>
            <ManagedTable
              api="/api/hr/kpi/grade-bands"
              title="Grade Band"
              moduleKey="hr.kpi.grade_bands"
              searchKeys={['grade', 'label']}
              columns={[
                { key: 'grade', label: 'Grade', render: r => <span className="kpi-grade-chip" style={{ background: r.color || '#3b82f6' }}>{r.grade}</span> },
                { key: 'label', label: 'Label' },
                { key: 'min_score', label: 'Score Range', render: r => `${Number(r.min_score)}% – ${Number(r.max_score)}%` },
                { key: 'bonus_multiplier', label: 'Bonus (× basic)', render: r => `${Number(r.bonus_multiplier)}×` },
              ]}
              fields={[
                { key: 'grade', label: 'Grade', required: true, placeholder: 'e.g. A' },
                { key: 'label', label: 'Label', placeholder: 'e.g. Outstanding' },
                { key: 'min_score', label: 'Min Score (%)', type: 'number', required: true, placeholder: '0' },
                { key: 'max_score', label: 'Max Score (%)', type: 'number', required: true, placeholder: '100' },
                { key: 'bonus_multiplier', label: 'Bonus Multiplier', type: 'number', hint: 'Months of basic salary awarded as bonus', placeholder: 'e.g. 1.5' },
                { key: 'color', label: 'Colour', placeholder: '#16a34a' },
              ]}
            />
          </div>
        </div>
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
