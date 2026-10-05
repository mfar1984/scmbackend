'use client';
import { useState } from 'react';
import Head from 'next/head';
import ModuleSettingsLayout from '../../../components/hr/ModuleSettingsLayout';
import ClaimTypesManager from '../../../components/hr/ClaimTypesManager';
import ApprovalChain from '../../../components/hr/ApprovalChain';

const TABS = [
  { key: 'types', label: 'Claim Types', icon: 'bi-receipt' },
  { key: 'approval', label: 'Approval Workflow', icon: 'bi-diagram-3-fill' },
];

export default function ClaimSettingsPage() {
  const [tab, setTab] = useState('types');
  return (
    <>
      <Head><title>Claim Settings | ATLINE Admin</title></Head>
      <ModuleSettingsLayout
        moduleLabel="Claim"
        breadcrumb={['Human Resources', 'Claim', 'Settings']}
        tabs={TABS} activeTab={tab} onTab={setTab}
        moduleKey={tab === 'approval' ? 'hr.claim.settings.approval' : 'hr.claim.settings.types'}
      >
        {tab === 'types' && <ClaimTypesManager moduleKey="hr.claim.settings.types" />}
        {tab === 'approval' && <ApprovalChain module="claim" label="Claim" moduleKey="hr.claim.settings.approval" />}
      </ModuleSettingsLayout>
    </>
  );
}
