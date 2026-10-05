'use client';
import { useState, useEffect } from 'react';
import PayslipDetailModal from './PayslipDetailModal';
import { printPayslipA5 } from './payslipPrint';

const STATUS_BADGE: Record<string, string> = { Draft: 'badge-status pr-badge-draft', Approved: 'badge-approved', Paid: 'badge-status pr-badge-paid' };

export default function PeriodPayslipsModal({ periodId, periodName, fmt, onClose }: { periodId: number; periodName: string; fmt: (d: any, t?: boolean) => string; onClose: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewId, setViewId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/hr/payroll/payslips?period_id=${periodId}`).then(r => r.json()).then(j => {
      if (j.success) setRows(j.data); else setError(j.message || 'Failed.');
    }).catch(() => setError('Failed to load.')).finally(() => setLoading(false));
  }, [periodId]);

  const money = (v: any) => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 });

  const handlePrint = async (id: number) => {
    const res = await fetch(`/api/hr/payroll/payslips/${id}`);
    const j = await res.json();
    if (j.success) printPayslipA5(j.data, fmt);
  };

  return (
    <>
      <div className="usr-modal-overlay">
        <div className="usr-modal" style={{ maxWidth: 920 }}>
          <div className="usr-modal-header">
            <div><p className="usr-modal-title"><i className="bi bi-receipt" style={{ marginRight: 8 }}></i>Payslips — {periodName}</p><p className="usr-modal-sub">{rows.length} payslip{rows.length !== 1 ? 's' : ''} generated</p></div>
            <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
          </div>
          <div className="usr-modal-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
            ) : error ? (
              <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>
            ) : (
              <div className="rm-table-wrap">
                <table className="rm-table">
                  <thead>
                    <tr>
                      <th className="rm-th-module">Payslip No.</th>
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
                    {rows.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: 28, color: '#9ca3af', fontSize: 13 }}>No payslips.</td></tr>
                    ) : rows.map(r => (
                      <tr key={r.id} className="rm-data-row">
                        <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{r.payslip_no}</td>
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
            )}
          </div>
          <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={onClose}>Close</button></div>
        </div>
      </div>
      {viewId != null && <PayslipDetailModal id={viewId} onClose={() => setViewId(null)} />}
    </>
  );
}
