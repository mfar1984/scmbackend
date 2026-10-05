'use client';
import { useState, useEffect } from 'react';
import ApprovalTrail from './ApprovalTrail';

const STATUS_BADGE: Record<string, string> = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' };

export default function ClaimViewModal({ id, fmt, onClose }: { id: number; fmt: (d: any, t?: boolean) => string; onClose: () => void }) {
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/hr/claim/${id}`).then(r => r.json()).then(j => {
      if (j.success) setClaim(j.data); else setError(j.message || 'Not found.');
    }).catch(() => setError('Failed to load.')).finally(() => setLoading(false));
  }, [id]);

  const money = (v: any) => v != null ? `RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '—';

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 820 }}>
        <div className="usr-modal-header">
          <div>
            <p className="usr-modal-title">Claim Details</p>
            <p className="usr-modal-sub">{claim?.reference_no || ''}</p>
          </div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : error ? (
            <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>
          ) : claim && (
            <>
              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-info-circle-fill"></i> Claim Information</div>
                <div className="cr-panel-body">
                  <div className="cr-kv"><span className="cr-kv-label">Employee</span><span className="cr-kv-value">{claim.employee_name} {claim.employee_code ? `(${claim.employee_code})` : ''}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Claim Type</span><span className="cr-kv-value">{claim.claim_type_name || '—'}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Claim Date</span><span className="cr-kv-value">{claim.claim_date ? fmt(claim.claim_date) : '—'}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Status</span><span className="cr-kv-value"><span className={`badge-status ${STATUS_BADGE[claim.status] || 'badge-pending'}`}>{claim.status}</span></span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Total Amount</span><span className="cr-kv-value accent">{money(claim.amount)}</span></div>
                  <div className="cr-kv"><span className="cr-kv-label">Description</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{claim.description || '—'}</span></div>
                  {claim.remarks && <div className="cr-kv"><span className="cr-kv-label">Remarks</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{claim.remarks}</span></div>}
                </div>
              </div>

              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-list-ul"></i> Claim Items ({claim.items?.length || 0})</div>
                <div className="cr-panel-body" style={{ padding: 0 }}>
                  <table className="rm-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th className="rm-th-module">Date</th>
                        <th className="rm-th-module">Description</th>
                        <th className="rm-th-module">Category</th>
                        <th className="rm-th-perm">Amount (RM)</th>
                        <th className="rm-th-perm">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(claim.items || []).map((it: any) => (
                        <tr key={it.id} className="rm-data-row">
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.item_date ? fmt(it.item_date) : '—'}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#374151' }}>{it.description || '—'}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{it.category_name || '—'}</td>
                          <td className="rm-td-perm" style={{ fontSize: 13, color: '#1f2937', textAlign: 'right' }}>{money(it.amount)}</td>
                          <td className="rm-td-perm">{(it.has_receipt === 1 || it.has_receipt === true) ? <a href={`/api/hr/claim/${id}?doc=${it.id}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>View</a> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <ApprovalTrail module="claim" id={id} fmt={fmt} />
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
