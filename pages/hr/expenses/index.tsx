'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import { useDateFormat } from '../../../lib/useDateFormat';
import ExpenseSubmitModal from '../../../components/hr/ExpenseSubmitModal';
import ExpenseViewModal from '../../../components/hr/ExpenseViewModal';

type Expense = {
  id: number; reference_no: string; employee_name: string | null; employee_code: string | null;
  category_name: string | null; expense_date: string | null; vendor_name: string | null;
  amount: number | null; item_count: number; status: string;
};

const STATUSES = ['Pending', 'Approved', 'Rejected'];
const STATUS_CLASS: Record<string, string> = { Pending: 'cr-status-pending', Approved: 'cr-status-offered', Rejected: 'cr-status-rejected' };
const STATUS_BADGE: Record<string, string> = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' };

export default function ExpensesPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can('hr.expenses.application', 'Create');
  const canApprove = can('hr.expenses.application', 'Approve');
  const canReject = can('hr.expenses.application', 'Reject');
  const canDelete = can('hr.expenses.application', 'Delete');
  const canChangeStatus = canApprove || canReject;
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [delItem, setDelItem] = useState<Expense | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/expenses');
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
    const ms = [it.reference_no, it.employee_name, it.employee_code, it.vendor_name].some(v => String(v ?? '').toLowerCase().includes(q));
    const mst = statusFilter === 'All' || it.status === statusFilter;
    return ms && mst;
  });

  const statusPerm = (st: string): boolean => st === 'Rejected' ? canReject : st === 'Approved' ? canApprove : (canApprove || canReject);

  const changeStatus = async (it: Expense, status: string) => {
    if (status === it.status) { setMenuOpen(null); return; }
    setUpdating(true);
    try {
      const res = await fetch(`/api/hr/expenses/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const json = await res.json();
      if (json.success) { setMenuOpen(null); fetchItems(); }
      else alert(json.message || 'Update failed.');
    } catch { alert('Network error.'); }
    finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    if (!delItem) return;
    try {
      const res = await fetch(`/api/hr/expenses/${delItem.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setDelItem(null); fetchItems(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
  };

  const money = (v: any) => v != null ? Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 }) : '—';

  return (
    <>
      <Head><title>Expenses Management | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Expenses', 'Expenses Application']}>
        <PermissionGate moduleKey="hr.expenses.application">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Expenses Management</h1>
              <p className="page-subtitle">Record company expenses with itemised breakdown and receipts.</p>
            </div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search employee, vendor or reference…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="rm-input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              {canCreate && <button className="rm-btn-primary" onClick={() => setSubmitOpen(true)}><i className="bi bi-plus-lg"></i> Submit Expense</button>}
            </div>

            <div className="rm-table-wrap" style={{ overflow: 'visible' }}>
              <table className="rm-table">
                <thead>
                  <tr>
                    <th className="rm-th-module">Reference</th>
                    <th className="rm-th-module">Employee</th>
                    <th className="rm-th-module">Category</th>
                    <th className="rm-th-module">Vendor</th>
                    <th className="rm-th-module">Date</th>
                    <th className="rm-th-perm">Items</th>
                    <th className="rm-th-perm">Amount (RM)</th>
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
                      <i className="bi bi-wallet2" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No expenses found.
                    </td></tr>
                  ) : filtered.map(it => (
                    <tr key={it.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#6b7280' }}>{it.reference_no}</td>
                      <td className="rm-td-module">
                        <div style={{ color: '#1f2937' }}>{it.employee_name || '—'}</div>
                        {it.employee_code && <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{it.employee_code}</div>}
                      </td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.category_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.vendor_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.expense_date ? fmt(it.expense_date) : '—'}</td>
                      <td className="rm-td-perm"><span className="usr-role-badge">{it.item_count}</span></td>
                      <td className="rm-td-perm" style={{ fontSize: 13, color: '#1f2937', textAlign: 'right' }}>{money(it.amount)}</td>
                      <td className="rm-td-perm"><span className={`badge-status ${STATUS_BADGE[it.status] || 'badge-pending'}`}>{it.status}</span></td>
                      <td className="rm-td-perm" style={{ position: 'relative' }}>
                        <div className="d-flex gap-2 justify-content-center">
                          <button className="rm-action-btn rm-action-view" title="View" onClick={() => setViewId(it.id)}><i className="bi bi-eye-fill"></i></button>
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
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>Showing {filtered.length} of {items.length} expense{items.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {submitOpen && <ExpenseSubmitModal onClose={() => setSubmitOpen(false)} onSubmitted={() => { setSubmitOpen(false); fetchItems(); }} />}
        {viewId != null && <ExpenseViewModal id={viewId} fmt={fmt} onClose={() => setViewId(null)} />}

        {delItem && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Expense?</h3>
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
