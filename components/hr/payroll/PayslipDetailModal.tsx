'use client';
import { useState, useEffect } from 'react';
import { printPayslipA5 } from './payslipPrint';
import { useDateFormat } from '../../../lib/useDateFormat';

const STATUS_BADGE: Record<string, string> = { Draft: 'badge-status pr-badge-draft', Approved: 'badge-approved', Paid: 'badge-status pr-badge-paid' };

export default function PayslipDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { fmt } = useDateFormat();
  const [ps, setPs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/hr/payroll/payslips/${id}`).then(r => r.json()).then(j => {
      if (j.success) setPs(j.data); else setError(j.message || 'Not found.');
    }).catch(() => setError('Failed to load.')).finally(() => setLoading(false));
  }, [id]);

  const money = (v: any) => `RM ${Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
  const moneyNoCur = (v: any) => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 });

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 640 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-file-earmark-text" style={{ marginRight: 8 }}></i>Payslip Details</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : error ? (
            <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>
          ) : ps && (
            <>
              <div className="d-flex flex-wrap gap-4 mb-3">
                <div style={{ flex: '1 1 200px' }}>
                  <div className="pr-meta-label">Payslip Number</div>
                  <div className="pr-meta-value" style={{ fontFamily: 'monospace' }}>{ps.payslip_no}</div>
                </div>
                <div style={{ flex: '1 1 120px' }}>
                  <div className="pr-meta-label">Status</div>
                  <span className={STATUS_BADGE[ps.status] || 'badge-pending'}>{ps.status}</span>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-4 mb-3">
                <div style={{ flex: '1 1 200px' }}>
                  <div className="pr-meta-label">Employee</div>
                  <div className="pr-meta-value">{ps.employee_name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{ps.department_name || '—'}</div>
                </div>
                <div style={{ flex: '1 1 120px' }}>
                  <div className="pr-meta-label">Period</div>
                  <div className="pr-meta-value">{ps.period_name}</div>
                </div>
              </div>

              <div className="pr-sec-title">Earnings</div>
              <div className="pr-line"><span>Basic Salary</span><span>{money(ps.basic_salary)}</span></div>
              <div className="pr-line"><span>Allowances</span><span>{money(ps.allowances)}</span></div>
              {Number(ps.bonus) > 0 && <div className="pr-line"><span>Bonus</span><span>{money(ps.bonus)}</span></div>}
              {Number(ps.commission) > 0 && <div className="pr-line"><span>Commission</span><span>{money(ps.commission)}</span></div>}
              {Number(ps.overtime) > 0 && <div className="pr-line"><span>Overtime</span><span>{money(ps.overtime)}</span></div>}
              {Number(ps.claims) > 0 && <div className="pr-line"><span>Claims Reimbursement</span><span>{money(ps.claims)}</span></div>}
              <div className="pr-line pr-line-total"><span>Gross Salary</span><span style={{ color: '#16a34a' }}>{money(ps.gross_salary)}</span></div>

              <div className="pr-sec-title" style={{ marginTop: 18 }}>Deductions</div>
              <div className="pr-line"><span>EPF (Employee)</span><span style={{ color: '#dc2626' }}>- {money(ps.epf_employee)}</span></div>
              <div className="pr-line"><span>SOCSO (Employee)</span><span style={{ color: '#dc2626' }}>- {money(ps.socso_employee)}</span></div>
              <div className="pr-line"><span>EIS (Employee)</span><span style={{ color: '#dc2626' }}>- {money(ps.eis_employee)}</span></div>
              {Number(ps.loan_deduction) > 0 && <div className="pr-line"><span>Loan Deduction</span><span style={{ color: '#dc2626' }}>- {money(ps.loan_deduction)}</span></div>}
              {Number(ps.advance_deduction) > 0 && <div className="pr-line"><span>Salary Advance</span><span style={{ color: '#dc2626' }}>- {money(ps.advance_deduction)}</span></div>}
              <div className="pr-line pr-line-total"><span>Total Deductions</span><span style={{ color: '#dc2626' }}>- {money(ps.total_deductions)}</span></div>

              <div className="pr-net-box">
                <div className="pr-net-label">Net Salary (Take Home)</div>
                <div className="pr-net-value">RM {moneyNoCur(ps.net_salary)}</div>
              </div>
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Close</button>
          <button className="rm-btn-primary" disabled={!ps} onClick={() => ps && printPayslipA5(ps, fmt)}><i className="bi bi-printer-fill"></i> Print Payslip</button>
        </div>
      </div>
    </div>
  );
}
