'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import { useDateFormat } from '../../../lib/useDateFormat';
import ApplicantViewModal from '../../../components/career/ApplicantViewModal';
import ScheduleInterviewModal from '../../../components/career/ScheduleInterviewModal';

type Applicant = {
  id: number; application_no: string; full_name: string; email: string | null;
  position_applied: string | null; department: string | null; status: string;
  submitted_at: string; converted_employee_id: number | null;
  interview_substatus?: string | null;
  [k: string]: any;
};

const STATUSES = ['Pending', 'Shortlisted', 'Interview Scheduled', 'Offered', 'Rejected', 'Hired'];
const STATUS_CLASS: Record<string, string> = {
  Pending: 'cr-status-pending', Shortlisted: 'cr-status-shortlisted',
  'Interview Scheduled': 'cr-status-interview', Offered: 'cr-status-offered',
  Rejected: 'cr-status-rejected', Hired: 'cr-status-hired',
};
const STATUS_BADGE: Record<string, string> = {
  Pending: 'badge-pending', Shortlisted: 'badge-review', 'Interview Scheduled': 'badge-review',
  Offered: 'badge-approved', Rejected: 'badge-rejected', Hired: 'badge-approved',
};

function Avatar({ name }: { name: string }) {
  return <div className="usr-avatar">{(name || '?').charAt(0).toUpperCase()}</div>;
}

export default function ApplicantsPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canApprove = can('hr.career.applicants', 'Approve');
  const canReject = can('hr.career.applicants', 'Reject');
  const canChangeStatus = canApprove || canReject || can('hr.career.applicants', 'Update');
  const [items, setItems]   = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [viewItem, setViewItem] = useState<Applicant | null>(null);
  const [scheduleItem, setScheduleItem] = useState<Applicant | null>(null);
  const [hireResult, setHireResult] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/career/applicants');
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // close status menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = items.filter(a => {
    const q = search.toLowerCase();
    const matchSearch =
      a.full_name.toLowerCase().includes(q) ||
      a.application_no.toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.position_applied || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusPerm = (st: string): boolean => st === 'Rejected' ? canReject : canApprove;

  const changeStatus = async (a: Applicant, status: string) => {
    if (status === a.status && status !== 'Interview Scheduled') { setMenuOpen(null); return; }

    // Interview Scheduled → open the schedule modal (sends email, sets sub-status)
    if (status === 'Interview Scheduled') {
      setMenuOpen(null);
      setScheduleItem(a);
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/hr/career/applicants/${a.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setMenuOpen(null);
        if (status === 'Hired' && json.employee_code) {
          setHireResult(`${a.full_name} has been hired and added to the Employee List as ${json.employee_code}.`);
        } else if (status === 'Hired' && json.already) {
          setHireResult(`${a.full_name} is already linked to an employee record.`);
        }
        fetchItems();
      } else alert(json.message || 'Update failed.');
    } catch { alert('Network error.'); }
    finally { setUpdating(false); }
  };

  return (
    <>
      <Head><title>Applicants | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Career', 'Applicants']}>
        <PermissionGate moduleKey="hr.career.applicants">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Applicants</h1>
              <p className="page-subtitle">Review candidates and update their status. Setting status to Hired creates an employee record automatically.</p>
            </div>

            {hireResult && (
              <div className="rm-saved-banner mb-3"><i className="bi bi-check-circle-fill"></i> {hireResult}</div>
            )}

            {/* Toolbar */}
            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search name, app no, email or position…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="rm-input" style={{ width: 190 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="rm-table-wrap" style={{ overflow: 'visible' }}>
              <table className="rm-table">
                <thead>
                  <tr>
                    <th className="rm-th-module" style={{ width: 40 }}>#</th>
                    <th className="rm-th-module">Application No</th>
                    <th className="rm-th-module">Candidate</th>
                    <th className="rm-th-module">Position Applied</th>
                    <th className="rm-th-perm">Status</th>
                    <th className="rm-th-perm">Applied Date</th>
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
                      <i className="bi bi-person-lines-fill" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No applicants found.
                    </td></tr>
                  ) : filtered.map((a, i) => (
                    <tr key={a.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#6b7280' }}>{a.application_no}</td>
                      <td className="rm-td-module">
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={a.full_name} />
                          <div>
                            <div style={{ color: '#1f2937' }}>{a.full_name}</div>
                            {a.email && <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{a.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{a.position_applied || '—'}</td>
                      <td className="rm-td-perm">
                        <span className={`badge-status ${STATUS_BADGE[a.status] || 'badge-pending'}`}>{a.status}</span>
                        {a.status === 'Interview Scheduled' && a.interview_substatus && (
                          <span className={`badge-status ${a.interview_substatus === 'Confirmed' ? 'badge-approved' : 'badge-pending'}`} style={{ marginLeft: 4 }}>
                            {a.interview_substatus}
                          </span>
                        )}
                      </td>
                      <td className="rm-td-perm" style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmt(a.submitted_at)}</td>
                      <td className="rm-td-perm" style={{ position: 'relative' }}>
                        <div className="d-flex gap-2 justify-content-center">
                          {canChangeStatus && (
                            <button className="rm-action-btn rm-action-edit" title="Change status" onClick={() => setMenuOpen(menuOpen === a.id ? null : a.id)}>
                              <i className="bi bi-list-ul"></i>
                            </button>
                          )}
                          <button className="rm-action-btn rm-action-view" title="View details" onClick={() => setViewItem(a)}>
                            <i className="bi bi-eye-fill"></i>
                          </button>
                        </div>
                        {menuOpen === a.id && (
                          <div className="cr-status-menu" ref={menuRef}>
                            {STATUSES.filter(statusPerm).map(s => (
                              <button key={s}
                                className={`cr-status-item ${STATUS_CLASS[s]} ${s === a.status ? 'is-current' : ''}`}
                                disabled={updating}
                                onClick={() => changeStatus(a, s)}>
                                {s}{s === a.status ? ' ✓' : ''}
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
              Showing {filtered.length} of {items.length} applicant{items.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {viewItem && <ApplicantViewModal applicant={viewItem} fmt={fmt} onClose={() => setViewItem(null)} />}
        {scheduleItem && (
          <ScheduleInterviewModal
            applicant={scheduleItem}
            onClose={() => setScheduleItem(null)}
            onScheduled={(msg) => {
              setScheduleItem(null);
              setHireResult(msg);
              fetchItems();
            }}
          />
        )}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
