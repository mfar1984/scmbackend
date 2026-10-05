'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import EmployeeForm, { EmployeeFormData } from '../../../../components/EmployeeForm';

function toDateInput(v: any): string {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function EditEmployeePage() {
  const router = useRouter();
  const { id } = router.query;
  const [initial, setInitial] = useState<Partial<EmployeeFormData> | null>(null);
  const [code, setCode]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/hr/employees/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data;
          setCode(d.employee_id);
          setInitial({
            full_name: d.full_name || '', nric_passport: d.nric_passport || '',
            gender: d.gender || '', marital_status: d.marital_status || '',
            race: d.race || '', religion: d.religion || '',
            nationality: d.nationality || '', date_of_birth: toDateInput(d.date_of_birth),
            email: d.email || '', phone: d.phone || '', address: d.address || '',
            city: d.city || '', state: d.state || '', postcode: d.postcode || '',
            country: d.country || '',
            emergency_name: d.emergency_name || '', emergency_relationship: d.emergency_relationship || '',
            emergency_phone: d.emergency_phone || '',
            department_id: d.department_id ? String(d.department_id) : '',
            position_id: d.position_id ? String(d.position_id) : '',
            employment_type_id: d.employment_type_id ? String(d.employment_type_id) : '',
            join_date: toDateInput(d.join_date), confirm_date: toDateInput(d.confirm_date),
            work_location: d.work_location || '', reporting_to: d.reporting_to || '',
            employee_status: d.employee_status || 'Active',
            basic_salary: d.basic_salary != null ? String(d.basic_salary) : '',
            fixed_allowance: d.fixed_allowance != null ? String(d.fixed_allowance) : '',
            bank_id: d.bank_id ? String(d.bank_id) : '',
            bank_account_no: d.bank_account_no || '', epf_no: d.epf_no || '',
            socso_no: d.socso_no || '', income_tax_no: d.income_tax_no || '',
          });
        } else setError(json.message || 'Employee not found.');
      })
      .catch(() => setError('Failed to load employee.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <Head><title>Edit Employee | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Employee', 'Edit Employee']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Edit Employee</h1>
              <p className="page-subtitle">Update employee record details.</p>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
                <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading employee...
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>
            ) : initial && (
              <EmployeeForm mode="edit" employeeId={parseInt(id as string)} employeeCode={code} initial={initial} />
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
