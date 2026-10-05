'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import UserLayout from '../../components/UserLayout';
import { usePermissions } from '../../lib/usePermissions';
import { useDateFormat } from '../../lib/useDateFormat';

type UserStatus = 'Active' | 'Inactive' | 'Suspended';
type ClientRecord = {
  id: number; name: string; contact_person: string; email: string; phone: string;
  role: string; role_id: number | null; status: UserStatus; last_login: string;
  sector?: string; address?: string; website?: string; join_date?: string;
};
type RoleOption = { id: number; name: string };

const SECTORS = ['Government', 'Education', 'Private', 'Healthcare', 'Other'];

function StatusBadge({ status }: { status: UserStatus }) {
  const cls = status === 'Active' ? 'badge-approved' : status === 'Suspended' ? 'badge-pending' : 'badge-rejected';
  return <span className={`badge-status ${cls}`}>{status}</span>;
}
function SectorBadge({ sector }: { sector?: string }) {
  if (!sector) return <span style={{ color: '#9ca3af' }}>—</span>;
  const bg: Record<string, string>   = { Government: '#dbeafe', Education: '#dcfce7', Private: '#fef9c3', Healthcare: '#fce7f3', Other: '#f3f4f6' };
  const txt: Record<string, string>  = { Government: '#1d4ed8', Education: '#15803d', Private: '#a16207', Healthcare: '#be185d', Other: '#374151' };
  return <span style={{ background: bg[sector] || '#f3f4f6', color: txt[sector] || '#374151', fontSize: 11, padding: '2px 9px', borderRadius: 12 }}>{sector}</span>;
}

