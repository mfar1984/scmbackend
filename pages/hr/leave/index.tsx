'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import { useDateFormat } from '../../../lib/useDateFormat';
import LeaveApplyModal from '../../../components/hr/LeaveApplyModal';
import ApprovalTrail from '../../../components/hr/ApprovalTrail';

type Leave = {
  id: number; reference_no: string; employee_name: string | null; employee_code: string | null;
  leave_type_name: string | null; start_date: string | null; end_date: string | null;
  days: number | null; reason: string | null; remarks: string | null; status: string; has_document?: number;
};

const STATUSES = ['Pending', 'Approved', 'Rejected'];
const STATUS_CLASS: Record<string, string> = { Pending: 'cr-status-pending', Approved: 'cr-status-offered', Rejected: 'cr-status-rejected' };
const STATUS_BADGE: Record<string, string> = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' };

export default function LeaveApplicationPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can('hr.leave.application', 'Create');
  const canApprove = can('hr.leave.application', 'Approve');
  const canReject = can('hr.leave.application', 'Reject');
  const canDelete = can('hr.leave.application', 'Delete');
  const canChangeStatus = canApprove || canReject;
  const [items, setItems] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Leave | null>(null);
  const [delItem, setDelItem] = useState<Leave | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/leave');
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

  const filtered = items.filter(it => {
    const q = search.toLowerCase();
    const ms = [it.reference_no, it.employee_name, it.employee_code].some(v => String(v ?? '').toLowerCase().includes(q));
    const mst = statusFilter === 'All' || it.status === statusFilter;
    return ms && mst;
  });

  const statusPerm = (st: string): boolean => st === 'Rejected' ? canReject : st === 'Approved' ? canApprove : (canApprove || canReject);

  const changeStatus = async (it: Leave, status: string) => {
    if (status === it.status) { setMenuOpen(null); return; }
    setUpdating(true);
    try {
      const res = await fetch(`/api/hr/leave/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const json = await res.json();
      if (json.success) { setMenuOpen(null); fetchItems(); }
      else alert(json.message || 'Update failed.');
    } catch { alert('Network error.'); }
    finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    if (!delItem) return;
    try {
      const res = await fetch(`/api/hr/leave/${delItem.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setDelItem(null); fetchItems(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
  };

  return (
    <>
      <Head><title>Leave Application | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Leave', 'Leave Application']}>
        <PermissionGate moduleKey="hr.leave.application">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Leave Application</h1>
              <p className="page-subtitle">Manage employee leave requests and approvals.</p>
            </div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search employee name or reference…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="rm-input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              {canCreate && <button className="rm-btn-primary" onClick={() => setApplyOpen(true)}><i className="bi bi-plus-lg"></i> Apply for Leave</button>}
            </div>

            <div className="rm-table-wrap" style={{ overflow: 'visible' }}>
              <table className="rm-table">
                <thead>
                  <tr>
                    <th className="rm-th-module">Reference</th>
                    <th className="rm-th-module">Employee</th>
                    <th className="rm-th-module">Leave Type</th>
                    <th className="rm-th-module">From</th>
                    <th className="rm-th-module">To</th>
                    <th className="rm-th-perm">Days</th>
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
                      <i className="bi bi-calendar-check" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No leave applications found.
                    </td></tr>
                  ) : filtered.map(it => (
                    <tr key={it.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#6b7280' }}>{it.reference_no}</td>
                      <td className="rm-td-module">
                        <div style={{ color: '#1f2937' }}>{it.employee_name || '—'}</div>
                        {it.employee_code && <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{it.employee_code}</div>}
                      </td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.leave_type_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.start_date ? fmt(it.start_date) : '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.end_date ? fmt(it.end_date) : '—'}</td>
                      <td className="rm-td-perm"><span className="usr-role-badge">{it.days ?? '—'}</span></td>
                      <td className="rm-td-perm"><span className={`badge-status ${STATUS_BADGE[it.status] || 'badge-pending'}`}>{it.status}</span></td>
                      <td className="rm-td-perm" style={{ position: 'relative' }}>
                        <div className="d-flex gap-2 justify-content-center">
                          <button className="rm-action-btn rm-action-view" title="View" onClick={() => setViewItem(it)}><i className="bi bi-eye-fill"></i></button>
                          {canChangeStatus && <button className="rm-action-btn rm-action-edit" title="Change status" onClick={() => setMenuOpen(menuOpen === it.id ? null : it.id)}><i className="bi bi-list-ul"></i></button>}
                          {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDelItem(it)}><i className="bi bi-trash-fill"></i></button>}
                        </div>
                        {menuOpen === it.id && (
                          <div className="cr-status-menu" ref={menuRef}>
                            {STATUSES.filter(statusPerm).map(s => (
                              <button key={s} className={`cr-status-item ${STATUS_CLASS[s]} ${s === it.status ? 'is-current' : ''}`} disabled={updating} onClick={() => changeStatus(it, s)}>
                                {s}{s === it.status ? ' ✓' : ''}
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
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>Showing {filtered.length} of {items.length} application{items.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {applyOpen && <LeaveApplyModal onClose={() => setApplyOpen(false)} onSubmitted={() => { setApplyOpen(false); fetchItems(); }} />}

        {viewItem && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" style={{ maxWidth: 560 }}>
              <div className="usr-modal-header">
                <div><p className="usr-modal-title">Leave Details</p><p className="usr-modal-sub">{viewItem.reference_no}</p></div>
                <button className="usr-modal-close" onClick={() => setViewItem(null)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="usr-modal-body">
                <div className="cr-panel">
                  <div className="cr-panel-head"><i className="bi bi-calendar-check-fill"></i> Leave Information</div>
                  <div className="cr-panel-body">
                    <div className="cr-kv"><span className="cr-kv-label">Employee</span><span className="cr-kv-value">{viewItem.employee_name} {viewItem.employee_code ? `(${viewItem.employee_code})` : ''}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Leave Type</span><span className="cr-kv-value">{viewItem.leave_type_name || '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">From</span><span className="cr-kv-value">{viewItem.start_date ? fmt(viewItem.start_date) : '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">To</span><span className="cr-kv-value">{viewItem.end_date ? fmt(viewItem.end_date) : '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Total Days</span><span className="cr-kv-value accent">{viewItem.days ?? '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Status</span><span className="cr-kv-value"><span className={`badge-status ${STATUS_BADGE[viewItem.status] || 'badge-pending'}`}>{viewItem.status}</span></span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Reason</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{viewItem.reason || '—'}</span></div>
                    {viewItem.remarks && <div className="cr-kv"><span className="cr-kv-label">Remarks</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{viewItem.remarks}</span></div>}
                    {(viewItem.has_document === 1 || (viewItem.has_document as any) === true) && (
                      <div className="cr-kv"><span className="cr-kv-label">Document</span><span className="cr-kv-value"><a href={`/api/hr/leave/${viewItem.id}?doc=1`} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}><i className="bi bi-paperclip"></i> View Supporting Document</a></span></div>
                    )}
                  </div>
                </div>
                <ApprovalTrail module="leave" id={viewItem.id} fmt={fmt} />
              </div>
              <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setViewItem(null)}>Close</button></div>
            </div>
          </div>
        )}

        {delItem && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Leave?</h3>
              <p>This will permanently remove <strong>{delItem.reference_no}</strong>.</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setDelItem(null)}>Cancel</button>
                <button className="rm-btn-danger" onClick={handleDelete}><i className="bi bi-trash-fill"></i> Delete</button>
              </div>
            </div>
          </div>
        )}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
