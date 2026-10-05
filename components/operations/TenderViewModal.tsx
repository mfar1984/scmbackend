'use client';
import { useState, useEffect } from 'react';

const STAGE_BADGE: Record<string, string> = {
  'Draft': 'badge-status', 'In Progress': 'badge-status badge-review', 'Submitted': 'badge-status badge-pending',
  'Evaluation': 'badge-status badge-review', 'Awarded': 'badge-status badge-approved',
  'Unsuccessful': 'badge-status badge-rejected', 'Closed': 'badge-status',
};
const EVAL_BADGE: Record<string, string> = { 'Pending': 'badge-status badge-pending', 'In Progress': 'badge-status badge-review', 'Completed': 'badge-status badge-approved' };

function KV({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return <div className="cr-kv"><span className="cr-kv-label">{label}</span><span className="cr-kv-value" style={mono ? { fontFamily: 'monospace', fontSize: 12.5 } : undefined}>{value || value === 0 ? value : '—'}</span></div>;
}

export default function TenderViewModal({ id, fmt, onClose, onEdit }: { id: number; fmt: (d: any, t?: boolean) => string; onClose: () => void; onEdit: () => void }) {
  const [t, setT] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [hasCompiled, setHasCompiled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/operations/tenders/${id}`).then(r => r.json()).then(j => {
      if (j.success) { setT(j.data); setDocs(j.data.documents || []); setHasCompiled(!!j.data.has_compiled); }
      else setError(j.message || 'Not found.');
    }).catch(() => setError('Failed to load.')).finally(() => setLoading(false));
  }, [id]);

  const money = (v: any) => v != null && v !== '' ? `RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '—';
  const has = (...keys: string[]) => keys.some(k => t && t[k] != null && t[k] !== '');
  const showEval = t && (['Submitted', 'Evaluation', 'Awarded', 'Unsuccessful', 'Closed'].includes(t.stage) || has('submitted_date', 'eval_status', 'eval_officer', 'technical_score', 'financial_score'));
  const showAward = t && (['Awarded', 'Closed'].includes(t.stage) || has('contract_no', 'actual_value', 'award_date'));
  const showArchive = t && (['Unsuccessful', 'Closed'].includes(t.stage) || has('outcome'));

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 820 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Tender Details</p><p className="usr-modal-sub">{t?.ref_no || ''}</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : error ? (
            <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>
          ) : t && (
            <>
              {/* Summary header band */}
              <div className="tv-hero">
                <div className="tv-hero-main">
                  <div className="tv-hero-name">{t.name}</div>
                  <div className="tv-hero-agency"><i className="bi bi-building me-1"></i>{t.agency || '—'}</div>
                </div>
                <div className="tv-hero-side">
                  <span className={STAGE_BADGE[t.stage] || 'badge-status'}>{t.stage}</span>
                  <div className="tv-hero-value">{money(t.estimated_value)}</div>
                  <div className="tv-hero-value-label">Estimated Value</div>
                </div>
              </div>

              {/* Tender info */}
              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-info-circle-fill"></i> Tender Information</div>
                <div className="cr-panel-body">
                  <KV label="Reference No" value={t.ref_no} mono />
                  <KV label="Category" value={t.category} />
                  <KV label="Procurement Method" value={t.procurement_method} />
                  <KV label="Assigned To" value={t.assigned_to} />
                  {t.description && <div className="cr-kv"><span className="cr-kv-label">Scope / Description</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{t.description}</span></div>}
                </div>
              </div>

              {/* Agency & contact */}
              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-building-fill"></i> Agency &amp; Contact</div>
                <div className="cr-panel-body">
                  <KV label="Agency / Client" value={t.agency} />
                  <KV label="Agency Address" value={t.agency_address} />
                  <KV label="Contact Person" value={t.contact_person} />
                  <KV label="Designation" value={t.contact_designation} />
                  <KV label="Phone" value={t.contact_phone} />
                  <div className="cr-kv"><span className="cr-kv-label">Email</span><span className="cr-kv-value">{t.contact_email ? <a href={`mailto:${t.contact_email}`} style={{ color: '#2563eb' }}>{t.contact_email}</a> : '—'}</span></div>
                </div>
              </div>

              {/* Timeline & fees */}
              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-calendar-event-fill"></i> Timeline &amp; Fees</div>
                <div className="cr-panel-body">
                  <KV label="Briefing Date" value={t.briefing_date ? fmt(t.briefing_date) : null} />
                  <KV label="Closing Date" value={t.closing_date ? `${fmt(t.closing_date)}${t.closing_time ? ` · ${t.closing_time}` : ''}` : null} />
                  <KV label="Estimated Value" value={money(t.estimated_value)} />
                  <KV label="Document Fee" value={t.document_fee != null && t.document_fee !== '' ? money(t.document_fee) : null} />
                  <KV label="Tender Deposit" value={t.tender_deposit != null && t.tender_deposit !== '' ? money(t.tender_deposit) : null} />
                </div>
              </div>

              {showEval && (
                <div className="cr-panel">
                  <div className="cr-panel-head"><i className="bi bi-clipboard-data-fill"></i> Submission &amp; Evaluation</div>
                  <div className="cr-panel-body">
                    <KV label="Submitted Date" value={t.submitted_date ? fmt(t.submitted_date) : null} />
                    <KV label="Evaluation Type" value={t.eval_type} />
                    <div className="cr-kv"><span className="cr-kv-label">Eval Status</span><span className="cr-kv-value">{t.eval_status ? <span className={EVAL_BADGE[t.eval_status] || 'badge-status'}>{t.eval_status}</span> : '—'}</span></div>
                    <KV label="Officer In Charge" value={t.eval_officer} />
                    <KV label="Technical Score" value={t.technical_score != null && t.technical_score !== '' ? `${Number(t.technical_score)}` : null} />
                    <KV label="Financial Score" value={t.financial_score != null && t.financial_score !== '' ? `${Number(t.financial_score)}` : null} />
                    {t.eval_remarks && <div className="cr-kv"><span className="cr-kv-label">Remarks</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{t.eval_remarks}</span></div>}
                  </div>
                </div>
              )}

              {showAward && (
                <div className="cr-panel">
                  <div className="cr-panel-head"><i className="bi bi-trophy-fill"></i> Award</div>
                  <div className="cr-panel-body">
                    <KV label="Contract No" value={t.contract_no} mono />
                    <div className="cr-kv"><span className="cr-kv-label">Actual Value</span><span className="cr-kv-value" style={{ color: '#16a34a', fontWeight: 500 }}>{money(t.actual_value)}</span></div>
                    <KV label="Award Date" value={t.award_date ? fmt(t.award_date) : null} />
                    <KV label="Project Period" value={(t.project_start || t.project_end) ? `${t.project_start ? fmt(t.project_start) : '—'}  →  ${t.project_end ? fmt(t.project_end) : '—'}` : null} />
                    <div className="cr-kv"><span className="cr-kv-label">Award Status</span><span className="cr-kv-value">{t.award_status ? <span className={`badge-status ${t.award_status === 'Active' ? 'badge-approved' : 'badge-status'}`}>{t.award_status}</span> : '—'}</span></div>
                  </div>
                </div>
              )}

              {showArchive && (
                <div className="cr-panel">
                  <div className="cr-panel-head"><i className="bi bi-archive-fill"></i> Outcome</div>
                  <div className="cr-panel-body">
                    <div className="cr-kv"><span className="cr-kv-label">Outcome</span><span className="cr-kv-value">{t.outcome ? <span className={`badge-status ${t.outcome === 'Unsuccessful' ? 'badge-rejected' : t.outcome === 'Cancelled' ? 'badge-pending' : 'badge-status'}`}>{t.outcome}</span> : '—'}</span></div>
                    <KV label="Reference Price" value={money(t.reference_price)} />
                    {t.outcome_reason && <div className="cr-kv"><span className="cr-kv-label">Reason</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{t.outcome_reason}</span></div>}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-paperclip"></i> Documents ({docs.length})</div>
                <div className="cr-panel-body" style={{ padding: docs.length ? 0 : undefined }}>
                  {docs.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>No documents attached.</div>
                  ) : (
                    <table className="rm-table" style={{ margin: 0 }}>
                      <thead><tr><th className="rm-th-module">Type</th><th className="rm-th-module">File</th><th className="rm-th-perm">Uploaded</th><th className="rm-th-perm">View</th></tr></thead>
                      <tbody>
                        {docs.map(d => (
                          <tr key={d.id} className="rm-data-row">
                            <td className="rm-td-module"><span className="usr-role-badge">{d.doc_type}</span></td>
                            <td className="rm-td-module" style={{ fontSize: 13, color: '#374151' }}><i className={`bi ${(d.mime_type || '').includes('pdf') ? 'bi-file-earmark-pdf' : 'bi-file-earmark-image'} me-1`}></i>{d.file_name}</td>
                            <td className="rm-td-perm" style={{ fontSize: 12, color: '#6b7280' }}>{fmt(d.uploaded_at)}</td>
                            <td className="rm-td-perm" style={{ textAlign: 'center' }}><a className="rm-action-btn rm-action-view" href={`/api/operations/tender-documents?id=${d.id}`} target="_blank" rel="noreferrer"><i className="bi bi-eye-fill"></i></a></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {hasCompiled && (
                <div className="tv-compiled">
                  <div className="d-flex align-items-center gap-2"><i className="bi bi-file-earmark-pdf-fill" style={{ color: '#dc2626', fontSize: 18 }}></i><span style={{ fontSize: 13, color: '#374151' }}>Compiled Submission PDF is ready.</span></div>
                  <a className="rm-btn-outline" href={`/api/operations/tenders/${id}?compiled=1`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><i className="bi bi-download"></i> View PDF</a>
                </div>
              )}
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Close</button>
          <button className="rm-btn-primary" onClick={onEdit}><i className="bi bi-pencil-fill"></i> Edit</button>
        </div>
      </div>
    </div>
  );
}
