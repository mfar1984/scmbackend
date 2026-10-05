'use client';
import { useState, useEffect } from 'react';

const SECTORS = ['Government', 'Education', 'Healthcare', 'Local Government', 'Private', 'Property', 'Other'];
const STATUSES = ['Active', 'Prospect', 'Inactive'];

const EMPTY = {
  company: '', industry: '', sector: 'Government', contact_person: '', designation: '',
  email: '', phone: '', address: '', website: '', potential_value: '', status: 'Prospect', last_contact: '', notes: '',
};

function Field({ label, req, flex = '1 1 220px', children }: { label: string; req?: boolean; flex?: string; children: React.ReactNode }) {
  return (
    <div style={{ flex }}>
      <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>{label}{req && <span style={{ color: '#ef4444' }}> *</span>}</label>
      {children}
    </div>
  );
}

export default function ClientModal({ mode, clientId, onClose, onSaved }: {
  mode: 'create' | 'edit'; clientId?: number; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState<any>(EMPTY);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !clientId) return;
    fetch(`/api/operations/clients/${clientId}`).then(r => r.json()).then(j => {
      if (j.success) {
        const d = j.data;
        setF({
          company: d.company || '', industry: d.industry || '', sector: d.sector || 'Government',
          contact_person: d.contact_person || '', designation: d.designation || '', email: d.email || '',
          phone: d.phone || '', address: d.address || '', website: d.website || '',
          potential_value: d.potential_value ?? '', status: d.status || 'Prospect',
          last_contact: d.last_contact ? String(d.last_contact).slice(0, 10) : '', notes: d.notes || '',
        });
      }
    }).finally(() => setLoading(false));
  }, [mode, clientId]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.company?.trim()) { setError('Company name is required.'); return; }
    setSaving(true); setError('');
    try {
      const url = mode === 'create' ? '/api/operations/clients' : `/api/operations/clients/${clientId}`;
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
          <div><p className="usr-modal-title"><i className="bi bi-building" style={{ marginRight: 8 }}></i>{mode === 'create' ? 'Add Client' : 'Edit Client'}</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : (
            <>
              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-building-fill"></i> Company</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Company Name" req flex="1 1 100%"><input className="rm-input" value={f.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Politeknik Sultan Salahuddin" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Sector" flex="1 1 180px"><select className="rm-input" value={f.sector} onChange={e => set('sector', e.target.value)}>{SECTORS.map(s => <option key={s}>{s}</option>)}</select></Field>
                  <Field label="Industry" flex="1 1 200px"><input className="rm-input" value={f.industry} onChange={e => set('industry', e.target.value)} placeholder="e.g. Higher Education" /></Field>
                  <Field label="Status" flex="1 1 150px"><select className="rm-input" value={f.status} onChange={e => set('status', e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Website" flex="1 1 240px"><input className="rm-input" value={f.website} onChange={e => set('website', e.target.value)} placeholder="https://" /></Field>
                  <Field label="Address" flex="1 1 320px"><input className="rm-input" value={f.address} onChange={e => set('address', e.target.value)} placeholder="Office address" /></Field>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-person-lines-fill"></i> Primary Contact</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Contact Person" flex="1 1 220px"><input className="rm-input" value={f.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Name" /></Field>
                  <Field label="Designation" flex="1 1 200px"><input className="rm-input" value={f.designation} onChange={e => set('designation', e.target.value)} placeholder="e.g. Procurement Officer" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Email" flex="1 1 240px"><input type="email" className="rm-input" value={f.email} onChange={e => set('email', e.target.value)} placeholder="name@company.com" /></Field>
                  <Field label="Phone" flex="1 1 200px"><input className="rm-input" value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="03-XXXX XXXX" /></Field>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-graph-up-arrow"></i> Opportunity</div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Potential Value (RM)" flex="1 1 200px"><input type="number" step="0.01" className="rm-input" value={f.potential_value} onChange={e => set('potential_value', e.target.value)} placeholder="0.00" /></Field>
                  <Field label="Last Contact Date" flex="1 1 180px"><input type="date" className="rm-input" value={f.last_contact} onChange={e => set('last_contact', e.target.value)} /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mt-3" style={{ padding: '0 2px' }}>
                  <Field label="Notes" flex="1 1 100%"><textarea className="rm-input" rows={2} value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Relationship notes, history, etc." /></Field>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-check-circle-fill"></i> {mode === 'create' ? 'Add Client' : 'Save Changes'}</>}</button>
        </div>
      </div>
    </div>
  );
}
