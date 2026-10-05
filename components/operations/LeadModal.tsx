'use client';
import { useState, useEffect } from 'react';

const SOURCES = ['Referral', 'Cold Call', 'Website', 'Event', 'Tender', 'Other'];
const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const EMPTY = {
  title: '', client_id: '', company: '', contact_person: '', email: '', phone: '',
  source: 'Referral', estimated_value: '', stage: 'New', assigned_to: '', next_follow_up: '', description: '', lost_reason: '',
};

function Field({ label, req, flex = '1 1 220px', children }: { label: string; req?: boolean; flex?: string; children: React.ReactNode }) {
  return (
    <div style={{ flex }}>
      <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>{label}{req && <span style={{ color: '#ef4444' }}> *</span>}</label>
      {children}
    </div>
  );
}

export default function LeadModal({ mode, leadId, onClose, onSaved }: {
  mode: 'create' | 'edit'; leadId?: number; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState<any>(EMPTY);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/operations/clients').then(r => r.json()).then(j => { if (j.success) setClients(j.data); });
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !leadId) return;
    fetch(`/api/operations/leads/${leadId}`).then(r => r.json()).then(j => {
      if (j.success) {
        const d = j.data;
        setF({
          title: d.title || '', client_id: d.client_id ?? '', company: d.company || '',
          contact_person: d.contact_person || '', email: d.email || '', phone: d.phone || '',
          source: d.source || 'Referral', estimated_value: d.estimated_value ?? '', stage: d.stage || 'New',
          assigned_to: d.assigned_to || '', next_follow_up: d.next_follow_up ? String(d.next_follow_up).slice(0, 10) : '',
          description: d.description || '', lost_reason: d.lost_reason || '',
        });
      }
    }).finally(() => setLoading(false));
  }, [mode, leadId]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const pickClient = (cid: string) => {
    set('client_id', cid);
    const c = clients.find(x => String(x.id) === String(cid));
    if (c) setF((p: any) => ({ ...p, client_id: cid, company: c.company, contact_person: c.contact_person || p.contact_person, email: c.email || p.email, phone: c.phone || p.phone }));
  };

  const save = async () => {
    if (!f.title?.trim()) { setError('Lead title is required.'); return; }
    setSaving(true); setError('');
    try {
      const url = mode === 'create' ? '/api/operations/leads' : `/api/operations/leads/${leadId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const j = await (await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })).json();
      if (!j.success) { setError(j.message || 'Failed to save.'); setSaving(false); return; }
      onSaved();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 760 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-megaphone" style={{ marginRight: 8 }}></i>{mode === 'create' ? 'Add Lead' : 'Edit Lead'}</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : (
            <>
              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-bullseye"></i> Opportunity</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Lead / Opportunity Title" req flex="1 1 100%"><input className="rm-input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Network Upgrade Project" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Linked Client" flex="1 1 280px"><select className="rm-input" value={f.client_id} onChange={e => pickClient(e.target.value)}><option value="">— None / New Prospect —</option>{clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}</select></Field>
                  <Field label="Company (if no client)" flex="1 1 240px"><input className="rm-input" value={f.company} onChange={e => set('company', e.target.value)} placeholder="Company name" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Source" flex="1 1 160px"><select className="rm-input" value={f.source} onChange={e => set('source', e.target.value)}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select></Field>
                  <Field label="Stage" flex="1 1 160px"><select className="rm-input" value={f.stage} onChange={e => set('stage', e.target.value)}>{STAGES.map(s => <option key={s}>{s}</option>)}</select></Field>
                  <Field label="Est. Value (RM)" flex="1 1 160px"><input type="number" step="0.01" className="rm-input" value={f.estimated_value} onChange={e => set('estimated_value', e.target.value)} placeholder="0.00" /></Field>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-person-lines-fill"></i> Contact</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Contact Person" flex="1 1 220px"><input className="rm-input" value={f.contact_person} onChange={e => set('contact_person', e.target.value)} /></Field>
                  <Field label="Email" flex="1 1 220px"><input type="email" className="rm-input" value={f.email} onChange={e => set('email', e.target.value)} /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Phone" flex="1 1 200px"><input className="rm-input" value={f.phone} onChange={e => set('phone', e.target.value)} /></Field>
                  <Field label="Assigned To" flex="1 1 220px"><input className="rm-input" value={f.assigned_to} onChange={e => set('assigned_to', e.target.value)} placeholder="Sales / BD officer" /></Field>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-calendar-check-fill"></i> Follow-up &amp; Notes</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Next Follow-up" flex="1 1 200px"><input type="date" className="rm-input" value={f.next_follow_up} onChange={e => set('next_follow_up', e.target.value)} /></Field>
                  {f.stage === 'Lost' && <Field label="Lost Reason" flex="1 1 320px"><input className="rm-input" value={f.lost_reason} onChange={e => set('lost_reason', e.target.value)} placeholder="Why was this lost?" /></Field>}
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Description" flex="1 1 100%"><textarea className="rm-input" rows={2} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Details about the opportunity" /></Field>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-check-circle-fill"></i> {mode === 'create' ? 'Add Lead' : 'Save Changes'}</>}</button>
        </div>
      </div>
    </div>
  );
}
