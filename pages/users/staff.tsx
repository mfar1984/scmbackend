'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import UserLayout from '../../components/UserLayout';
import { usePermissions } from '../../lib/usePermissions';
import { useDateFormat } from '../../lib/useDateFormat';

type UserStatus = 'Active' | 'Inactive' | 'Suspended';
type StaffRecord = {
  id: number; name: string; email: string; phone: string; status: UserStatus;
  employee_id: number | null; employee_code: string | null; employee_name: string | null;
  department: string | null; position: string | null; join_date: string | null; last_login: string;
};
type Candidate = { id: number; employee_id: string; full_name: string; email: string | null; department_name: string | null; position_name: string | null };

function StatusBadge({ status }: { status: UserStatus }) {
  const cls = status === 'Active' ? 'badge-approved' : status === 'Suspended' ? 'badge-pending' : 'badge-rejected';
  return <span className={`badge-status ${cls}`}>{status}</span>;
}

/* ── Import-from-Employee Modal ── */
function ImportModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ email: string; password: string; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/hr/employees/without-login').then(r => r.json()).then(j => { if (j.success) setCandidates(j.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const selected = candidates.find(c => String(c.id) === employeeId);

  const handleImport = async () => {
    if (!employeeId) { setError('Please select an employee.'); return; }
    if (selected && !selected.email) { setError('This employee has no email. Add one in the employee record first.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/hr/employees/create-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employee_id: parseInt(employeeId) }) });
      const json = await res.json();
      if (json.success) { setResult({ email: json.email, password: json.password, message: json.message }); onSaved(); }
      else setError(json.message || 'Failed to import.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 560 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-box-arrow-in-down" style={{ marginRight: 8 }}></i>Import Staff from Employee</p><p className="usr-modal-sub">Create a Self-Service login linked to an employee record</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          {result ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, color: '#16a34a', marginBottom: 10 }}><i className="bi bi-check-circle-fill me-1"></i> {result.message}</div>
              <div className="cr-kv"><span className="cr-kv-label">Login Email</span><span className="cr-kv-value" style={{ fontFamily: 'monospace' }}>{result.email}</span></div>
              <div className="cr-kv"><span className="cr-kv-label">Password</span><span className="cr-kv-value" style={{ fontFamily: 'monospace', fontSize: 15, color: '#dc2626' }}>{result.password}</span></div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 8 }}>Copy and share this securely — it won&apos;t be shown again.</div>
            </div>
          ) : (
            <>
              <div className="int-info-note mb-3"><i className="bi bi-info-circle-fill"></i> Staff accounts are created from existing employee records. All profile data (department, position, salary) stays linked to the employee — no duplication.</div>
              <div className="mb-1">
                <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Employee <span style={{ color: '#ef4444' }}>*</span></label>
                {loading ? (
                  <div style={{ fontSize: 13, color: '#9ca3af' }}><span className="spinner-border spinner-border-sm me-1"></span> Loading employees…</div>
                ) : candidates.length === 0 ? (
                  <div className="int-warn-note"><i className="bi bi-exclamation-triangle-fill"></i> All active employees already have a login, or there are no employees yet. Add employees under <strong>HR → Employee</strong> first.</div>
                ) : (
                  <select className="rm-input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                    <option value="">— Select Employee —</option>
                    {candidates.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.employee_id}){c.department_name ? ` · ${c.department_name}` : ''}</option>)}
                  </select>
                )}
              </div>
              {selected && (
                <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 10, padding: 14, fontSize: 13 }}>
                  <div className="cr-kv"><span className="cr-kv-label">Login Email</span><span className="cr-kv-value">{selected.email || <span style={{ color: '#dc2626' }}>No email — add one first</span>}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Department</span><span className="cr-kv-value">{selected.department_name || '—'}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Position</span><span className="cr-kv-value">{selected.position_name || '—'}</span></div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          {result ? (
            <button className="rm-btn-primary" onClick={onClose}><i className="bi bi-check-lg"></i> Done</button>
          ) : (
            <>
              <button className="rm-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="rm-btn-primary" onClick={handleImport} disabled={saving || candidates.length === 0}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Importing...</> : <><i className="bi bi-box-arrow-in-down"></i> Import &amp; Create Login</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Full integrated profile (read-only) ── */
function ShowModal({ userId, onClose, fmt }: { userId: number; onClose: () => void; fmt: (d: any, t?: boolean) => string }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/users/staff-profile?id=${userId}`).then(r => r.json()).then(j => { if (j.success) setData(j.data); else setError(j.message || 'Failed.'); }).catch(() => setError('Failed to load.'));
  }, [userId]);

  const money = (v: any) => v != null ? `RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '—';
  const e = data?.employee;
  const KV = ({ label, value }: { label: string; value: any }) => <div className="cr-kv"><span className="cr-kv-label">{label}</span><span className="cr-kv-value">{value || '—'}</span></div>;

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 720 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Staff Profile</p><p className="usr-modal-sub">{data?.user?.name || ''}</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error ? <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div> : !data ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : !e ? (
            <div className="int-warn-note"><i className="bi bi-exclamation-triangle-fill"></i> This staff account is not linked to an employee record.</div>
          ) : (
            <>
              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-person-fill"></i> Personal Info</div>
                <div className="cr-panel-body">
                  <KV label="Employee ID" value={e.employee_id} />
                  <KV label="Full Name" value={e.full_name} />
                  <KV label="NRIC / Passport" value={e.nric_passport} />
                  <KV label="Gender" value={e.gender} />
                  <KV label="Marital Status" value={e.marital_status} />
                  <KV label="Date of Birth" value={e.date_of_birth ? fmt(e.date_of_birth) : '—'} />
                  <KV label="Email" value={e.email} />
                  <KV label="Phone" value={e.phone} />
                  <KV label="Address" value={[e.address, e.city, e.state, e.postcode].filter(Boolean).join(', ')} />
                </div>
              </div>
              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-briefcase-fill"></i> Employment</div>
                <div className="cr-panel-body">
                  <KV label="Department" value={e.department_name} />
                  <KV label="Position" value={e.position_name} />
                  <KV label="Employment Type" value={e.employment_type_name} />
                  <KV label="Work Location" value={e.work_location} />
                  <KV label="Reporting To" value={e.reporting_to} />
                  <KV label="Join Date" value={e.join_date ? fmt(e.join_date) : '—'} />
                  <KV label="Status" value={e.employee_status} />
                </div>
              </div>
              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-cash-stack"></i> Salary &amp; Bank</div>
                <div className="cr-panel-body">
                  <KV label="Basic Salary" value={money(e.basic_salary)} />
                  <KV label="Fixed Allowance" value={money(e.fixed_allowance)} />
                  <KV label="Bank" value={e.bank_name} />
                  <KV label="Bank Account" value={e.bank_account_no} />
                  <KV label="EPF No." value={e.epf_no} />
                  <KV label="SOCSO No." value={e.socso_no} />
                  <KV label="Income Tax No." value={e.income_tax_no} />
                </div>
              </div>
              <div className="int-info-note"><i className="bi bi-info-circle-fill"></i> To edit this profile, go to <strong>HR → Employee</strong>. Staff data is managed there to avoid duplication.</div>
            </>
          )}
        </div>
        <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function StaffPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can('settings.users.staff', 'Create');
  const canUpdate = can('settings.users.staff', 'Update');
  const canDelete = can('settings.users.staff', 'Delete');
  const [users, setUsers] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sf, setSf] = useState('All');
  const [modal, setModal] = useState<'import' | 'show' | 'delete' | 'reset' | null>(null);
  const [selected, setSelected] = useState<StaffRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetResult, setResetResult] = useState<{ password: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users?type=staff');
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const refresh = useCallback(() => { fetchUsers(); setRefreshKey(k => k + 1); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q))
      && (sf === 'All' || u.status === sf);
  });

  const open = (type: typeof modal, u?: StaffRecord) => { if (u) setSelected(u); setResetResult(null); setModal(type); };

  const setStatus = async (u: StaffRecord, status: UserStatus) => {
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: u.name, email: u.email, status }) });
      const json = await res.json();
      if (json.success) refresh(); else alert(json.message || 'Failed.');
    } catch { alert('Network error.'); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${selected.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { refresh(); setModal(null); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); } finally { setBusy(false); }
  };

  const handleReset = async () => {
    if (!selected?.employee_id) return;
    setBusy(true);
    try {
      const res = await fetch('/api/hr/employees/create-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employee_id: selected.employee_id }) });
      const json = await res.json();
      if (json.success) setResetResult({ password: json.password });
      else alert(json.message || 'Reset failed.');
    } catch { alert('Network error.'); } finally { setBusy(false); }
  };

  return (
    <>
      <Head><title>Staff — Users Management | ATLINE Admin</title></Head>
      <UserLayout activeTab="staff" breadcrumb={['Settings', 'Users Management', 'Staff']} refreshKey={refreshKey}>

        <div className="int-info-note mb-3"><i className="bi bi-info-circle-fill"></i> Staff accounts are <strong>Employee Self-Service</strong> logins imported from HR employee records. They sign in to apply for leave, claims, overtime and view payslips. Profile data lives in HR → Employee (no duplication, no role needed).</div>

        <div className="d-flex gap-2 mb-3 flex-wrap">
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
            <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search name, email or department…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="rm-input" style={{ width: 150 }} value={sf} onChange={e => setSf(e.target.value)}>
            <option value="All">All Status</option><option>Active</option><option>Inactive</option><option>Suspended</option>
          </select>
          <button className="usr-btn-reset" onClick={() => { setSearch(''); setSf('All'); }}><i className="bi bi-arrow-counterclockwise"></i> Reset</button>
          {canCreate && <button className="rm-btn-primary" onClick={() => open('import')}><i className="bi bi-box-arrow-in-down"></i> Import Staff</button>}
        </div>

        <div className="rm-table-wrap">
          <table className="rm-table">
            <thead>
              <tr>
                <th className="rm-th-module" style={{ width: 40 }}>#</th>
                <th className="rm-th-module">Name</th>
                <th className="rm-th-module">Email</th>
                <th className="rm-th-perm">Employee ID</th>
                <th className="rm-th-perm">Department</th>
                <th className="rm-th-perm">Status</th>
                <th className="rm-th-perm">Last Login</th>
                <th className="rm-th-perm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-people" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No staff logins yet. Click &quot;Import Staff&quot; to create one from an employee.</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} className="rm-data-row">
                  <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                  <td className="rm-td-module">
                    <div className="d-flex align-items-center gap-2">
                      <div className="usr-avatar">{u.name.charAt(0)}</div>
                      <div><div style={{ color: '#1f2937', fontSize: 13 }}>{u.name}</div><div style={{ color: '#9ca3af', fontSize: 11 }}>{u.position || '—'}</div></div>
                    </div>
                  </td>
                  <td style={{ padding: '9px 16px', fontSize: 13, color: '#6b7280' }}>{u.email}</td>
                  <td className="rm-td-perm" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{u.employee_code || <span style={{ color: '#dc2626' }}>unlinked</span>}</td>
                  <td className="rm-td-perm" style={{ fontSize: 13, color: '#374151' }}>{u.department || '—'}</td>
                  <td className="rm-td-perm"><StatusBadge status={u.status} /></td>
                  <td className="rm-td-perm" style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmt(u.last_login, true)}</td>
                  <td className="rm-td-perm">
                    <div className="d-flex gap-2 justify-content-center">
                      <button className="rm-action-btn rm-action-view" title="View profile" onClick={() => open('show', u)}><i className="bi bi-eye-fill"></i></button>
                      {canUpdate && <button className="rm-action-btn" title="Reset password" style={{ background: '#eef2ff', color: '#4f46e5' }} onClick={() => open('reset', u)}><i className="bi bi-key-fill"></i></button>}
                      {canUpdate && (u.status === 'Active'
                        ? <button className="rm-action-btn" title="Suspend" style={{ background: '#fffbeb', color: '#d97706' }} onClick={() => setStatus(u, 'Suspended')}><i className="bi bi-pause-circle-fill"></i></button>
                        : <button className="rm-action-btn" title="Activate" style={{ background: '#ecfdf5', color: '#16a34a' }} onClick={() => setStatus(u, 'Active')}><i className="bi bi-play-circle-fill"></i></button>)}
                      {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete login" onClick={() => open('delete', u)}><i className="bi bi-trash-fill"></i></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>Showing {filtered.length} of {users.length} staff login{users.length !== 1 ? 's' : ''}</div>

        {modal === 'import' && <ImportModal onClose={() => setModal(null)} onSaved={refresh} />}
        {modal === 'show' && selected && <ShowModal userId={selected.id} onClose={() => setModal(null)} fmt={fmt} />}

        {modal === 'reset' && selected && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" style={{ maxWidth: 460 }}>
              <div className="usr-modal-header"><div><p className="usr-modal-title"><i className="bi bi-key-fill" style={{ marginRight: 8 }}></i>Reset Password</p><p className="usr-modal-sub">{selected.name}</p></div><button className="usr-modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button></div>
              <div className="usr-modal-body">
                {resetResult ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 13, color: '#16a34a', marginBottom: 10 }}><i className="bi bi-check-circle-fill me-1"></i> Password reset successfully.</div>
                    <div className="cr-kv"><span className="cr-kv-label">New Password</span><span className="cr-kv-value" style={{ fontFamily: 'monospace', fontSize: 15, color: '#dc2626' }}>{resetResult.password}</span></div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 8 }}>Share securely — won&apos;t be shown again.</div>
                  </div>
                ) : (
                  <p style={{ fontSize: 13.5, color: '#4b5563' }}>Generate a new password for <strong>{selected.email}</strong>? The current password will stop working.</p>
                )}
              </div>
              <div className="usr-modal-footer">
                {resetResult ? <button className="rm-btn-primary" onClick={() => setModal(null)}><i className="bi bi-check-lg"></i> Done</button> : (
                  <><button className="rm-btn-outline" onClick={() => setModal(null)} disabled={busy}>Cancel</button>
                  <button className="rm-btn-primary" onClick={handleReset} disabled={busy || !selected.employee_id}>{busy ? <><span className="spinner-border spinner-border-sm me-1"></span> Resetting...</> : <><i className="bi bi-key-fill"></i> Reset Password</>}</button></>
                )}
              </div>
            </div>
          </div>
        )}

        {modal === 'delete' && selected && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Staff Login?</h3>
              <p>This removes the login for <strong>{selected.name}</strong>. The employee record in HR stays intact.</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setModal(null)} disabled={busy}>Cancel</button>
                <button className="rm-btn-danger" onClick={handleDelete} disabled={busy}>{busy ? <><span className="spinner-border spinner-border-sm me-1"></span> Deleting...</> : <><i className="bi bi-trash-fill"></i> Delete Login</>}</button>
              </div>
            </div>
          </div>
        )}
      </UserLayout>
    </>
  );
}
