import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import PermissionMatrix from '../../../components/PermissionMatrix';
import { PermMatrix, initMatrix, selectAllMatrix } from '../../../lib/rolesData';

export default function RoleEditPage() {
  const router = useRouter();
  const { id } = router.query;

  const [roleName, setRoleName] = useState('');
  const [status, setStatus]     = useState<'Active' | 'Inactive'>('Active');
  const [description, setDesc]  = useState('');
  const [matrix, setMatrix]     = useState<PermMatrix>(initMatrix);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/roles/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const r = json.data;
          setRoleName(r.name);
          setStatus(r.status);
          setDesc(r.description || '');
          // Merge fetched matrix with initMatrix (ensure all keys exist)
          const base = initMatrix();
          for (const mod in r.matrix) {
            if (base[mod]) {
              for (const perm in r.matrix[mod]) {
                if (base[mod][perm] !== undefined) base[mod][perm] = r.matrix[mod][perm];
              }
            }
          }
          setMatrix(base);
        } else {
          setError(json.message || 'Role not found.');
        }
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggle = (mod: string, perm: string) => {
    setMatrix(prev => ({ ...prev, [mod]: { ...prev[mod], [perm]: !prev[mod][perm] } }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) { setError('Role name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res  = await fetch(`/api/roles/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: roleName, description, status, permissions: matrix }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => { setSaved(false); router.push('/roles'); }, 1200);
      } else {
        setError(json.message || 'Failed to save.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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

  if (error && !roleName) {
    return (
      <>
        <Head><title>Role Not Found — ATLINE Admin</title></Head>
        <AdminLayout breadcrumb={['Settings', 'Roles Management', 'Not Found']}>
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-body" style={{ padding: 24, textAlign: 'center' }}>
              <i className="bi bi-exclamation-circle" style={{ fontSize: 40, color: '#ef4444', display: 'block', marginBottom: 12 }}></i>
              <h2 style={{ fontSize: 18, color: '#1f2937', marginBottom: 8 }}>Role Not Found</h2>
              <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 20 }}>{error}</p>
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
      <Head><title>Edit {roleName} — ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Settings', 'Roles Management', roleName, 'Edit']}>
        <form onSubmit={handleSave}>
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-body" style={{ padding: 24 }}>

              {/* Header */}
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Link href={`/roles/${id}`} className="rm-back-btn"><i className="bi bi-arrow-left"></i></Link>
                    <h1 className="page-title" style={{ margin: 0 }}>Edit Role</h1>
                  </div>
                  <p className="page-subtitle">Update role details and permission matrix for <strong>{roleName}</strong>.</p>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="rm-btn-outline" onClick={() => setMatrix(initMatrix())}>
                    <i className="bi bi-x-circle"></i> Clear All
                  </button>
                  <button type="button" className="rm-btn-outline" onClick={() => setMatrix(selectAllMatrix())}>
                    <i className="bi bi-check2-all"></i> Select All
                  </button>
                  <button type="submit" className="rm-btn-primary" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                      : saved
                        ? <><i className="bi bi-check-circle-fill"></i> Saved!</>
                        : <><i className="bi bi-floppy-fill"></i> Save Changes</>
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

              {/* Saved banner */}
              {saved && (
                <div className="rm-saved-banner mb-3">
                  <i className="bi bi-check-circle-fill"></i> Changes saved successfully!
                </div>
              )}

              {/* Role info */}
              <div className="row g-3 mb-4">
                <div className="col-md-5">
                  <label className="rm-label">Role Name <span>*</span></label>
                  <input className="rm-input" placeholder="e.g. HR Manager"
                    value={roleName} onChange={e => setRoleName(e.target.value)} required />
                </div>
                <div className="col-md-3">
                  <label className="rm-label">Status</label>
                  <select className="rm-input" value={status} onChange={e => setStatus(e.target.value as 'Active' | 'Inactive')}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="rm-label">Description <span className="rm-optional">(optional)</span></label>
                  <input className="rm-input" placeholder="Brief description"
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
                  <button type="button" className="rm-footer-link" onClick={() => setMatrix(selectAllMatrix())}>Select All</button>
                  <button type="button" className="rm-footer-link rm-footer-link-red" onClick={() => setMatrix(initMatrix())}>Clear All</button>
                </div>
                <button type="submit" className="rm-btn-primary" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                    : <><i className="bi bi-floppy-fill"></i> Save Changes</>
                  }
                </button>
              </div>

            </div>
          </div>
        </form>
      </AdminLayout>
    </>
  );
}
