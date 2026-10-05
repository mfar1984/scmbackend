'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import PayslipDetailModal from '../../../components/hr/payroll/PayslipDetailModal';
import { printPayslipA5 } from '../../../components/hr/payroll/payslipPrint';
import { useDateFormat } from '../../../lib/useDateFormat';

type Payslip = {
  id: number; payslip_no: string; period_name: string; period_year: number;
  employee_name: string; department_name: string | null;
  basic_salary: number; gross_salary: number; total_deductions: number; net_salary: number; status: string;
};

const STATUS_BADGE: Record<string, string> = { Draft: 'badge-status pr-badge-draft', Approved: 'badge-approved', Paid: 'badge-status pr-badge-paid' };
const YEARS = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i);

export default function PayslipsPage() {
  const { fmt } = useDateFormat();
  const [rows, setRows] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState<string>(String(new Date().getFullYear()));
  const [viewId, setViewId] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (yearFilter !== 'All') params.set('year', yearFilter);
      const res = await fetch(`/api/hr/payroll/payslips?${params.toString()}`);
      const json = await res.json();
      if (json.success) setRows(json.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [statusFilter, yearFilter]);
  useEffect(() => { fetchRows(); }, [fetchRows]);

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return [r.payslip_no, r.employee_name, r.department_name].some(v => String(v ?? '').toLowerCase().includes(q));
  });

  const money = (v: any) => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 });

  const handlePrint = async (id: number) => {
    const res = await fetch(`/api/hr/payroll/payslips/${id}`);
    const j = await res.json();
    if (j.success) printPayslipA5(j.data, fmt);
  };

  return (
    <>
      <Head><title>Payslips | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Payroll', 'Payslips']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
              <div>
                <h1 className="page-title">Payroll Management</h1>
                <p className="page-subtitle">Manage employee salaries, deductions and payslips.</p>
              </div>
              <div className="d-flex gap-2">
                <Link href="/hr/payroll/periods" className="rm-btn-outline"><i className="bi bi-calendar3"></i> Periods</Link>
                <Link href="/hr/payroll/payslips" className="rm-btn-outline" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#2563eb' }}><i className="bi bi-receipt"></i> Payslips</Link>
              </div>
            </div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search payslip no, employee…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="rm-input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                {['Draft', 'Approved', 'Paid'].map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="rm-input" style={{ width: 130 }} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                <option value="All">All Years</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button className="rm-btn-outline" onClick={() => { setSearch(''); setStatusFilter('All'); setYearFilter(String(new Date().getFullYear())); }}><i className="bi bi-arrow-clockwise"></i> Reset</button>
            </div>

            <div className="rm-table-wrap" style={{ overflow: 'visible' }}>
              <table className="rm-table">
                <thead>
                  <tr>
                    <th className="rm-th-module">Payslip No.</th>
                    <th className="rm-th-module">Period</th>
                    <th className="rm-th-module">Employee</th>
                    <th className="rm-th-perm">Basic (RM)</th>
                    <th className="rm-th-perm">Gross (RM)</th>
                    <th className="rm-th-perm">Deductions (RM)</th>
                    <th className="rm-th-perm">Net (RM)</th>
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
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>
                      <i className="bi bi-receipt" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No payroll records found.
                    </td></tr>
                  ) : filtered.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{r.payslip_no}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.period_name}</td>
                      <td className="rm-td-module">
                        <div style={{ color: '#1f2937' }}>{r.employee_name}</div>
                        {r.department_name && <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.department_name}</div>}
                      </td>
                      <td className="rm-td-perm" style={{ fontSize: 13, textAlign: 'right', color: '#6b7280' }}>{money(r.basic_salary)}</td>
                      <td className="rm-td-perm" style={{ fontSize: 13, textAlign: 'right', color: '#1f2937' }}>{money(r.gross_salary)}</td>
                      <td className="rm-td-perm" style={{ fontSize: 13, textAlign: 'right', color: '#dc2626' }}>{money(r.total_deductions)}</td>
                      <td className="rm-td-perm" style={{ fontSize: 13, textAlign: 'right', color: '#16a34a' }}>{money(r.net_salary)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={STATUS_BADGE[r.status] || 'badge-pending'}>{r.status}</span></td>
                      <td className="rm-td-perm">
                        <div className="d-flex gap-2 justify-content-center">
                          <button className="rm-action-btn rm-action-view" title="View Payslip" onClick={() => setViewId(r.id)}><i className="bi bi-eye-fill"></i></button>
                          <button className="rm-action-btn rm-action-edit" title="Print A5" onClick={() => handlePrint(r.id)}><i className="bi bi-printer-fill"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>Showing {filtered.length} of {rows.length} payslip{rows.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {viewId != null && <PayslipDetailModal id={viewId} onClose={() => setViewId(null)} />}
      </AdminLayout>
    </>
  );
}
