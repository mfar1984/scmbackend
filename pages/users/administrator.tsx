'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import UserLayout from '../../components/UserLayout';
import { usePermissions } from '../../lib/usePermissions';
import { useDateFormat } from '../../lib/useDateFormat';

type UserStatus = 'Active' | 'Inactive' | 'Suspended';

type UserRecord = {
  id: number; name: string; email: string; phone: string;
  role: string; role_id: number | null; status: UserStatus;
  last_login: string; department?: string; position?: string; join_date?: string;
};

type RoleOption = { id: number; name: string };

/* ── Helpers ── */
function StatusBadge({ status }: { status: UserStatus }) {
  const cls = status === 'Active' ? 'badge-approved' : status === 'Suspended' ? 'badge-pending' : 'badge-rejected';
  return <span className={`badge-status ${cls}`}>{status}</span>;
}
function Avatar({ name }: { name: string }) {
  return <div className="usr-avatar">{name.charAt(0).toUpperCase()}</div>;
}
function CreateModal({ roles, onClose, onSaved }: { roles: RoleOption[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [phone, setPhone]   = useState('');
  const [roleId, setRoleId] = useState<string>('');
  const [status, setStatus] = useState<UserStatus>('Active');
  const [dept, setDept]     = useState('');
  const [pos, setPos]       = useState('');
  const [pw, setPw]         = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email required';
    if (!phone.trim()) e.phone = 'Required';
    if (!pw.trim() || pw.length < 6) e.pw = 'Min 6 characters';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setApiError('');
    try {
      const res  = await fetch('/api/users', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name, email, phone, password: pw,
          role_id: roleId ? parseInt(roleId) : null,
          user_type: 'administrator', status,
          department: dept, position: pos,
        }),
      });
      const json = await res.json();
      if (json.success) { onSaved(); onClose(); }
      else setApiError(json.message || 'Failed to create user.');
    } catch {
      setApiError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    { label: 'Full Name',     req: true,  field: <><input className={`rm-input ${errors.name ? 'usr-input-err' : ''}`} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />{errors.name && <span className="usr-err-msg">{errors.name}</span>}</> },
    { label: 'Email Address', req: true,  field: <><input type="email" className={`rm-input ${errors.email ? 'usr-input-err' : ''}`} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@atline.com.my" />{errors.email && <span className="usr-err-msg">{errors.email}</span>}</> },
    { label: 'Phone Number',  req: true,  field: <><input className={`rm-input ${errors.phone ? 'usr-input-err' : ''}`} value={phone} onChange={e => setPhone(e.target.value)} placeholder="01X-XXX XXXX" />{errors.phone && <span className="usr-err-msg">{errors.phone}</span>}</> },
    { label: 'Password',      req: true,  field: <><input type="password" className={`rm-input ${errors.pw ? 'usr-input-err' : ''}`} value={pw} onChange={e => setPw(e.target.value)} placeholder="Min 6 characters" />{errors.pw && <span className="usr-err-msg">{errors.pw}</span>}</> },
    { label: 'Role',          req: false, field: <select className="rm-input" value={roleId} onChange={e => setRoleId(e.target.value)}><option value="">— Select Role —</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select> },
    { label: 'Status',        req: false, field: <select className="rm-input" value={status} onChange={e => setStatus(e.target.value as UserStatus)}><option>Active</option><option>Inactive</option><option>Suspended</option></select> },
    { label: 'Department',    req: false, field: <input className="rm-input" value={dept} onChange={e => setDept(e.target.value)} placeholder="e.g. Management" /> },
    { label: 'Position',      req: false, field: <input className="rm-input" value={pos} onChange={e => setPos(e.target.value)} placeholder="e.g. System Administrator" /> },
  ];

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal">
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Add Administrator</p><p className="usr-modal-sub">Create a new administrator account</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="usr-modal-body">
            {apiError && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{apiError}</div>}
            {rows.map((row, i) => (
              <div key={row.label} className={`usr-form-row ${i === rows.length - 1 ? 'usr-form-row-last' : ''}`}>
                <label className="usr-form-label">{row.label} {row.req && <span>*</span>}</label>
                <div className="usr-form-field">{row.field}</div>
              </div>
            ))}
          </div>
          <div className="usr-modal-footer">
            <button type="button" className="rm-btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="rm-btn-primary" disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-plus-lg"></i> Add Administrator</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Edit Modal ── */
function EditModal({ user, roles, onClose, onSaved }: { user: UserRecord; roles: RoleOption[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName]     = useState(user.name);
  const [email, setEmail]   = useState(user.email);
  const [phone, setPhone]   = useState(user.phone);
  const [roleId, setRoleId] = useState<string>(user.role_id ? String(user.role_id) : '');
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [dept, setDept]     = useState(user.department ?? '');
  const [pos, setPos]       = useState(user.position ?? '');
  const [pw, setPw]         = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setApiError('');
    try {
      const res  = await fetch(`/api/users/${user.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name, email, phone, password: pw || undefined,
          role_id: roleId ? parseInt(roleId) : null,
          status, department: dept, position: pos,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => { setSaved(false); onSaved(); onClose(); }, 1200);
      } else {
        setApiError(json.message || 'Failed to update.');
      }
    } catch {
      setApiError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    { label: 'Full Name',     req: true,  field: <input className="rm-input" value={name}  onChange={e => setName(e.target.value)}  required /> },
    { label: 'Email Address', req: true,  field: <input type="email" className="rm-input" value={email} onChange={e => setEmail(e.target.value)} required /> },
    { label: 'Phone Number',  req: false, field: <input className="rm-input" value={phone} onChange={e => setPhone(e.target.value)} /> },
    { label: 'New Password',  req: false, field: <input type="password" className="rm-input" value={pw} onChange={e => setPw(e.target.value)} placeholder="Leave blank to keep current" /> },
    { label: 'Role',          req: false, field: <select className="rm-input" value={roleId} onChange={e => setRoleId(e.target.value)}><option value="">— Select Role —</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select> },
    { label: 'Status',        req: false, field: <select className="rm-input" value={status} onChange={e => setStatus(e.target.value as UserStatus)}><option>Active</option><option>Inactive</option><option>Suspended</option></select> },
    { label: 'Department',    req: false, field: <input className="rm-input" value={dept} onChange={e => setDept(e.target.value)} /> },
    { label: 'Position',      req: false, field: <input className="rm-input" value={pos}  onChange={e => setPos(e.target.value)} /> },
  ];

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal">
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Edit Administrator</p><p className="usr-modal-sub">{user.name}</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="usr-modal-body">
            {apiError && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{apiError}</div>}
            {saved && <div className="rm-saved-banner mb-3"><i className="bi bi-check-circle-fill"></i> Changes saved!</div>}
            {rows.map((row, i) => (
              <div key={row.label} className={`usr-form-row ${i === rows.length - 1 ? 'usr-form-row-last' : ''}`}>
                <label className="usr-form-label">{row.label} {row.req && <span>*</span>}</label>
                <div className="usr-form-field">{row.field}</div>
              </div>
            ))}
          </div>
          <div className="usr-modal-footer">
            <button type="button" className="rm-btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="rm-btn-primary" disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-floppy-fill"></i> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Show Modal ── */
function ShowModal({ user, onClose, onEdit, fmt }: {
  user: UserRecord; onClose: () => void; onEdit: () => void;
  fmt: (d: any, t?: boolean) => string;
}) {
  const rows = [
    { label: 'Email Address', value: user.email },
    { label: 'Phone Number',  value: user.phone || '—' },
    { label: 'Department',    value: user.department || '—' },
    { label: 'Position',      value: user.position   || '—' },
    { label: 'Join Date',     value: user.join_date ? fmt(user.join_date) : '—' },
    { label: 'Last Login',    value: fmt(user.last_login, true) },
    { label: 'Status',        value: <StatusBadge status={user.status} /> },
  ];
  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal">
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Administrator Details</p><p className="usr-modal-sub">Read-only view</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          <div className="usr-show-profile">
            <div className="usr-show-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <div className="usr-show-name">{user.name}</div>
              <div className="usr-show-role">{user.role || '—'}</div>
              <StatusBadge status={user.status} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            {rows.map((row, i) => (
              <div key={row.label} className={`usr-form-row ${i === rows.length - 1 ? 'usr-form-row-last' : ''}`}>
                <span className="usr-form-label" style={{ paddingTop: 6 }}>{row.label}</span>
                <span style={{ flex: 1, fontSize: 13.5, color: '#374151', paddingTop: 6 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="usr-modal-footer">
          <button type="button" className="rm-btn-outline" onClick={onClose}>Close</button>
          <button type="button" className="rm-btn-primary" onClick={onEdit}><i className="bi bi-pencil-fill"></i> Edit</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function AdministratorPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can('settings.users.administrator', 'Create');
  const canUpdate = can('settings.users.administrator', 'Update');
  const canDelete = can('settings.users.administrator', 'Delete');
  const [users, setUsers]   = useState<UserRecord[]>([]);
  const [roles, setRoles]   = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sf, setSf]         = useState('All');
  const [modal, setModal]   = useState<'create' | 'edit' | 'show' | 'delete' | null>(null);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/users?type=administrator');
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetch('/api/roles/list').then(r => r.json()).then(j => { if (j.success) setRoles(j.data); });
  }, [fetchUsers]);

  // Refresh users + badge counts
  const refresh = useCallback(() => {
    fetchUsers();
    setRefreshKey(k => k + 1);
  }, [fetchUsers]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q))
      && (sf === 'All' || u.status === sf);
  });

  const open = (type: typeof modal, u?: UserRecord) => { if (u) setSelected(u); setModal(type); };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/users/${selected.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { refresh(); setModal(null); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
    finally { setDeleting(false); }
  };

  return (
    <>
      <Head><title>Administrator — Users Management | ATLINE Admin</title></Head>
      <UserLayout activeTab="administrator" breadcrumb={['Settings', 'Users Management', 'Administrator']} refreshKey={refreshKey}>

        {/* Toolbar */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
            <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search name, email or role…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="rm-input" style={{ width: 150 }} value={sf} onChange={e => setSf(e.target.value)}>
            <option value="All">All Status</option>
            <option>Active</option><option>Inactive</option><option>Suspended</option>
          </select>
          <button className="usr-btn-reset" onClick={() => { setSearch(''); setSf('All'); }}>
            <i className="bi bi-arrow-counterclockwise"></i> Reset
          </button>
          {canCreate && (
            <button className="rm-btn-primary" onClick={() => open('create')}>
              <i className="bi bi-plus-lg"></i> Add Administrator
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rm-table-wrap">
          <table className="rm-table">
            <thead>
              <tr>
                <th className="rm-th-module" style={{ width: 40 }}>#</th>
                <th className="rm-th-module">Name</th>
                <th className="rm-th-module">Email</th>
                <th className="rm-th-perm">Role</th>
                <th className="rm-th-perm">Status</th>
                <th className="rm-th-perm">Last Login</th>
                <th className="rm-th-perm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                  <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                  <i className="bi bi-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No users found.
                </td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} className="rm-data-row">
                  <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                  <td className="rm-td-module">
                    <div className="d-flex align-items-center gap-2">
                      <Avatar name={u.name} />
                      <span style={{ color: '#1f2937' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '9px 16px', fontSize: 13, color: '#6b7280' }}>{u.email}</td>
                  <td className="rm-td-perm"><span className="usr-role-badge">{u.role || '—'}</span></td>
                  <td className="rm-td-perm"><StatusBadge status={u.status} /></td>
                  <td className="rm-td-perm" style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmt(u.last_login, true)}</td>
                  <td className="rm-td-perm">
                    <div className="d-flex gap-2 justify-content-center">
                      <button className="rm-action-btn rm-action-view"   onClick={() => open('show',   u)}><i className="bi bi-eye-fill"></i></button>
                      {canUpdate && <button className="rm-action-btn rm-action-edit"   onClick={() => open('edit',   u)}><i className="bi bi-pencil-fill"></i></button>}
                      {canDelete && <button className="rm-action-btn rm-action-delete" onClick={() => open('delete', u)}><i className="bi bi-trash-fill"></i></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>
          Showing {filtered.length} of {users.length} administrator{users.length !== 1 ? 's' : ''}
        </div>

        {/* Modals */}
        {modal === 'create' && <CreateModal roles={roles} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal === 'edit'   && selected && <EditModal   user={selected} roles={roles} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal === 'show'   && selected && <ShowModal   user={selected} onClose={() => setModal(null)} onEdit={() => setModal('edit')} fmt={fmt} />}
        {modal === 'delete' && selected && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete User?</h3>
              <p>This will permanently remove <strong>{selected.name}</strong> from the system.</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setModal(null)} disabled={deleting}>Cancel</button>
                <button className="rm-btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <><span className="spinner-border spinner-border-sm me-1"></span> Deleting...</> : <><i className="bi bi-trash-fill"></i> Delete</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </UserLayout>
    </>
  );
}
