'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import PermissionGate from '../../components/PermissionGate';
import { usePermissions } from '../../lib/usePermissions';
import { useDateFormat } from '../../lib/useDateFormat';
import PartnerViewModal from '../../components/application/PartnerViewModal';

type Partner = {
  id: number; reference_no: string; company: string; email: string | null;
  industry: string | null; partner_tier: string | null; status: string; submitted_at: string;
  [k: string]: any;
};

const STATUSES = ['Pending', 'On Progress', 'Approved', 'Active', 'Rejected'];
const STATUS_CLASS: Record<string, string> = {
  Pending: 'cr-status-pending', 'On Progress': 'cr-status-interview',
  Approved: 'cr-status-offered', Active: 'cr-status-hired', Rejected: 'cr-status-rejected',
};
const STATUS_BADGE: Record<string, string> = {
  Pending: 'badge-pending', 'On Progress': 'badge-review',
  Approved: 'badge-approved', Active: 'badge-approved', Rejected: 'badge-rejected',
};

export default function StrategicPartnerPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canUpdate = can('app.strategic_partner', 'Update');
  const canApprove = can('app.strategic_partner', 'Approve');
  const canReject = can('app.strategic_partner', 'Reject');
  const canDelete = can('app.strategic_partner', 'Delete');
  const [items, setItems]   = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [viewItem, setViewItem] = useState<Partner | null>(null);
  const [delItem, setDelItem]   = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/application/partners');
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = items.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.company.toLowerCase().includes(q) ||
      p.reference_no.toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const changeStatus = async (p: Partner, status: string) => {
    if (status === p.status) { setMenuOpen(null); return; }
    setUpdating(true);
    try {
      const res = await fetch(`/api/application/partners/${p.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) { setMenuOpen(null); fetchItems(); }
      else alert(json.message || 'Update failed.');
    } catch { alert('Network error.'); }
    finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    if (!delItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/application/partners/${delItem.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setDelItem(null); fetchItems(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
    finally { setDeleting(false); }
  };

  // Which permission a target status requires.
  const statusPerm = (st: string): boolean => {
    if (st === 'Rejected') return canReject;
    if (st === 'Approved' || st === 'Active') return canApprove;
    return canUpdate; // Pending, On Progress
  };
  const canChangeStatus = canUpdate || canApprove || canReject;

  return (
    <>
      <Head><title>Strategic Partner Applications | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Application', 'Strategic Partner']}>
        <PermissionGate moduleKey="app.strategic_partner">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Strategic Partner Applications</h1>
              <p className="page-subtitle">Review partnership applications submitted via the website and move them through the approval workflow.</p>
            </div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search company, reference or email…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="rm-input" style={{ width: 170 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="rm-table-wrap" style={{ overflow: 'visible' }}>
              <table className="rm-table">
                <thead>
                  <tr>
                    <th className="rm-th-module" style={{ width: 40 }}>#</th>
                    <th className="rm-th-module">Reference</th>
                    <th className="rm-th-module">Company</th>
                    <th className="rm-th-module">Industry</th>
                    <th className="rm-th-perm">Tier</th>
                    <th className="rm-th-perm">Status</th>
                    <th className="rm-th-perm">Submitted</th>
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
                      <i className="bi bi-handshake" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No partner applications found.
                    </td></tr>
                  ) : filtered.map((p, i) => (
                    <tr key={p.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#6b7280' }}>{p.reference_no}</td>
                      <td className="rm-td-module">
                        <div style={{ color: '#1f2937' }}>{p.company}</div>
                        {p.email && <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{p.email}</div>}
                      </td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{p.industry || '—'}</td>
                      <td className="rm-td-perm" style={{ fontSize: 12.5, color: '#6b7280' }}>{p.partner_tier || '—'}</td>
                      <td className="rm-td-perm"><span className={`badge-status ${STATUS_BADGE[p.status] || 'badge-pending'}`}>{p.status}</span></td>
                      <td className="rm-td-perm" style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmt(p.submitted_at)}</td>
                      <td className="rm-td-perm" style={{ position: 'relative' }}>
                        <div className="d-flex gap-2 justify-content-center">
                          {canChangeStatus && (
                            <button className="rm-action-btn rm-action-edit" title="Change status" onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}><i className="bi bi-list-ul"></i></button>
                          )}
                          <button className="rm-action-btn rm-action-view" title="View details" onClick={() => setViewItem(p)}><i className="bi bi-eye-fill"></i></button>
                          {canDelete && (
                            <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDelItem(p)}><i className="bi bi-trash-fill"></i></button>
                          )}
                        </div>
                        {menuOpen === p.id && (
                          <div className="cr-status-menu" ref={menuRef}>
                            {STATUSES.filter(statusPerm).map(st => (
                              <button key={st} className={`cr-status-item ${STATUS_CLASS[st]} ${st === p.status ? 'is-current' : ''}`} disabled={updating} onClick={() => changeStatus(p, st)}>
                                {st}{st === p.status ? ' ✓' : ''}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>
              Showing {filtered.length} of {items.length} application{items.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {viewItem && <PartnerViewModal partner={viewItem} fmt={fmt} onClose={() => setViewItem(null)} />}

        {delItem && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Application?</h3>
              <p>This will permanently remove <strong>{delItem.company}</strong>.</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setDelItem(null)} disabled={deleting}>Cancel</button>
                <button className="rm-btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <><span className="spinner-border spinner-border-sm me-1"></span> Deleting...</> : <><i className="bi bi-trash-fill"></i> Delete</>}
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
