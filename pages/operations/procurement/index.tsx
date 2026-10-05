'use client';
import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import VendorDirectory from '../../../components/operations/VendorDirectory';
import VendorCategoriesManager from '../../../components/operations/VendorCategoriesManager';

export default function ProcurementPage() {
  const [tab, setTab] = useState<'vendors' | 'categories'>('vendors');

  return (
    <>
      <Head><title>Procurement — Vendor List | SCM Admin</title></Head>
      <AdminLayout breadcrumb={['Operations', 'Procurement']}>
        <PermissionGate moduleKey="ops.procurement">
          <div className="int-tabs mb-4">
            <button className={`int-tab-btn${tab === 'vendors' ? ' active' : ''}`} onClick={() => setTab('vendors')}><i className="bi bi-truck me-1"></i>Vendor Directory</button>
            <button className={`int-tab-btn${tab === 'categories' ? ' active' : ''}`} onClick={() => setTab('categories')}><i className="bi bi-tags-fill me-1"></i>Service Categories</button>
          </div>
          {tab === 'categories' ? <VendorCategoriesManager permKey="ops.procurement" /> : <VendorDirectory permKey="ops.procurement" />}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
