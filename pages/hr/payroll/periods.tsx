'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import { useDateFormat } from '../../../lib/useDateFormat';
import CreatePeriodModal from '../../../components/hr/payroll/CreatePeriodModal';
import ApprovePeriodModal from '../../../components/hr/payroll/ApprovePeriodModal';
import MarkPaidModal from '../../../components/hr/payroll/MarkPaidModal';
import PeriodPayslipsModal from '../../../components/hr/payroll/PeriodPayslipsModal';

type Period = {
  id: number; name: string; month: string; year: number;
  period_start: string | null; period_end: string | null; pay_date: string | null;
  status: string; employee_count: number; gross_total: number; net_total: number;
};

const STATUS_BADGE: Record<string, string> = {
  Draft: 'badge-status pr-badge-draft', Processing: 'badge-status pr-badge-processing',
  Approved: 'badge-approved', Paid: 'badge-status pr-badge-paid', Closed: 'badge-status pr-badge-closed',
};

const YEARS = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i);

export default function PayrollPeriodsPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can('hr.payroll.periods', 'Create');
  const canApprove = can('hr.payroll.periods', 'Approve');
  const canDelete = can('hr.payroll.periods', 'Delete');
  const [items, setItems] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState<string>(String(new Date().getFullYear()));
  const [busy, setBusy] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [approveItem, setApproveItem] = useState<Period | null>(null);
  const [payItem, setPayItem] = useState<Period | null>(null);
  const [viewItem, setViewItem] = useState<Period | null>(null);
  const [delItem, setDelItem] = useState<Period | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/payroll/periods');
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(it =>
    (statusFilter === 'All' || it.status === statusFilter) &&
    (yearFilter === 'All' || String(it.year) === yearFilter)
  );

  const doAction = async (it: Period, action: string, confirmMsg: string) => {
    if (!window.confirm(confirmMsg)) return;
    setBusy(it.id);
    try {
      const res = await fetch(`/api/hr/payroll/periods/${it.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) { fetchItems(); if (json.message) window.alert(json.message); }
      else window.alert(json.message || 'Action failed.');
    } catch { window.alert('Network error.'); } finally { setBusy(null); }
  };

  const handleDelete = async () => {
    if (!delItem) return;
    try {
      const res = await fetch(`/api/hr/payroll/periods/${delItem.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setDelItem(null); fetchItems(); }
      else window.alert(json.message || 'Delete failed.');
    } catch { window.alert('Network error.'); }
  };

  const money = (v: any) => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 });
  const duration = (it: Period) => (it.period_start && it.period_end) ? `${fmt(it.period_start)} – ${fmt(it.period_end)}` : '—';

  return (
    <>
      <Head><title>Payroll Management | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Payroll', 'Payroll Periods']}>
        <PermissionGate moduleKey="hr.payroll.periods">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
              <div>
                <h1 className="page-title">Payroll Management</h1>
                <p className="page-subtitle">Manage employee salaries, deductions and payslips.</p>
              </div>
              <div className="d-flex gap-2">
                <Link href="/hr/payroll/periods" className="rm-btn-outline" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#2563eb' }}><i className="bi bi-calendar3"></i> Periods</Link>
                <Link href="/hr/payroll/payslips" className="rm-btn-outline"><i className="bi bi-receipt"></i> Payslips</Link>
                {canCreate && <button className="rm-btn-primary" onClick={() => setCreateOpen(true)}><i className="bi bi-plus-lg"></i> Create Period</button>}
              </div>
            </div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <select className="rm-input" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                {['Draft', 'Processing', 'Approved', 'Paid', 'Closed'].map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="rm-input" style={{ width: 140 }} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                <option value="All">All Years</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button className="rm-btn-outline" onClick={() => { setStatusFilter('All'); setYearFilter(String(new Date().getFullYear())); }}><i className="bi bi-arrow-clockwise"></i> Reset</button>
            </div>

            <div className="rm-table-wrap" style={{ overflow: 'visible' }}>
              <table className="rm-table">
                <thead>
                  <tr>
                    <th className="rm-th-module">Period</th>
                    <th className="rm-th-module">Duration</th>
                    <th className="rm-th-module">Payment Date</th>
                    <th className="rm-th-perm">Employees</th>
                    <th className="rm-th-perm">Gross (RM)</th>
                    <th className="rm-th-perm">Net (RM)</th>
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
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>
                      <i className="bi bi-calendar-x" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No payroll periods found.
                    </td></tr>
                  ) : filtered.map(it => (
                    <tr key={it.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ color: '#1f2937' }}>{it.name}</td>
                      <td className="rm-td-module" style={{ fontSize: 12.5, color: '#6b7280' }}>{duration(it)}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.pay_date ? fmt(it.pay_date) : '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className="usr-role-badge">{it.employee_count}</span></td>
                      <td className="rm-td-perm" style={{ fontSize: 13, color: '#1f2937', textAlign: 'right' }}>{money(it.gross_total)}</td>
                      <td className="rm-td-perm" style={{ fontSize: 13, color: '#16a34a', textAlign: 'right' }}>{money(it.net_total)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={STATUS_BADGE[it.status] || 'badge-pending'}>{it.status}</span></td>
                      <td className="rm-td-perm">
                        <div className="d-flex gap-2 justify-content-center">
                          {/* primary lifecycle action depends on status */}
                          {canApprove && it.status === 'Draft' && (
                            <button className="rm-action-btn pr-act-process" title="Process Payroll" disabled={busy === it.id}
                              onClick={() => doAction(it, 'process', 'Are you sure you want to process this payroll period? This will generate payslips for all active employees.')}>
                              <i className="bi bi-play-circle-fill"></i>
                            </button>
                          )}
                          {canApprove && it.status === 'Processing' && (
                            <button className="rm-action-btn pr-act-approve" title="Approve Period" disabled={busy === it.id} onClick={() => setApproveItem(it)}>
                              <i className="bi bi-check-circle-fill"></i>
                            </button>
                          )}
                          {canApprove && it.status === 'Approved' && (
                            <button className="rm-action-btn pr-act-pay" title="Mark as Paid" disabled={busy === it.id} onClick={() => setPayItem(it)}>
                              <i className="bi bi-cash-coin"></i>
                            </button>
                          )}
                          {canApprove && (it.status === 'Processing' || it.status === 'Approved') && (
                            <button className="rm-action-btn pr-act-reprocess" title="Re-process (regenerate payslips with latest data)" disabled={busy === it.id}
                              onClick={() => doAction(it, 'process', 'Re-process this payroll? Payslips will be regenerated with the latest allowances, bonuses, claims, overtime, loans and advances. The period will return to Processing for re-approval.')}>
                              <i className="bi bi-arrow-repeat"></i>
                            </button>
                          )}
                          {canApprove && it.status === 'Paid' && (
                            <button className="rm-action-btn pr-act-close" title="Close Period (Lock for Audit)" disabled={busy === it.id}
                              onClick={() => doAction(it, 'close', 'Close this payroll period and lock it for audit? This cannot be undone.')}>
                              <i className="bi bi-lock-fill"></i>
                            </button>
                          )}
                          {it.status === 'Closed' && (
                            <button className="rm-action-btn" title="Locked" disabled style={{ background: '#f3f4f6', color: '#9ca3af' }}>
                              <i className="bi bi-lock-fill"></i>
                            </button>
                          )}

                          {/* view payslips (available once processed) */}
                          <button className="rm-action-btn rm-action-view" title="View Payslips" disabled={it.status === 'Draft'}
                            style={it.status === 'Draft' ? { opacity: .4, cursor: 'not-allowed' } : undefined}
                            onClick={() => it.status !== 'Draft' && setViewItem(it)}>
                            <i className="bi bi-eye-fill"></i>
                          </button>

                          {/* delete only when draft/processing */}
                          {canDelete && ['Draft', 'Processing'].includes(it.status) && (
                            <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDelItem(it)}><i className="bi bi-trash-fill"></i></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {createOpen && <CreatePeriodModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); fetchItems(); }} />}
        {approveItem && <ApprovePeriodModal period={approveItem} onClose={() => setApproveItem(null)} onDone={() => { setApproveItem(null); fetchItems(); }} />}
        {payItem && <MarkPaidModal period={payItem} onClose={() => setPayItem(null)} onDone={() => { setPayItem(null); fetchItems(); }} />}
        {viewItem && <PeriodPayslipsModal periodId={viewItem.id} periodName={viewItem.name} fmt={fmt} onClose={() => setViewItem(null)} />}

        {delItem && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Payroll Period?</h3>
              <p>This will permanently remove <strong>{delItem.name}</strong> and any generated payslips.</p>
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
