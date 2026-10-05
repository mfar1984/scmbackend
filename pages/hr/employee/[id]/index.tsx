'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import { useDateFormat } from '../../../../lib/useDateFormat';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: 'badge-approved', Probation: 'badge-pending',
    Resigned: 'badge-rejected', Terminated: 'badge-rejected',
  };
  return <span className={`badge-status ${map[status] || 'badge-pending'}`}>{status}</span>;
}

function Section({ title, icon, rows }: { title: string; icon: string; rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="int-card">
      <div className="int-card-title"><i className={`bi ${icon}`}></i> {title}</div>
      {rows.map((r, i) => (
        <div key={r.label} className={`usr-form-row${i === rows.length - 1 ? ' usr-form-row-last' : ''}`}>
          <span className="usr-form-label" style={{ paddingTop: 6 }}>{r.label}</span>
          <span style={{ flex: 1, fontSize: 13.5, color: '#374151', paddingTop: 6 }}>{r.value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
}

export default function EmployeeViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const { fmt } = useDateFormat();
  const [emp, setEmp]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/hr/employees/${id}`)
      .then(r => r.json())
      .then(json => { if (json.success) setEmp(json.data); else setError(json.message || 'Not found.'); })
      .catch(() => setError('Failed to load employee.'))
      .finally(() => setLoading(false));
  }, [id]);

  const dash = (v: any) => (v === null || v === undefined || v === '') ? '—' : v;
  const money = (v: any) => (v == null || v === '') ? '—' : `RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <>
      <Head><title>{emp ? emp.full_name : 'Employee'} | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Employee', emp ? emp.full_name : 'Details']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
                <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading employee...
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>
            ) : emp && (
              <>
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="usr-show-avatar">{(emp.full_name || '?').charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="usr-show-name">{emp.full_name}</div>
                      <div className="usr-show-role" style={{ fontFamily: 'monospace' }}>{emp.employee_id}</div>
                      <StatusBadge status={emp.employee_status} />
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <Link href="/hr/employee" style={{ textDecoration: 'none' }}>
                      <button className="rm-btn-outline"><i className="bi bi-arrow-left"></i> Back</button>
                    </Link>
                    <Link href={`/hr/employee/${emp.id}/edit`} style={{ textDecoration: 'none' }}>
                      <button className="rm-btn-primary"><i className="bi bi-pencil-fill"></i> Edit</button>
                    </Link>
                  </div>
                </div>

                <Section title="Personal Information" icon="bi-person-fill" rows={[
                  { label: 'NRIC / Passport No.', value: dash(emp.nric_passport) },
                  { label: 'Gender',              value: dash(emp.gender) },
                  { label: 'Marital Status',      value: dash(emp.marital_status) },
                  { label: 'Race',                value: dash(emp.race) },
                  { label: 'Religion',            value: dash(emp.religion) },
                  { label: 'Nationality',         value: dash(emp.nationality) },
                  { label: 'Date of Birth',       value: emp.date_of_birth ? fmt(emp.date_of_birth) : '—' },
                  { label: 'Email Address',       value: dash(emp.email) },
                  { label: 'Phone Number',        value: dash(emp.phone) },
                ]} />

                <Section title="Address" icon="bi-geo-alt-fill" rows={[
                  { label: 'Address',  value: dash(emp.address) },
                  { label: 'City',     value: dash(emp.city) },
                  { label: 'State',    value: dash(emp.state) },
                  { label: 'Postcode', value: dash(emp.postcode) },
                  { label: 'Country',  value: dash(emp.country) },
                ]} />

                <Section title="Emergency Contact" icon="bi-telephone-fill" rows={[
                  { label: 'Contact Name', value: dash(emp.emergency_name) },
                  { label: 'Relationship', value: dash(emp.emergency_relationship) },
                  { label: 'Contact Phone', value: dash(emp.emergency_phone) },
                ]} />

                <Section title="Employment Information" icon="bi-briefcase-fill" rows={[
                  { label: 'Department',      value: dash(emp.department_name) },
                  { label: 'Position',        value: dash(emp.position_name) },
                  { label: 'Employment Type', value: dash(emp.employment_type_name) },
                  { label: 'Work Location',   value: dash(emp.work_location) },
                  { label: 'Reporting To',    value: dash(emp.reporting_to) },
                  { label: 'Join Date',       value: emp.join_date ? fmt(emp.join_date) : '—' },
                  { label: 'Confirmation Date', value: emp.confirm_date ? fmt(emp.confirm_date) : '—' },
                  { label: 'Employee Status', value: <StatusBadge status={emp.employee_status} /> },
                ]} />

                <Section title="Salary & Bank Information" icon="bi-cash-stack" rows={[
                  { label: 'Basic Salary',     value: money(emp.basic_salary) },
                  { label: 'Bank',             value: dash(emp.bank_name) },
                  { label: 'Bank Account No.', value: dash(emp.bank_account_no) },
                  { label: 'EPF No.',          value: dash(emp.epf_no) },
                  { label: 'SOCSO No.',        value: dash(emp.socso_no) },
                  { label: 'Income Tax No.',   value: dash(emp.income_tax_no) },
                ]} />
              </>
            )}

          </div>
        </div>
      </AdminLayout>
    </>
  );
}
