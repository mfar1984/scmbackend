'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import { useDateFormat } from '../../../lib/useDateFormat';
import OvertimeSubmitModal from '../../../components/hr/OvertimeSubmitModal';
import ApprovalTrail from '../../../components/hr/ApprovalTrail';

type OT = {
  id: number; reference_no: string; employee_name: string | null; employee_code: string | null;
  project_name: string | null; ot_rate_name: string | null; ot_multiplier: number | null;
  ot_date: string | null; start_time: string | null; end_time: string | null;
  hours: number | null; day_type: string | null; reason: string | null; remarks: string | null; status: string;
};

const STATUSES = ['Pending', 'Approved', 'Rejected'];
const STATUS_CLASS: Record<string, string> = { Pending: 'cr-status-pending', Approved: 'cr-status-offered', Rejected: 'cr-status-rejected' };
const STATUS_BADGE: Record<string, string> = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' };

export default function OvertimeApplicationPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can('hr.overtime.application', 'Create');
  const canApprove = can('hr.overtime.application', 'Approve');
  const canReject = can('hr.overtime.application', 'Reject');
  const canDelete = can('hr.overtime.application', 'Delete');
  const canChangeStatus = canApprove || canReject;
  const [items, setItems] = useState<OT[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [viewItem, setViewItem] = useState<OT | null>(null);
  const [delItem, setDelItem] = useState<OT | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/overtime');
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
    const ms = [it.reference_no, it.employee_name, it.employee_code, it.project_name].some(v => String(v ?? '').toLowerCase().includes(q));
    const mst = statusFilter === 'All' || it.status === statusFilter;
    return ms && mst;
  });

  const statusPerm = (st: string): boolean => st === 'Rejected' ? canReject : st === 'Approved' ? canApprove : (canApprove || canReject);

  const changeStatus = async (it: OT, status: string) => {
    if (status === it.status) { setMenuOpen(null); return; }
    setUpdating(true);
    try {
      const res = await fetch(`/api/hr/overtime/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const json = await res.json();
      if (json.success) { setMenuOpen(null); fetchItems(); }
      else alert(json.message || 'Update failed.');
    } catch { alert('Network error.'); }
    finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    if (!delItem) return;
    try {
      const res = await fetch(`/api/hr/overtime/${delItem.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setDelItem(null); fetchItems(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
  };

  return (
    <>
      <Head><title>Overtime Application | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Overtime', 'Overtime Application']}>
        <PermissionGate moduleKey="hr.overtime.application">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Overtime Application</h1>
              <p className="page-subtitle">Day type (weekend / public holiday) and rate are detected automatically from settings.</p>
            </div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search employee, project or reference…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="rm-input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              {canCreate && <button className="rm-btn-primary" onClick={() => setSubmitOpen(true)}><i className="bi bi-plus-lg"></i> Submit Overtime</button>}
            </div>

            <div className="rm-table-wrap" style={{ overflow: 'visible' }}>
              <table className="rm-table">
                <thead>
                  <tr>
                    <th className="rm-th-module">Reference</th>
                    <th className="rm-th-module">Employee</th>
                    <th className="rm-th-module">Project</th>
                    <th className="rm-th-module">Date</th>
                    <th className="rm-th-perm">Day Type</th>
                    <th className="rm-th-perm">Hours</th>
                    <th className="rm-th-perm">Rate</th>
                    <th className="rm-th-perm">Status</th>
                    <th className="rm-th-perm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                      <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                      <i className="bi bi-clock-history" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No overtime applications found.
                    </td></tr>
                  ) : filtered.map(it => (
                    <tr key={it.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#6b7280' }}>{it.reference_no}</td>
                      <td className="rm-td-module">
                        <div style={{ color: '#1f2937' }}>{it.employee_name || '—'}</div>
                        {it.employee_code && <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{it.employee_code}</div>}
                      </td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.project_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.ot_date ? fmt(it.ot_date) : '—'}</td>
                      <td className="rm-td-perm" style={{ fontSize: 12.5, color: '#6b7280' }}>{it.day_type || '—'}</td>
                      <td className="rm-td-perm"><span className="usr-role-badge">{it.hours != null ? `${it.hours}h` : '—'}</span></td>
                      <td className="rm-td-perm" style={{ fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>{it.ot_rate_name ? `${it.ot_rate_name} (${Number(it.ot_multiplier).toFixed(2)}x)` : '—'}</td>
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

        {submitOpen && <OvertimeSubmitModal onClose={() => setSubmitOpen(false)} onSubmitted={() => { setSubmitOpen(false); fetchItems(); }} />}

        {viewItem && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" style={{ maxWidth: 560 }}>
              <div className="usr-modal-header">
                <div><p className="usr-modal-title">Overtime Details</p><p className="usr-modal-sub">{viewItem.reference_no}</p></div>
                <button className="usr-modal-close" onClick={() => setViewItem(null)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="usr-modal-body">
                <div className="cr-panel">
                  <div className="cr-panel-head"><i className="bi bi-clock-history"></i> Overtime Information</div>
                  <div className="cr-panel-body">
                    <div className="cr-kv"><span className="cr-kv-label">Employee</span><span className="cr-kv-value">{viewItem.employee_name} {viewItem.employee_code ? `(${viewItem.employee_code})` : ''}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Project</span><span className="cr-kv-value">{viewItem.project_name || '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Date</span><span className="cr-kv-value">{viewItem.ot_date ? fmt(viewItem.ot_date) : '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Day Type</span><span className="cr-kv-value">{viewItem.day_type || '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Time</span><span className="cr-kv-value">{viewItem.start_time || '—'} – {viewItem.end_time || '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Total Hours</span><span className="cr-kv-value accent">{viewItem.hours != null ? `${viewItem.hours} hours` : '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Rate</span><span className="cr-kv-value">{viewItem.ot_rate_name ? `${viewItem.ot_rate_name} (${Number(viewItem.ot_multiplier).toFixed(2)}x)` : '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Status</span><span className="cr-kv-value"><span className={`badge-status ${STATUS_BADGE[viewItem.status] || 'badge-pending'}`}>{viewItem.status}</span></span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Reason</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{viewItem.reason || '—'}</span></div>
                    {viewItem.remarks && <div className="cr-kv"><span className="cr-kv-label">Remarks</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{viewItem.remarks}</span></div>}
                  </div>
                </div>
                <ApprovalTrail module="overtime" id={viewItem.id} fmt={fmt} />
              </div>
              <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setViewItem(null)}>Close</button></div>
            </div>
          </div>
        )}

        {delItem && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Overtime?</h3>
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
