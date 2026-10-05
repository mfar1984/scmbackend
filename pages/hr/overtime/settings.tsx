'use client';
import { useState } from 'react';
import Head from 'next/head';
import ModuleSettingsLayout from '../../../components/hr/ModuleSettingsLayout';
import ManagedTable from '../../../components/hr/ManagedTable';
import ApprovalChain from '../../../components/hr/ApprovalChain';

const TABS = [
  { key: 'rates', label: 'Overtime Rates', icon: 'bi-clock-history' },
  { key: 'approval', label: 'Approval Workflow', icon: 'bi-diagram-3-fill' },
];

export default function OvertimeSettingsPage() {
  const [tab, setTab] = useState('rates');
  return (
    <>
      <Head><title>Overtime Settings | ATLINE Admin</title></Head>
      <ModuleSettingsLayout
        moduleLabel="Overtime"
        breadcrumb={['Human Resources', 'Overtime', 'Settings']}
        tabs={TABS} activeTab={tab} onTab={setTab}
        moduleKey={tab === 'approval' ? 'hr.overtime.settings.approval' : 'hr.overtime.settings.rates'}
      >
        {tab === 'rates' && (
          <ManagedTable
            api="/api/hr/overtime-rates"
            title="Overtime Rate"
            moduleKey="hr.overtime.settings.rates"
            columns={[
              { key: 'name', label: 'Rate Name' },
              { key: 'multiplier', label: 'Multiplier', render: r => `${Number(r.multiplier).toFixed(2)}x` },
              { key: 'applies_to', label: 'Applies To', render: r => ({ normal: 'Normal Day', rest_day: 'Weekend / Rest Day', holiday: 'Public Holiday' } as any)[r.applies_to] || r.applies_to },
              { key: 'description', label: 'Description', render: r => r.description || '—' },
            ]}
            fields={[
              { key: 'name', label: 'Rate Name', required: true, placeholder: 'e.g. Rest Day' },
              { key: 'multiplier', label: 'Multiplier', type: 'number', placeholder: '2.0', hint: 'e.g. 2.0 means 2× hourly rate' },
              { key: 'applies_to', label: 'Applies To', type: 'select', hint: 'Used to auto-suggest the rate based on the overtime date', options: [
                { value: 'normal', label: 'Normal Day' },
                { value: 'rest_day', label: 'Weekend / Rest Day' },
                { value: 'holiday', label: 'Public Holiday' },
              ] },
              { key: 'description', label: 'Description', type: 'textarea' },
            ]}
            defaults={{ applies_to: 'normal' }}
          />
        )}
        {tab === 'approval' && <ApprovalChain module="overtime" label="Overtime" moduleKey="hr.overtime.settings.approval" />}
      </ModuleSettingsLayout>
    </>
  );
}
