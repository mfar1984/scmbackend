'use client';
import { useState } from 'react';
import Head from 'next/head';
import ModuleSettingsLayout from '../../../components/hr/ModuleSettingsLayout';
import LeaveTypesManager from '../../../components/hr/LeaveTypesManager';
import ApprovalChain from '../../../components/hr/ApprovalChain';

const TABS = [
  { key: 'types', label: 'Leave Types', icon: 'bi-calendar-check-fill' },
  { key: 'approval', label: 'Approval Workflow', icon: 'bi-diagram-3-fill' },
];

export default function LeaveSettingsPage() {
  const [tab, setTab] = useState('types');
  return (
    <>
      <Head><title>Leave Settings | ATLINE Admin</title></Head>
      <ModuleSettingsLayout
        moduleLabel="Leave"
        breadcrumb={['Human Resources', 'Leave', 'Settings']}
        tabs={TABS} activeTab={tab} onTab={setTab}
        moduleKey={tab === 'approval' ? 'hr.leave.settings.approval' : 'hr.leave.settings.types'}
      >
        {tab === 'types' && <LeaveTypesManager moduleKey="hr.leave.settings.types" />}
        {tab === 'approval' && <ApprovalChain module="leave" label="Leave" moduleKey="hr.leave.settings.approval" />}
      </ModuleSettingsLayout>
    </>
  );
}
