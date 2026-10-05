'use client';
import { useState, useEffect } from 'react';

const PROP_BADGE: Record<string, string> = { 'Draft': 'badge-status', 'Sent': 'badge-status badge-review', 'Accepted': 'badge-status badge-approved', 'Rejected': 'badge-status badge-rejected', 'Expired': 'badge-status badge-pending' };

function KV({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return <div className="cr-kv"><span className="cr-kv-label">{label}</span><span className="cr-kv-value" style={mono ? { fontFamily: 'monospace', fontSize: 12.5 } : undefined}>{value || value === 0 ? value : '—'}</span></div>;
}

export default function ProposalViewModal({ id, fmt, onClose, onEdit, onSend }: { id: number; fmt: (d: any, t?: boolean) => string; onClose: () => void; onEdit: () => void; onSend: () => void }) {
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/operations/proposals/${id}`).then(r => r.json()).then(j => {
      if (j.success) setP(j.data); else setError(j.message || 'Not found.');
    }).catch(() => setError('Failed to load.')).finally(() => setLoading(false));
  }, [id]);

  const money = (v: any) => v != null && v !== '' ? `RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '—';

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 760 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Proposal Details</p>{p?.ref_no && <p className="usr-modal-sub">{p.ref_no}</p>}</div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : error ? (
            <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>
          ) : p && (
            <>
              <div className="tv-hero">
                <div className="tv-hero-main">
                  <div className="tv-hero-name">{p.title}</div>
                  <div className="tv-hero-agency"><i className="bi bi-building me-1"></i>{p.client_name || p.client_company || '—'}</div>
                </div>
                <div className="tv-hero-side">
                  <span className={PROP_BADGE[p.status] || 'badge-status'}>{p.status}</span>
                  <div className="tv-hero-value">{money(p.value)}</div>
                  <div className="tv-hero-value-label">Proposed Value</div>
                </div>
              </div>

              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-info-circle-fill"></i> Proposal</div>
                <div className="cr-panel-body">
                  <KV label="Reference No" value={p.ref_no} mono />
                  <KV label="Issued Date" value={p.issued_date ? fmt(p.issued_date) : null} />
                  <KV label="Valid Until" value={p.valid_until ? fmt(p.valid_until) : null} />
                  {p.summary && <div className="cr-kv"><span className="cr-kv-label">Summary</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{p.summary}</span></div>}
                  {p.scope && <div className="cr-kv"><span className="cr-kv-label">Scope</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{p.scope}</span></div>}
                  {p.notes && <div className="cr-kv"><span className="cr-kv-label">Internal Notes</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{p.notes}</span></div>}
                </div>
              </div>

              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-building-fill"></i> Client &amp; Recipient</div>
                <div className="cr-panel-body">
                  <KV label="Client" value={p.client_name || p.client_company} />
                  <KV label="Contact Person" value={p.contact_person} />
                  <div className="cr-kv"><span className="cr-kv-label">Contact Email</span><span className="cr-kv-value">{p.contact_email ? <a href={`mailto:${p.contact_email}`} style={{ color: '#2563eb' }}>{p.contact_email}</a> : '—'}</span></div>
                </div>
              </div>

              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-send-fill"></i> Delivery</div>
                <div className="cr-panel-body">
                  <div className="cr-kv"><span className="cr-kv-label">Document</span><span className="cr-kv-value">{p.has_doc ? <a href={`/api/operations/proposals/${id}?doc=1`} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}><i className="bi bi-paperclip me-1"></i>{p.doc_name || 'proposal.pdf'}</a> : 'No attachment'}</span></div>
                  <KV label="Sent At" value={p.sent_at ? fmt(p.sent_at, true) : null} />
                  <KV label="Sent To" value={p.sent_to} />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Close</button>
          <button className="rm-btn-outline" onClick={onEdit}><i className="bi bi-pencil-fill"></i> Edit</button>
          <button className="rm-btn-primary" onClick={onSend}><i className="bi bi-send-fill"></i> Send to Client</button>
        </div>
      </div>
    </div>
  );
}