/* ── Create Modal ── */
function CreateModal({ roles, onClose, onSaved }: { roles: RoleOption[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName]       = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [sector, setSector]   = useState('');
  const [roleId, setRoleId]   = useState('');
  const [status, setStatus]   = useState<UserStatus>('Active');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [pw, setPw]           = useState('');
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())    e.name    = 'Required';
    if (!contact.trim()) e.contact = 'Required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email required';
    if (!phone.trim())   e.phone   = 'Required';
    if (!pw.trim() || pw.length < 6) e.pw = 'Min 6 characters';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setApiError('');
    try {
      const res  = await fetch('/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact_person: contact, email, phone, password: pw, role_id: roleId ? parseInt(roleId) : null, user_type: 'client', status, sector, address, website }),
      });
      const json = await res.json();
      if (json.success) { onSaved(); onClose(); }
      else setApiError(json.message || 'Failed to create.');
    } catch { setApiError('Network error.'); }
    finally { setSaving(false); }
  };

  const rows = [
    { label: 'Company / Org Name', req: true,  field: <><input className={`rm-input ${errors.name ? 'usr-input-err' : ''}`} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Politeknik Malaysia" />{errors.name && <span className="usr-err-msg">{errors.name}</span>}</> },
    { label: 'Contact Person',     req: true,  field: <><input className={`rm-input ${errors.contact ? 'usr-input-err' : ''}`} value={contact} onChange={e => setContact(e.target.value)} placeholder="Person in charge (PIC)" />{errors.contact && <span className="usr-err-msg">{errors.contact}</span>}</> },
    { label: 'Email Address',      req: true,  field: <><input type="email" className={`rm-input ${errors.email ? 'usr-input-err' : ''}`} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@organisation.com" />{errors.email && <span className="usr-err-msg">{errors.email}</span>}</> },
    { label: 'Phone Number',       req: true,  field: <><input className={`rm-input ${errors.phone ? 'usr-input-err' : ''}`} value={phone} onChange={e => setPhone(e.target.value)} placeholder="03-XXXX XXXX" />{errors.phone && <span className="usr-err-msg">{errors.phone}</span>}</> },
    { label: 'Password',           req: true,  field: <><input type="password" className={`rm-input ${errors.pw ? 'usr-input-err' : ''}`} value={pw} onChange={e => setPw(e.target.value)} placeholder="Min 6 characters" />{errors.pw && <span className="usr-err-msg">{errors.pw}</span>}</> },
    { label: 'Sector',             req: false, field: <select className="rm-input" value={sector} onChange={e => setSector(e.target.value)}><option value="">Select sector…</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</select> },
    { label: 'Access Level',       req: false, field: <select className="rm-input" value={roleId} onChange={e => setRoleId(e.target.value)}><option value="">— Select Role —</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select> },
    { label: 'Status',             req: false, field: <select className="rm-input" value={status} onChange={e => setStatus(e.target.value as UserStatus)}><option>Active</option><option>Inactive</option><option>Suspended</option></select> },
    { label: 'Address',            req: false, field: <input className="rm-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Organisation address" /> },
    { label: 'Website',            req: false, field: <input className="rm-input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.organisation.com" /> },
  ];

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal">
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Add Client</p><p className="usr-modal-sub">Register a new client account</p></div>
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
              {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-plus-lg"></i> Add Client</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Edit Modal ── */
function EditModal({ client, roles, onClose, onSaved }: { client: ClientRecord; roles: RoleOption[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName]       = useState(client.name);
  const [contact, setContact] = useState(client.contact_person || '');
  const [email, setEmail]     = useState(client.email);
  const [phone, setPhone]     = useState(client.phone);
  const [sector, setSector]   = useState(client.sector ?? '');
  const [roleId, setRoleId]   = useState(client.role_id ? String(client.role_id) : '');
  const [status, setStatus]   = useState<UserStatus>(client.status);
  const [address, setAddress] = useState(client.address ?? '');
  const [website, setWebsite] = useState(client.website ?? '');
  const [pw, setPw]           = useState('');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setApiError('');
    try {
      const res  = await fetch(`/api/users/${client.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact_person: contact, email, phone, password: pw || undefined, role_id: roleId ? parseInt(roleId) : null, status, sector, address, website }),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); setTimeout(() => { setSaved(false); onSaved(); onClose(); }, 1200); }
      else setApiError(json.message || 'Failed to update.');
    } catch { setApiError('Network error.'); }
    finally { setSaving(false); }
  };

  const rows = [
    { label: 'Company / Org Name', req: true,  field: <input className="rm-input" value={name}    onChange={e => setName(e.target.value)}    required /> },
    { label: 'Contact Person',     req: true,  field: <input className="rm-input" value={contact} onChange={e => setContact(e.target.value)} required /> },
    { label: 'Email Address',      req: true,  field: <input type="email" className="rm-input" value={email} onChange={e => setEmail(e.target.value)} required /> },
    { label: 'Phone Number',       req: false, field: <input className="rm-input" value={phone}   onChange={e => setPhone(e.target.value)} /> },
    { label: 'New Password',       req: false, field: <input type="password" className="rm-input" value={pw} onChange={e => setPw(e.target.value)} placeholder="Leave blank to keep current" /> },
    { label: 'Sector',             req: false, field: <select className="rm-input" value={sector} onChange={e => setSector(e.target.value)}><option value="">Select sector…</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</select> },
    { label: 'Access Level',       req: false, field: <select className="rm-input" value={roleId} onChange={e => setRoleId(e.target.value)}><option value="">— Select Role —</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select> },
    { label: 'Status',             req: false, field: <select className="rm-input" value={status} onChange={e => setStatus(e.target.value as UserStatus)}><option>Active</option><option>Inactive</option><option>Suspended</option></select> },
    { label: 'Address',            req: false, field: <input className="rm-input" value={address} onChange={e => setAddress(e.target.value)} /> },
    { label: 'Website',            req: false, field: <input className="rm-input" value={website} onChange={e => setWebsite(e.target.value)} /> },
  ];

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal">
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Edit Client</p><p className="usr-modal-sub">{client.name}</p></div>
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
function ShowModal({ client, onClose, onEdit, fmt }: {
  client: ClientRecord; onClose: () => void; onEdit: () => void;
  fmt: (d: any, t?: boolean) => string;
}) {
  const rows = [
    { label: 'Contact Person', value: client.contact_person || '—' },
    { label: 'Email Address',  value: client.email },
    { label: 'Phone Number',   value: client.phone || '—' },
    { label: 'Sector',         value: <SectorBadge sector={client.sector} /> },
    { label: 'Access Level',   value: client.role || '—' },
    { label: 'Address',        value: client.address || '—' },
    { label: 'Website',        value: client.website ? <a href={`https://${client.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>{client.website}</a> : '—' },
    { label: 'Join Date',      value: client.join_date ? fmt(client.join_date) : '—' },
    { label: 'Last Login',     value: fmt(client.last_login, true) },
    { label: 'Status',         value: <StatusBadge status={client.status} /> },
  ];
  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal">
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Client Details</p><p className="usr-modal-sub">Read-only view</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          <div className="usr-show-profile">
            <div className="usr-show-avatar" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="usr-show-name">{client.name}</div>
              <div className="usr-show-role">{client.contact_person || '—'}</div>
              <div className="d-flex align-items-center gap-2 mt-1">
                <SectorBadge sector={client.sector} />
                <StatusBadge status={client.status} />
              </div>
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
export default function ClientPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can('settings.users.client', 'Create');
  const canUpdate = can('settings.users.client', 'Update');
  const canDelete = can('settings.users.client', 'Delete');
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [roles, setRoles]     = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [sf, setSf]           = useState('All');
  const [sectorF, setSectorF] = useState('All');
  const [modal, setModal]     = useState<'create' | 'edit' | 'show' | 'delete' | null>(null);
  const [selected, setSelected] = useState<ClientRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/users?type=client');
      const json = await res.json();
      if (json.success) setClients(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchClients();
    fetch('/api/roles/list').then(r => r.json()).then(j => { if (j.success) setRoles(j.data); });
  }, [fetchClients]);

  const refresh = useCallback(() => {
    fetchClients();
    setRefreshKey(k => k + 1);
  }, [fetchClients]);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.contact_person || '').toLowerCase().includes(q))
      && (sf === 'All' || c.status === sf)
      && (sectorF === 'All' || c.sector === sectorF);
  });

  const open = (type: typeof modal, c?: ClientRecord) => { if (c) setSelected(c); setModal(type); };

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
      <Head><title>Client — Users Management | ATLINE Admin</title></Head>
      <UserLayout activeTab="client" breadcrumb={['Settings', 'Users Management', 'Client']} refreshKey={refreshKey}>

        <div className="d-flex gap-2 mb-3 flex-wrap">
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
            <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search company, email or contact…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="rm-input" style={{ width: 140 }} value={sf} onChange={e => setSf(e.target.value)}>
            <option value="All">All Status</option>
            <option>Active</option><option>Inactive</option><option>Suspended</option>
          </select>
          <select className="rm-input" style={{ width: 140 }} value={sectorF} onChange={e => setSectorF(e.target.value)}>
            <option value="All">All Sectors</option>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="usr-btn-reset" onClick={() => { setSearch(''); setSf('All'); setSectorF('All'); }}>
            <i className="bi bi-arrow-counterclockwise"></i> Reset
          </button>
          {canCreate && (
            <button className="rm-btn-primary" onClick={() => open('create')}>
              <i className="bi bi-plus-lg"></i> Add Client
            </button>
          )}
        </div>

        <div className="rm-table-wrap">
          <table className="rm-table">
            <thead>
              <tr>
                <th className="rm-th-module" style={{ width: 40 }}>#</th>
                <th className="rm-th-module">Company / Organisation</th>
                <th className="rm-th-module">Contact Person</th>
                <th className="rm-th-perm">Sector</th>
                <th className="rm-th-perm">Access</th>
                <th className="rm-th-perm">Status</th>
                <th className="rm-th-perm">Last Login</th>
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
                  <i className="bi bi-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No clients found.
                </td></tr>
              ) : filtered.map((c, i) => (
                <tr key={c.id} className="rm-data-row">
                  <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                  <td className="rm-td-module">
                    <div className="d-flex align-items-center gap-2">
                      <div className="usr-avatar" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>{c.name.charAt(0)}</div>
                      <div>
                        <div style={{ color: '#1f2937', fontSize: 13 }}>{c.name}</div>
                        <div style={{ color: '#9ca3af', fontSize: 11 }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '9px 16px', fontSize: 13, color: '#6b7280' }}>{c.contact_person || '—'}</td>
                  <td className="rm-td-perm"><SectorBadge sector={c.sector} /></td>
                  <td className="rm-td-perm"><span className="usr-role-badge">{c.role || '—'}</span></td>
                  <td className="rm-td-perm"><StatusBadge status={c.status} /></td>
                  <td className="rm-td-perm" style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmt(c.last_login, true)}</td>
                  <td className="rm-td-perm">
                    <div className="d-flex gap-2 justify-content-center">
                      <button className="rm-action-btn rm-action-view"   onClick={() => open('show',   c)}><i className="bi bi-eye-fill"></i></button>
                      {canUpdate && <button className="rm-action-btn rm-action-edit"   onClick={() => open('edit',   c)}><i className="bi bi-pencil-fill"></i></button>}
                      {canDelete && <button className="rm-action-btn rm-action-delete" onClick={() => open('delete', c)}><i className="bi bi-trash-fill"></i></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>
          Showing {filtered.length} of {clients.length} client{clients.length !== 1 ? 's' : ''}
        </div>

        {modal === 'create' && <CreateModal roles={roles} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal === 'edit'   && selected && <EditModal client={selected} roles={roles} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal === 'show'   && selected && <ShowModal client={selected} onClose={() => setModal(null)} onEdit={() => setModal('edit')} fmt={fmt} />}
        {modal === 'delete' && selected && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Client?</h3>
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
