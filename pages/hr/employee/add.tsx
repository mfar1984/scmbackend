'use client';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import EmployeeForm from '../../../components/EmployeeForm';

export default function AddEmployeePage() {
  return (
    <>
      <Head><title>Add Employee | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Employee', 'Add Employee']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Add Employee</h1>
              <p className="page-subtitle">Create a new employee record. The Employee ID is generated automatically.</p>
            </div>
            <EmployeeForm mode="create" />
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
