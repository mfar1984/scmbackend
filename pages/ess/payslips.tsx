'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import EssLayout from '../../components/ess/EssLayout';
import { printPayslipA5 } from '../../components/hr/payroll/payslipPrint';
import { useDateFormat } from '../../lib/useDateFormat';

type Row = { id: number; payslip_no: string; period_name: string; gross_salary: number; total_deductions: number; net_salary: number; status: string };
const STATUS_BADGE: Record<string, string> = { Draft: 'badge-status pr-badge-draft', Approved: 'badge-approved', Paid: 'badge-status pr-badge-paid' };

export default function EssPayslips() {
  const { fmt } = useDateFormat();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/ess/payslips')).json(); if (j.success) setRows(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchRows(); }, [fetchRows]);

  const money = (v: any) => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 });
  const handlePrint = async (id: number) => {
    const j = await (await fetch(`/api/ess/payslips?id=${id}`)).json();
    if (j.success) printPayslipA5(j.data, fmt); else alert(j.message || 'Failed to load payslip.');
  };

  return (
    <>
      <Head><title>My Payslips | ATLINE Self-Service</title></Head>
      <EssLayout breadcrumb={['My Payslips']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4"><h1 className="page-title">My Payslips</h1><p className="page-subtitle">View and print your monthly payslips.</p></div>
            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Payslip No.</th><th className="rm-th-module">Period</th>
                  <th className="rm-th-perm">Gross (RM)</th><th className="rm-th-perm">Deductions (RM)</th>
                  <th className="rm-th-perm">Net (RM)</th><th className="rm-th-perm">Status</th><th className="rm-th-perm">Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-file-earmark-text" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No payslips available yet.</td></tr>
                  ) : rows.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{r.payslip_no}</td>
                      <td className="rm-td-module" style={{ color: '#1f2937' }}>{r.period_name}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#1f2937' }}>{money(r.gross_salary)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#dc2626' }}>{money(r.total_deductions)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#16a34a' }}>{money(r.net_salary)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={STATUS_BADGE[r.status] || 'badge-pending'}>{r.status}</span></td>
                      <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                        <button className="rm-action-btn rm-action-view" title="Print A5" onClick={() => handlePrint(r.id)}><i className="bi bi-printer-fill"></i></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </EssLayout>
    </>
  );
}
