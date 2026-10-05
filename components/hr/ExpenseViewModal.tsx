'use client';
import { useState, useEffect } from 'react';
import ApprovalTrail from './ApprovalTrail';

const STATUS_BADGE: Record<string, string> = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' };

export default function ExpenseViewModal({ id, fmt, onClose }: { id: number; fmt: (d: any, t?: boolean) => string; onClose: () => void }) {
  const [exp, setExp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/hr/expenses/${id}`).then(r => r.json()).then(j => {
      if (j.success) setExp(j.data); else setError(j.message || 'Not found.');
    }).catch(() => setError('Failed to load.')).finally(() => setLoading(false));
  }, [id]);

  const money = (v: any) => v != null ? `RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '—';

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 820 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Expense Details</p><p className="usr-modal-sub">{exp?.reference_no || ''}</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : error ? (
            <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>
          ) : exp && (
            <>
              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-info-circle-fill"></i> Expense Information</div>
                <div className="cr-panel-body">
                  <div className="cr-kv"><span className="cr-kv-label">Employee</span><span className="cr-kv-value">{exp.employee_name} {exp.employee_code ? `(${exp.employee_code})` : ''}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Category</span><span className="cr-kv-value">{exp.category_name || '—'}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Expense Date</span><span className="cr-kv-value">{exp.expense_date ? fmt(exp.expense_date) : '—'}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Vendor</span><span className="cr-kv-value">{exp.vendor_name || '—'}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Invoice No.</span><span className="cr-kv-value">{exp.invoice_number || '—'}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Payment Method</span><span className="cr-kv-value">{exp.payment_method || '—'}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Payment Ref</span><span className="cr-kv-value">{exp.payment_reference || '—'}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Status</span><span className="cr-kv-value"><span className={`badge-status ${STATUS_BADGE[exp.status] || 'badge-pending'}`}>{exp.status}</span></span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Description</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{exp.description || '—'}</span></div>
                  {exp.remarks && <div className="cr-kv"><span className="cr-kv-label">Remarks</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{exp.remarks}</span></div>}
                  {(exp.has_receipt === 1 || exp.has_receipt === true) && (
                    <div className="cr-kv"><span className="cr-kv-label">Receipt</span><span className="cr-kv-value"><a href={`/api/hr/expenses/${id}?doc=1`} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>View Receipt</a></span></div>
                  )}
                </div>
              </div>

              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-list-ul"></i> Expense Items ({exp.items?.length || 0})</div>
                <div className="cr-panel-body" style={{ padding: 0 }}>
                  <table className="rm-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th className="rm-th-module">Date</th>
                        <th className="rm-th-module">Description</th>
                        <th className="rm-th-perm">Qty</th>
                        <th className="rm-th-perm">Unit Price</th>
                        <th className="rm-th-perm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(exp.items || []).map((it: any) => (
                        <tr key={it.id} className="rm-data-row">
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.item_date ? fmt(it.item_date) : '—'}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#374151' }}>{it.description || '—'}</td>
                          <td className="rm-td-perm" style={{ fontSize: 13, color: '#6b7280', textAlign: 'center' }}>{it.qty}</td>
                          <td className="rm-td-perm" style={{ fontSize: 13, color: '#6b7280', textAlign: 'right' }}>{money(it.unit_price)}</td>
                          <td className="rm-td-perm" style={{ fontSize: 13, color: '#1f2937', textAlign: 'right' }}>{money(it.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>Tax: {money(exp.tax_amount)}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#16a34a' }}>Total: {money(exp.amount)}</span>
              </div>
              <ApprovalTrail module="expenses" id={id} fmt={fmt} />
            </>
          )}
        </div>
        <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}
