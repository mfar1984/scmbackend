'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../../lib/usePermissions';
import { useDateFormat } from '../../lib/useDateFormat';
import VendorModal from './VendorModal';
import VendorImportModal from './VendorImportModal';

// Days until expiry → status: expired | soon (<60d) | ok | none
function expiryInfo(d: any): { kind: 'expired' | 'soon' | 'ok' | 'none'; days: number } {
  if (!d) return { kind: 'none', days: 0 };
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return { kind: 'none', days: 0 };
  const days = Math.ceil((dt.getTime() - Date.now()) / 86400000);
  if (days < 0) return { kind: 'expired', days };
  if (days <= 60) return { kind: 'soon', days };
  return { kind: 'ok', days };
}

/** Approved-vendor directory (shared by Operations → Procurement and Web → Resources → Vendors). */
export default function VendorDirectory({ permKey = 'ops.procurement' }: { permKey?: string }) {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can(permKey, 'Create');
  const canUpdate = can(permKey, 'Update');
  const canDelete = can(permKey, 'Delete');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expiryFilter, setExpiryFilter] = useState('All');
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [vendorModal, setVendorModal] = useState<{ mode: 'create' | 'edit'; id?: number } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [del, setDel] = useState<{ id: number; name: string } | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/operations/vendors')).json(); if (j.success) setVendors(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const q = search.toLowerCase();
  const filtered = vendors.filter(v => {
    const matchSearch = [v.name, v.category, v.contact_person, v.email].some(x => String(x ?? '').toLowerCase().includes(q));
    const matchStatus = statusFilter === 'All' || v.status === statusFilter;
    const ek = expiryInfo(v.expiry_date).kind;
    const matchExpiry = expiryFilter === 'All'
      || (expiryFilter === 'Expiring' && ek === 'soon')
      || (expiryFilter === 'Expired' && ek === 'expired')
      || (expiryFilter === 'Valid' && ek === 'ok');
    return matchSearch && matchStatus && matchExpiry;
  });
  const expiringCount = vendors.filter(v => expiryInfo(v.expiry_date).kind === 'soon').length;
  const expiredCount = vendors.filter(v => expiryInfo(v.expiry_date).kind === 'expired').length;

  const doDelete = async () => {
    if (!del) return;
    const j = await (await fetch(`/api/operations/vendors/${del.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDel(null); fetchVendors(); } else alert(j.message || 'Delete failed.');
  };

  return (
    <>
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body" style={{ padding: 24 }}>
          <div className="mb-4">
            <h1 className="page-title">Approved Vendor Directory</h1>
            <p className="page-subtitle">Vendors published here appear on the public website (Resources → Technical Information → Vendors). Import approved supplier registrations or add them manually.</p>
          </div>

          <div className="d-flex gap-2 mb-3 flex-wrap">
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
              <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search vendor, category, contact or email…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="rm-input" style={{ width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <select className="rm-input" style={{ width: 170 }} value={expiryFilter} onChange={e => setExpiryFilter(e.target.value)}>
              <option value="All">All Expiry</option>
              <option value="Expiring">Expiring soon (≤60d)</option>
              <option value="Expired">Expired</option>
              <option value="Valid">Valid</option>
            </select>
            {canCreate && <button className="rm-btn-outline" onClick={() => setImportOpen(true)}><i className="bi bi-box-arrow-in-down"></i> Import from Suppliers</button>}
            {canCreate && <button className="rm-btn-primary" onClick={() => setVendorModal({ mode: 'create' })}><i className="bi bi-plus-lg"></i> Add Vendor</button>}
          </div>

          {(expiringCount > 0 || expiredCount > 0) && (
            <div className="d-flex gap-2 flex-wrap mb-3">
              {expiredCount > 0 && (
                <button onClick={() => setExpiryFilter('Expired')} style={{ border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                  <i className="bi bi-exclamation-octagon-fill me-1"></i>{expiredCount} approval{expiredCount !== 1 ? 's' : ''} expired
                </button>
              )}
              {expiringCount > 0 && (
                <button onClick={() => setExpiryFilter('Expiring')} style={{ border: '1px solid #fcd34d', background: '#fffbeb', color: '#b45309', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                  <i className="bi bi-clock-history me-1"></i>{expiringCount} expiring within 60 days
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : (
            <div className="rm-table-wrap">
              <table className="rm-table" style={{ minWidth: 900 }}>
                <thead><tr>
                  <th className="rm-th-perm" style={{ width: 40 }}>#</th>
                  <th className="rm-th-module">Vendor</th><th className="rm-th-perm">Category</th>
                  <th className="rm-th-module">Contact</th><th className="rm-th-perm">Phone</th>
                  <th className="rm-th-perm">Expiry</th>
                  <th className="rm-th-perm">Source</th><th className="rm-th-perm">Status</th>
                  <th className="rm-th-perm">Website</th>
                  <th className="rm-th-perm">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-truck" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No vendors. Add one or import from approved suppliers.</td></tr>
                  ) : filtered.map((v, i) => (
                    <tr key={v.id} className="rm-data-row">
                      <td className="rm-td-perm" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                      <td className="rm-td-module" style={{ color: '#1f2937' }}>{v.name}{v.email ? <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{v.email}</div> : null}</td>
                      <td className="rm-td-perm" style={{ fontSize: 13, color: '#6b7280' }}>{v.category || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{v.contact_person || '—'}</td>
                      <td className="rm-td-perm" style={{ fontSize: 13, color: '#6b7280' }}>{v.phone || '—'}</td>
                      <td className="rm-td-perm" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                        {(() => {
                          const ex = expiryInfo(v.expiry_date);
                          if (ex.kind === 'none') return <span style={{ color: '#9ca3af' }}>—</span>;
                          const color = ex.kind === 'expired' ? '#b91c1c' : ex.kind === 'soon' ? '#b45309' : '#15803d';
                          const bg = ex.kind === 'expired' ? '#fef2f2' : ex.kind === 'soon' ? '#fffbeb' : '#f0fdf4';
                          return <span style={{ color, background: bg, padding: '3px 9px', borderRadius: 8, fontWeight: 600 }} title={ex.kind === 'expired' ? `Expired ${-ex.days}d ago` : ex.kind === 'soon' ? `Expires in ${ex.days}d` : 'Valid'}>{fmt(v.expiry_date)}</span>;
                        })()}
                      </td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span style={{ background: v.source === 'Registration' ? '#eff6ff' : '#f1f5f9', color: v.source === 'Registration' ? '#2563eb' : '#64748b', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>{v.source === 'Registration' ? 'Supplier' : 'Manual'}</span></td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${v.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{v.status}</span></td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}>{v.published === 0 || v.published === false ? <span title="Hidden from website" style={{ color: '#9ca3af', fontSize: 16 }}><i className="bi bi-eye-slash"></i></span> : <span title="Shown on website" style={{ color: '#0052cc', fontSize: 16 }}><i className="bi bi-globe"></i></span>}</td>
                      <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                        {canUpdate && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => setVendorModal({ mode: 'edit', id: v.id })}><i className="bi bi-pencil-fill"></i></button>}
                        {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDel({ id: v.id, name: v.name })}><i className="bi bi-trash-fill"></i></button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>Showing {filtered.length} of {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {vendorModal && <VendorModal mode={vendorModal.mode} vendorId={vendorModal.id} onClose={() => setVendorModal(null)} onSaved={() => { setVendorModal(null); fetchVendors(); }} />}
      {importOpen && <VendorImportModal onClose={() => { setImportOpen(false); fetchVendors(); }} onImported={fetchVendors} />}

      {del && (
        <div className="rm-modal-overlay">
          <div className="rm-modal">
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Vendor?</h3>
            <p>This permanently removes <strong>{del.name}</strong>.</p>
            <div className="rm-modal-actions">
              <button className="rm-btn-outline" onClick={() => setDel(null)}>Cancel</button>
              <button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
