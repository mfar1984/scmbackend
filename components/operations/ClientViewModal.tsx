'use client';
import { useState, useEffect } from 'react';

const STATUS_BADGE: Record<string, string> = { 'Active': 'badge-status badge-approved', 'Prospect': 'badge-status badge-review', 'Inactive': 'badge-status badge-rejected' };
const STAGE_BADGE: Record<string, string> = { 'New': 'badge-status', 'Contacted': 'badge-status badge-review', 'Qualified': 'badge-status badge-pending', 'Proposal': 'badge-status badge-review', 'Negotiation': 'badge-status badge-pending', 'Won': 'badge-status badge-approved', 'Lost': 'badge-status badge-rejected' };
const PROP_BADGE: Record<string, string> = { 'Draft': 'badge-status', 'Sent': 'badge-status badge-review', 'Accepted': 'badge-status badge-approved', 'Rejected': 'badge-status badge-rejected', 'Expired': 'badge-status badge-pending' };

function KV({ label, value }: { label: string; value: any }) {
  return <div className="cr-kv"><span className="cr-kv-label">{label}</span><span className="cr-kv-value">{value || value === 0 ? value : '—'}</span></div>;
}

export default function ClientViewModal({ id, fmt, onClose, onEdit }: { id: number; fmt: (d: any, t?: boolean) => string; onClose: () => void; onEdit: () => void }) {
  const [c, setC] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/operations/clients/${id}`).then(r => r.json()).then(j => {
      if (j.success) setC(j.data); else setError(j.message || 'Not found.');
    }).catch(() => setError('Failed to load.')).finally(() => setLoading(false));
  }, [id]);

  const money = (v: any) => v != null && v !== '' ? `RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '—';

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 760 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Client Details</p>{c && <p className="usr-modal-sub">{c.company}</p>}</div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : error ? (
            <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>
          ) : c && (
            <>
              <div className="tv-hero">
                <div className="tv-hero-main">
                  <div className="tv-hero-name">{c.company}</div>
                  <div className="tv-hero-agency"><i className="bi bi-tag me-1"></i>{c.sector || '—'}{c.industry ? ` · ${c.industry}` : ''}</div>
                </div>
                <div className="tv-hero-side">
                  <span className={STATUS_BADGE[c.status] || 'badge-status'}>{c.status}</span>
                  <div className="tv-hero-value">{money(c.potential_value)}</div>
                  <div className="tv-hero-value-label">Potential Value</div>
                </div>
              </div>

              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-person-lines-fill"></i> Primary Contact</div>
                <div className="cr-panel-body">
                  <KV label="Contact Person" value={c.contact_person} />
                  <KV label="Designation" value={c.designation} />
                  <div className="cr-kv"><span className="cr-kv-label">Email</span><span className="cr-kv-value">{c.email ? <a href={`mailto:${c.email}`} style={{ color: '#2563eb' }}>{c.email}</a> : '—'}</span></div>
                  <KV label="Phone" value={c.phone} />
                  <KV label="Address" value={c.address} />
                  <div className="cr-kv"><span className="cr-kv-label">Website</span><span className="cr-kv-value">{c.website ? <a href={c.website} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{c.website}</a> : '—'}</span></div>
                  <KV label="Last Contact" value={c.last_contact ? fmt(c.last_contact) : null} />
                  {c.notes && <div className="cr-kv"><span className="cr-kv-label">Notes</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{c.notes}</span></div>}
                </div>
              </div>

              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-megaphone-fill"></i> Leads ({c.leads?.length || 0})</div>
                <div className="cr-panel-body" style={{ padding: c.leads?.length ? 0 : undefined }}>
                  {!c.leads?.length ? <div style={{ fontSize: 13, color: '#9ca3af' }}>No leads linked.</div> : (
                    <table className="rm-table" style={{ margin: 0 }}>
                      <thead><tr><th className="rm-th-module">Lead</th><th className="rm-th-perm">Est. Value</th><th className="rm-th-perm">Stage</th><th className="rm-th-perm">Follow-up</th></tr></thead>
                      <tbody>{c.leads.map((l: any) => (
                        <tr key={l.id} className="rm-data-row">
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#374151' }}>{l.title}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13 }}>{money(l.estimated_value)}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={STAGE_BADGE[l.stage] || 'badge-status'}>{l.stage}</span></td>
                          <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280' }}>{l.next_follow_up ? fmt(l.next_follow_up) : '—'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="cr-panel">
                <div className="cr-panel-head"><i className="bi bi-file-earmark-richtext-fill"></i> Proposals ({c.proposals?.length || 0})</div>
                <div className="cr-panel-body" style={{ padding: c.proposals?.length ? 0 : undefined }}>
                  {!c.proposals?.length ? <div style={{ fontSize: 13, color: '#9ca3af' }}>No proposals.</div> : (
                    <table className="rm-table" style={{ margin: 0 }}>
                      <thead><tr><th className="rm-th-module">Proposal</th><th className="rm-th-perm">Value</th><th className="rm-th-perm">Status</th><th className="rm-th-perm">Issued</th></tr></thead>
                      <tbody>{c.proposals.map((pr: any) => (
                        <tr key={pr.id} className="rm-data-row">
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#374151' }}>{pr.title}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13 }}>{money(pr.value)}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={PROP_BADGE[pr.status] || 'badge-status'}>{pr.status}</span></td>
                          <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280' }}>{pr.issued_date ? fmt(pr.issued_date) : '—'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
                </div>
              </div>
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
