'use client';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import PeriodAmountManager from '../../../components/hr/payroll/PeriodAmountManager';

const BONUS_TYPES = ['Performance Bonus', 'Annual Bonus', 'Festival Bonus', 'Project Completion Bonus', 'Attendance Bonus', 'Other'];

export default function BonusPage() {
  return (
    <>
      <Head><title>Bonus Management | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Payroll', 'Bonus Management']}>
        <PermissionGate moduleKey="hr.payroll.bonus">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <PeriodAmountManager
              api="/api/hr/payroll/bonus"
              title="Bonus Management"
              moduleKey="hr.payroll.bonus"
              subtitle="Award bonuses to employees for a payroll period. Approved bonuses flow into the payslip. Performance bonuses can be auto-generated from KPI results."
              typeLabel="Bonus Type"
              typeKey="bonus_type"
              typeOptions={BONUS_TYPES}
              emptyIcon="bi-trophy"
            />
          </div>
        </div>
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
