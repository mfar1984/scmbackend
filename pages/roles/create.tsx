'use client';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import PermissionGate from '../../components/PermissionGate';
import PermissionMatrix from '../../components/PermissionMatrix';
import { PermMatrix, initMatrix, selectAllMatrix } from '../../lib/rolesData';

export default function RolesCreatePage() {
  const router = useRouter();
  const [roleName, setRoleName] = useState('');
  const [status, setStatus]     = useState('Active');
  const [description, setDesc]  = useState('');
  const [matrix, setMatrix]     = useState<PermMatrix>(initMatrix);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const toggle = (modKey: string, perm: string) => {
    setMatrix(prev => ({ ...prev, [modKey]: { ...prev[modKey], [perm]: !prev[modKey][perm] } }));
  };

  const selectAll = () => setMatrix(selectAllMatrix());
  const clearAll  = () => setMatrix(initMatrix());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) { setError('Role name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res  = await fetch('/api/roles', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: roleName, description, status, permissions: matrix }),
      });
      const json = await res.json();
      if (json.success) {
        router.push('/roles');
      } else {
        setError(json.message || 'Failed to save role.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head><title>Create Role — ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Settings', 'Roles Management', 'Create Role']}>
        <PermissionGate moduleKey="settings.roles">
        <form onSubmit={handleSave}>
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-body" style={{ padding: 24 }}>

              {/* Header */}
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <a href="/roles" className="rm-back-btn"><i className="bi bi-arrow-left"></i></a>
                    <h1 className="page-title" style={{ margin: 0 }}>Create Role</h1>
                  </div>
                  <p className="page-subtitle">Define a new role and set its permission matrix.</p>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="rm-btn-outline" onClick={clearAll}>
                    <i className="bi bi-x-circle"></i> Clear All
                  </button>
                  <button type="button" className="rm-btn-outline" onClick={selectAll}>
                    <i className="bi bi-check2-all"></i> Select All
                  </button>
                  <button type="submit" className="rm-btn-primary" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                      : <><i className="bi bi-floppy-fill"></i> Save Role</>
                    }
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" style={{ fontSize: 13 }}>
                  <i className="bi bi-exclamation-circle-fill"></i> {error}
                </div>
              )}

              {/* Role info */}
              <div className="row g-3 mb-4">
                <div className="col-md-5">
                  <label className="rm-label">Role Name <span>*</span></label>
                  <input className="rm-input" placeholder="e.g. HR Manager, Editor, Viewer"
                    value={roleName} onChange={e => setRoleName(e.target.value)} required />
                </div>
                <div className="col-md-3">
                  <label className="rm-label">Status</label>
                  <select className="rm-input" value={status} onChange={e => setStatus(e.target.value)}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="rm-label">Description <span className="rm-optional">(optional)</span></label>
                  <input className="rm-input" placeholder="Brief description of this role"
                    value={description} onChange={e => setDesc(e.target.value)} />
                </div>
              </div>

              {/* Matrix */}
              <div className="rm-matrix-title"><i className="bi bi-grid-3x3-gap-fill"></i> Permission Matrix</div>
              <p className="rm-matrix-sub">Check the permissions for each module. <span>—</span> means not applicable.</p>

              <PermissionMatrix matrix={matrix} readOnly={false} onToggle={toggle} />

              {/* Footer */}
              <div className="rm-footer">
                <div className="rm-footer-left">
                  <button type="button" className="rm-footer-link" onClick={selectAll}>Select All</button>
                  <button type="button" className="rm-footer-link rm-footer-link-red" onClick={clearAll}>Clear All</button>
                </div>
                <button type="submit" className="rm-btn-primary" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                    : <><i className="bi bi-floppy-fill"></i> Save Role</>
                  }
                </button>
              </div>

            </div>
          </div>
        </form>
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
