'use client';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import PeriodAmountManager from '../../../components/hr/payroll/PeriodAmountManager';

const COMMISSION_TYPES = ['Sales Commission', 'Referral Commission', 'Project Commission', 'Performance Commission', 'Other'];

export default function CommissionPage() {
  return (
    <>
      <Head><title>Commission Management | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Payroll', 'Commission Management']}>
        <PermissionGate moduleKey="hr.payroll.commission">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <PeriodAmountManager
              api="/api/hr/payroll/commission"
              title="Commission Management"
              moduleKey="hr.payroll.commission"
              subtitle="Record employee commissions for a payroll period. Approved commissions flow into the payslip."
              typeLabel="Commission Type"
              typeKey="commission_type"
              typeOptions={COMMISSION_TYPES}
              emptyIcon="bi-percent"
            />
          </div>
        </div>
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
