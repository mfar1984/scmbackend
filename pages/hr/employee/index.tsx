'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import { useDateFormat } from '../../../lib/useDateFormat';

type Employee = {
  id: number;
  employee_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department_name: string | null;
  position_name: string | null;
  employment_type_name: string | null;
  employee_status: string;
  join_date: string | null;
  has_login?: number;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: 'badge-approved', Probation: 'badge-pending',
    Resigned: 'badge-rejected', Terminated: 'badge-rejected',
  };
  return <span className={`badge-status ${map[status] || 'badge-pending'}`}>{status}</span>;
}

function Avatar({ name }: { name: string }) {
  return <div className="usr-avatar">{(name || '?').charAt(0).toUpperCase()}</div>;
}

export default function EmployeeListPage() {
  const router = useRouter();
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can('hr.employee.list', 'Create');
  const canUpdate = can('hr.employee.list', 'Update');
  const canDelete = can('hr.employee.list', 'Delete');
  const [items, setItems]     = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loginEmp, setLoginEmp] = useState<Employee | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginResult, setLoginResult] = useState<{ email: string; password: string; message: string } | null>(null);
  const [loginError, setLoginError] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/employees');
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const departments = Array.from(new Set(items.map(e => e.department_name).filter(Boolean))) as string[];

  const filtered = items.filter(e => {
    const q = search.toLowerCase();
    const matchSearch =
      e.full_name.toLowerCase().includes(q) ||
      e.employee_id.toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.position_name || '').toLowerCase().includes(q);
    const matchDept   = deptFilter === 'All' || e.department_name === deptFilter;
    const matchStatus = statusFilter === 'All' || e.employee_status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/employees/${selected.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setSelected(null); fetchItems(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
    finally { setDeleting(false); }
  };

  const handleCreateLogin = async () => {
    if (!loginEmp) return;
    setLoginBusy(true); setLoginError('');
    try {
      const res = await fetch('/api/hr/employees/create-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employee_id: loginEmp.id }) });
      const json = await res.json();
      if (json.success) { setLoginResult({ email: json.email, password: json.password, message: json.message }); fetchItems(); }
      else setLoginError(json.message || 'Failed to create login.');
    } catch { setLoginError('Network error.'); }
    finally { setLoginBusy(false); }
  };

  return (
    <>
      <Head><title>Employee List | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Employee', 'Employee List']}>
        <PermissionGate moduleKey="hr.employee.list">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>

            <div className="mb-4">
              <h1 className="page-title">Employee List</h1>
              <p className="page-subtitle">Manage all employee records across the organization.</p>
            </div>

            {/* Toolbar */}
            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search name, ID, email or position…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="rm-input" style={{ width: 170 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="All">All Departments</option>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
              <select className="rm-input" style={{ width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option>Active</option><option>Probation</option><option>Resigned</option><option>Terminated</option>
              </select>
              <button className="usr-btn-reset" onClick={() => { setSearch(''); setDeptFilter('All'); setStatusFilter('All'); }}>
                <i className="bi bi-arrow-counterclockwise"></i> Reset
              </button>
              {canCreate && (
                <Link href="/hr/employee/add" style={{ textDecoration: 'none' }}>
                  <button className="rm-btn-primary"><i className="bi bi-plus-lg"></i> Add Employee</button>
                </Link>
              )}
            </div>

            {/* Table */}
            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead>
                  <tr>
                    <th className="rm-th-module" style={{ width: 40 }}>#</th>
                    <th className="rm-th-module">Employee ID</th>
                    <th className="rm-th-module">Name</th>
                    <th className="rm-th-module">Department</th>
                    <th className="rm-th-module">Position</th>
                    <th className="rm-th-perm">Type</th>
                    <th className="rm-th-perm">Status</th>
                    <th className="rm-th-perm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                      <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                      <i className="bi bi-people" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No employees found.
                    </td></tr>
                  ) : filtered.map((e, i) => (
                    <tr key={e.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#6b7280' }}>{e.employee_id}</td>
                      <td className="rm-td-module">
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={e.full_name} />
                          <div>
                            <div style={{ color: '#1f2937' }}>{e.full_name}</div>
                            {e.email && <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{e.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{e.department_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{e.position_name || '—'}</td>
                      <td className="rm-td-perm" style={{ fontSize: 12.5, color: '#6b7280' }}>{e.employment_type_name || '—'}</td>
                      <td className="rm-td-perm"><StatusBadge status={e.employee_status} /></td>
                      <td className="rm-td-perm">
                        <div className="d-flex gap-2 justify-content-center">
                          <button className="rm-action-btn rm-action-view" title="View" onClick={() => router.push(`/hr/employee/${e.id}`)}><i className="bi bi-eye-fill"></i></button>
                          {canUpdate && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => router.push(`/hr/employee/${e.id}/edit`)}><i className="bi bi-pencil-fill"></i></button>}
                          {canUpdate && <button className="rm-action-btn" title={e.has_login ? 'Reset Self-Service login' : 'Create Self-Service login'} style={{ background: e.has_login ? '#ecfdf5' : '#eef2ff', color: e.has_login ? '#16a34a' : '#4f46e5' }} onClick={() => { setLoginEmp(e); setLoginResult(null); setLoginError(''); }}><i className={`bi ${e.has_login ? 'bi-key-fill' : 'bi-person-plus-fill'}`}></i></button>}
                          {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setSelected(e)}><i className="bi bi-trash-fill"></i></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>
              Showing {filtered.length} of {items.length} employee{items.length !== 1 ? 's' : ''}
            </div>

          </div>
        </div>

        {/* Delete Modal */}
        {selected && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Employee?</h3>
              <p>This will permanently remove <strong>{selected.full_name}</strong> ({selected.employee_id}).</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setSelected(null)} disabled={deleting}>Cancel</button>
                <button className="rm-btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <><span className="spinner-border spinner-border-sm me-1"></span> Deleting...</> : <><i className="bi bi-trash-fill"></i> Delete</>}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Create / Reset Self-Service Login */}
        {loginEmp && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" style={{ maxWidth: 480 }}>
              <div className="usr-modal-header">
                <div><p className="usr-modal-title"><i className="bi bi-person-badge" style={{ marginRight: 8 }}></i>{loginEmp.has_login ? 'Reset' : 'Create'} Self-Service Login</p><p className="usr-modal-sub">{loginEmp.full_name} ({loginEmp.employee_id})</p></div>
                <button className="usr-modal-close" onClick={() => setLoginEmp(null)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="usr-modal-body">
                {loginError && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{loginError}</div>}
                {!loginResult ? (
                  <>
                    {!loginEmp.email ? (
                      <div className="alert alert-warning" style={{ fontSize: 13 }}><i className="bi bi-exclamation-triangle-fill me-1"></i> This employee has no email address. Add one in the employee record first — the email is used as the login username.</div>
                    ) : (
                      <p style={{ fontSize: 13.5, color: '#4b5563' }}>
                        This will {loginEmp.has_login ? 'reset the password for' : 'create'} a staff Self-Service account for <strong>{loginEmp.email}</strong>. A new password will be generated. The employee can log in to apply for leave, claims, overtime and view payslips.
                      </p>
                    )}
                  </>
                ) : (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 13, color: '#16a34a', marginBottom: 10 }}><i className="bi bi-check-circle-fill me-1"></i> {loginResult.message}</div>
                    <div className="cr-kv"><span className="cr-kv-label">Login Email</span><span className="cr-kv-value" style={{ fontFamily: 'monospace' }}>{loginResult.email}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Password</span><span className="cr-kv-value" style={{ fontFamily: 'monospace', fontSize: 15, color: '#dc2626' }}>{loginResult.password}</span></div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 8 }}>Copy and share this password securely. It will not be shown again.</div>
                  </div>
                )}
              </div>
              <div className="usr-modal-footer">
                {!loginResult ? (
                  <>
                    <button className="rm-btn-outline" onClick={() => setLoginEmp(null)} disabled={loginBusy}>Cancel</button>
                    <button className="rm-btn-primary" onClick={handleCreateLogin} disabled={loginBusy || !loginEmp.email}>
                      {loginBusy ? <><span className="spinner-border spinner-border-sm me-1"></span> Working...</> : <><i className="bi bi-key-fill"></i> {loginEmp.has_login ? 'Reset Password' : 'Create Login'}</>}
                    </button>
                  </>
                ) : (
                  <button className="rm-btn-primary" onClick={() => setLoginEmp(null)}><i className="bi bi-check-lg"></i> Done</button>
                )}
              </div>
            </div>
          </div>
        )}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
