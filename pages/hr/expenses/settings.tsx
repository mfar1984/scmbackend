'use client';
import { useState } from 'react';
import Head from 'next/head';
import ModuleSettingsLayout from '../../../components/hr/ModuleSettingsLayout';
import ManagedTable from '../../../components/hr/ManagedTable';
import ApprovalChain from '../../../components/hr/ApprovalChain';

const TABS = [
  { key: 'categories', label: 'Expense Categories', icon: 'bi-wallet2' },
  { key: 'approval', label: 'Approval Workflow', icon: 'bi-diagram-3-fill' },
];

export default function ExpensesSettingsPage() {
  const [tab, setTab] = useState('categories');
  return (
    <>
      <Head><title>Expenses Settings | ATLINE Admin</title></Head>
      <ModuleSettingsLayout
        moduleLabel="Expenses"
        breadcrumb={['Human Resources', 'Expenses', 'Settings']}
        tabs={TABS} activeTab={tab} onTab={setTab}
        moduleKey={tab === 'approval' ? 'hr.expenses.settings.approval' : 'hr.expenses.settings.categories'}
      >
        {tab === 'categories' && (
          <ManagedTable
            api="/api/hr/expense-categories"
            title="Expense Category"
            moduleKey="hr.expenses.settings.categories"
            columns={[
              { key: 'name', label: 'Category' },
              { key: 'description', label: 'Description', render: r => r.description || '—' },
            ]}
            fields={[
              { key: 'name', label: 'Category Name', required: true, placeholder: 'e.g. Office Supplies' },
              { key: 'description', label: 'Description', type: 'textarea' },
            ]}
          />
        )}
        {tab === 'approval' && <ApprovalChain module="expenses" label="Expenses" moduleKey="hr.expenses.settings.approval" />}
      </ModuleSettingsLayout>
    </>
  );
}
