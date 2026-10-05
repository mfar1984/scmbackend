'use client';
import Head from 'next/head';
import AdminLayout from '../components/AdminLayout';
import AccountSettings from '../components/AccountSettings';

export default function ProfilePage() {
  return (
    <>
      <Head><title>My Profile — ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['My Profile']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">My Profile</h1>
              <p className="page-subtitle">Manage your own account details and password.</p>
            </div>
            <AccountSettings />
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
