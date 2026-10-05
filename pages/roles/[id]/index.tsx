import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import PermissionMatrix from '../../../components/PermissionMatrix';
import { useDateFormat } from '../../../lib/useDateFormat';

type RoleDetail = {
  id: number;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  users: number;
  created_at: string;
  matrix: Record<string, Record<string, boolean>>;
};

export default function RoleViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const { fmt } = useDateFormat();
  const [role, setRole]       = useState<RoleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/roles/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setRole(json.data);
        else setError(json.message || 'Role not found.');
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AdminLayout breadcrumb={['Settings', 'Roles Management']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !role) {
    return (
      <>
        <Head><title>Role Not Found — ATLINE Admin</title></Head>
        <AdminLayout breadcrumb={['Settings', 'Roles Management', 'Not Found']}>
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-body" style={{ padding: 24, textAlign: 'center' }}>
              <i className="bi bi-exclamation-circle" style={{ fontSize: 40, color: '#ef4444', display: 'block', marginBottom: 12 }}></i>
              <h2 style={{ fontSize: 18, color: '#1f2937', marginBottom: 8 }}>Role Not Found</h2>
              <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 20 }}>{error || 'The role does not exist.'}</p>
              <Link href="/roles" className="rm-btn-primary" style={{ textDecoration: 'none' }}>
                <i className="bi bi-arrow-left"></i> Back to Roles
              </Link>
            </div>
          </div>
        </AdminLayout>
      </>
    );
  }

  return (
    <>
      <Head><title>{role.name} — ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Settings', 'Roles Management', role.name]}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <Link href="/roles" className="rm-back-btn"><i className="bi bi-arrow-left"></i></Link>
                  <h1 className="page-title" style={{ margin: 0 }}>{role.name}</h1>
                  <span className={`badge-status ${role.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>
                    {role.status}
                  </span>
                </div>
                <p className="page-subtitle">Read-only view of this role and its permission matrix.</p>
              </div>
              <Link href={`/roles/${role.id}/edit`} className="rm-btn-primary" style={{ textDecoration: 'none' }}>
                <i className="bi bi-pencil-fill"></i> Edit Role
              </Link>
            </div>

            {/* Info cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="rm-info-card">
                  <div className="rm-info-label"><i className="bi bi-person-badge-fill"></i> Role Name</div>
                  <div className="rm-info-value">{role.name}</div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="rm-info-card">
                  <div className="rm-info-label"><i className="bi bi-toggle-on"></i> Status</div>
                  <div className="rm-info-value">
                    <span className={`badge-status ${role.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>
                      {role.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="rm-info-card">
                  <div className="rm-info-label"><i className="bi bi-people-fill"></i> Assigned Users</div>
                  <div className="rm-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="bi bi-people-fill" style={{ color: '#3b82f6', fontSize: 14 }}></i>
                    {role.users} user{Number(role.users) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="rm-info-card">
                  <div className="rm-info-label"><i className="bi bi-calendar3"></i> Created</div>
                  <div className="rm-info-value">{fmt(role.created_at)}</div>
                </div>
              </div>
              {role.description && (
                <div className="col-12">
                  <div className="rm-info-card">
                    <div className="rm-info-label"><i className="bi bi-card-text"></i> Description</div>
                    <div className="rm-info-value" style={{ color: '#6b7280' }}>{role.description}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Matrix */}
            <div className="rm-matrix-title"><i className="bi bi-grid-3x3-gap-fill"></i> Permission Matrix</div>
            <p className="rm-matrix-sub">
              <i className="bi bi-check-circle-fill" style={{ color: '#22c55e', marginRight: 4 }}></i> Granted &nbsp;
              <i className="bi bi-circle" style={{ color: '#d1d5db', marginRight: 4 }}></i> Not granted &nbsp;
              <span>—</span> Not applicable
            </p>

            <PermissionMatrix matrix={role.matrix} readOnly={true} />

            {/* Footer */}
            <div className="rm-footer">
              <Link href="/roles" className="rm-footer-link" style={{ textDecoration: 'none' }}>
                <i className="bi bi-arrow-left"></i> Back to Roles
              </Link>
              <Link href={`/roles/${role.id}/edit`} className="rm-btn-primary" style={{ textDecoration: 'none' }}>
                <i className="bi bi-pencil-fill"></i> Edit Role
              </Link>
            </div>

          </div>
        </div>
      </AdminLayout>
    </>
  );
}
