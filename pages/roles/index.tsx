import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import PermissionGate from '../../components/PermissionGate';
import { usePermissions } from '../../lib/usePermissions';
import { useDateFormat } from '../../lib/useDateFormat';

type Role = {
  id: number;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  users: number;
  created_at: string;
};

export default function RolesIndexPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can('settings.roles', 'Create');
  const canUpdate = can('settings.roles', 'Update');
  const canDelete = can('settings.roles', 'Delete');
  const [roles, setRoles]       = useState<Role[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('All');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/roles');
      const json = await res.json();
      if (json.success) setRoles(json.data);
      else setError(json.message || 'Failed to load roles.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const filtered = roles.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
                        (r.description || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === 'All' || r.status === status;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      const res  = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setRoles(prev => prev.filter(r => r.id !== id));
        setDeleteId(null);
      } else {
        alert(json.message || 'Delete failed.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Head><title>Roles Management — ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Settings', 'Roles Management']}>
        <PermissionGate moduleKey="settings.roles">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h1 className="page-title">Roles Management</h1>
                <p className="page-subtitle">Manage user roles and their access permissions.</p>
              </div>
              {canCreate && (
                <Link href="/roles/create" className="rm-btn-primary" style={{ textDecoration: 'none' }}>
                  <i className="bi bi-plus-lg"></i> Add Role
                </Link>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" style={{ fontSize: 13 }}>
                <i className="bi bi-exclamation-circle-fill"></i> {error}
                <button className="btn-close ms-auto" style={{ fontSize: 11 }} onClick={() => setError('')}></button>
              </div>
            )}

            {/* Search & Filter */}
            <div className="d-flex gap-2 mb-4 flex-wrap">
              <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
                <i className="bi bi-search" style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14,
                }}></i>
                <input
                  className="rm-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="Search role name or description..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select
                className="rm-input"
                style={{ width: 160 }}
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <button className="rm-btn-outline" onClick={() => { setSearch(''); setStatus('All'); }}>
                <i className="bi bi-arrow-counterclockwise"></i> Reset
              </button>
            </div>

            {/* Table */}
            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead>
                  <tr>
                    <th className="rm-th-module" style={{ width: 40 }}>#</th>
                    <th className="rm-th-module">Role Name</th>
                    <th className="rm-th-module">Description</th>
                    <th className="rm-th-perm" style={{ textAlign: 'center' }}>Users</th>
                    <th className="rm-th-perm" style={{ textAlign: 'center' }}>Status</th>
                    <th className="rm-th-perm" style={{ textAlign: 'center' }}>Created</th>
                    <th className="rm-th-perm" style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: 13 }}>
                        <div className="spinner-border spinner-border-sm text-secondary me-2"></div>
                        Loading roles...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: 13 }}>
                        <i className="bi bi-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>
                        No roles found.
                      </td>
                    </tr>
                  ) : filtered.map((role, i) => (
                    <tr key={role.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                      <td className="rm-td-module">
                        <div style={{ color: '#1f2937' }}>{role.name}</div>
                      </td>
                      <td style={{ padding: '9px 16px', fontSize: 13, color: '#6b7280' }}>
                        {role.description || <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td className="rm-td-perm">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#374151' }}>
                          <i className="bi bi-people-fill" style={{ color: '#3b82f6', fontSize: 13 }}></i>
                          {role.users}
                        </span>
                      </td>
                      <td className="rm-td-perm">
                        <span className={`badge-status ${role.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>
                          {role.status}
                        </span>
                      </td>
                      <td className="rm-td-perm" style={{ fontSize: 12, color: '#6b7280' }}>
                        {fmt(role.created_at)}
                      </td>
                      <td className="rm-td-perm">
                        <div className="d-flex gap-2 justify-content-center">
                          <Link href={`/roles/${role.id}`} className="rm-action-btn rm-action-view" title="View">
                            <i className="bi bi-eye-fill"></i>
                          </Link>
                          {canUpdate && (
                            <Link href={`/roles/${role.id}/edit`} className="rm-action-btn rm-action-edit" title="Edit">
                              <i className="bi bi-pencil-fill"></i>
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              className="rm-action-btn rm-action-delete"
                              title="Delete"
                              onClick={() => setDeleteId(role.id)}
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer count */}
            <div style={{ marginTop: 14, fontSize: 12.5, color: '#6b7280' }}>
              Showing {filtered.length} of {roles.length} role{roles.length !== 1 ? 's' : ''}
            </div>

          </div>
        </div>

        {/* Delete confirm modal */}
        {deleteId !== null && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h3>Delete Role?</h3>
              <p>This action cannot be undone. Users assigned to this role will lose their permissions.</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</button>
                <button className="rm-btn-danger" onClick={() => handleDelete(deleteId)} disabled={deleting}>
                  {deleting
                    ? <><span className="spinner-border spinner-border-sm me-1"></span> Deleting...</>
                    : <><i className="bi bi-trash-fill"></i> Delete</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        </PermissionGate>
      </AdminLayout>
    </>
  );
}
