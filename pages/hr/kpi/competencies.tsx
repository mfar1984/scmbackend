'use client';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import ManagedTable from '../../../components/hr/ManagedTable';

const CATEGORIES = ['Core', 'Functional', 'Leadership', 'General'];

export default function KpiCompetenciesPage() {
  return (
    <>
      <Head><title>KPI Competencies | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'KPI', 'Competencies']}>
        <PermissionGate moduleKey="hr.kpi.competencies">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">KPI Competencies</h1>
              <p className="page-subtitle">Reusable evaluation criteria used to build appraisal templates.</p>
            </div>
            <ManagedTable
              api="/api/hr/kpi/competencies"
              title="Competency"
              moduleKey="hr.kpi.competencies"
              searchKeys={['name', 'category']}
              columns={[
                { key: 'name', label: 'Competency' },
                { key: 'category', label: 'Category', render: r => <span className="usr-role-badge">{r.category}</span> },
                { key: 'description', label: 'Description', render: r => <span style={{ color: '#6b7280' }}>{r.description || '—'}</span> },
              ]}
              fields={[
                { key: 'name', label: 'Competency Name', required: true, placeholder: 'e.g. Quality of Work' },
                { key: 'category', label: 'Category', type: 'select', options: CATEGORIES.map(c => ({ value: c, label: c })) },
                { key: 'description', label: 'Description', type: 'textarea', placeholder: 'What this competency measures' },
              ]}
              defaults={{ category: 'Core' }}
            />
          </div>
        </div>
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
