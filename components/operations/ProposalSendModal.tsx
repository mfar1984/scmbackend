'use client';
import { useState, useEffect } from 'react';

function Field({ label, req, flex = '1 1 100%', children }: { label: string; req?: boolean; flex?: string; children: React.ReactNode }) {
  return (
    <div style={{ flex }}>
      <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>{label}{req && <span style={{ color: '#ef4444' }}> *</span>}</label>
      {children}
    </div>
  );
}

export default function ProposalSendModal({ proposalId, onClose, onSent }: {
  proposalId: number; onClose: () => void; onSent: () => void;
}) {
  const [p, setP] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [profile, setProfile] = useState('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/operations/proposals/${proposalId}`).then(r => r.json()),
      fetch('/api/integration/email-profiles').then(r => r.json()),
    ]).then(([pj, ej]) => {
      if (pj.success) {
        const d = pj.data;
        setP(d);
        setTo(d.contact_email || d.client_email_db || '');
        setSubject(`Proposal: ${d.title}`);
        setMessage(`We are pleased to share our proposal "${d.title}" for your consideration.`);
      } else setError(pj.message || 'Not found.');
      if (ej.success) {
        setProfiles(ej.data);
        const active = ej.data.find((x: any) => x.status === 'Active') || ej.data[0];
        if (active) setProfile(active.profile_key);
      }
    }).catch(() => setError('Failed to load.')).finally(() => setLoading(false));
  }, [proposalId]);

  const send = async () => {
    if (!to.trim()) { setError('Recipient email is required.'); return; }
    setSending(true); setError(''); setOk('');
    try {
      const j = await (await fetch('/api/operations/proposals/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: proposalId, to: to.trim(), cc: cc.trim(), subject, message, profile: profile || null }),
      })).json();
      if (j.success) { setOk(j.message || 'Sent.'); setTimeout(() => onSent(), 900); }
      else setError(j.message || 'Failed to send.');
    } catch { setError('Network error.'); } finally { setSending(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 640 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-send-fill" style={{ marginRight: 8 }}></i>Send Proposal</p>{p && <p className="usr-modal-sub">{p.title}</p>}</div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          {ok && <div className="alert alert-success mb-3" style={{ fontSize: 13 }}>{ok}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : p && (
            <>
              {!p.has_doc && (
                <div className="d-flex align-items-center gap-2 mb-3 p-2 px-3" style={{ background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ color: '#d97706', fontSize: 13 }}></i>
                  <span style={{ fontSize: 12.5, color: '#92400e' }}>No PDF attached to this proposal. The email will be sent with summary details only.</span>
                </div>
              )}
              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-envelope-fill"></i> Email</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Send From (Profile)" flex="1 1 100%">
                    <select className="rm-input" value={profile} onChange={e => setProfile(e.target.value)}>
                      {profiles.length === 0 && <option value="">Default (global SMTP)</option>}
                      {profiles.map(pr => <option key={pr.profile_key} value={pr.profile_key}>{pr.name}{pr.status !== 'Active' ? ' (inactive)' : ''}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="To" req flex="1 1 280px"><input type="email" className="rm-input" value={to} onChange={e => setTo(e.target.value)} placeholder="client@company.com" /></Field>
                  <Field label="CC" flex="1 1 220px"><input type="email" className="rm-input" value={cc} onChange={e => setCc(e.target.value)} placeholder="optional" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Subject" req><input className="rm-input" value={subject} onChange={e => setSubject(e.target.value)} /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Message"><textarea className="rm-input" rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Personal note to the client" /></Field>
                </div>
              </div>
              {p.has_doc && (
                <div className="d-flex align-items-center gap-2" style={{ fontSize: 12.5, color: '#6b7280', padding: '0 2px' }}>
                  <i className="bi bi-paperclip"></i> Attachment: <strong style={{ fontWeight: 500 }}>{p.doc_name || 'proposal.pdf'}</strong>
                </div>
              )}
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={send} disabled={sending || loading}>{sending ? <><span className="spinner-border spinner-border-sm me-1"></span> Sending…</> : <><i className="bi bi-send-fill"></i> Send Proposal</>}</button>
        </div>
      </div>
    </div>
  );
}
