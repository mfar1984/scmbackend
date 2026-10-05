'use client';
import { useState, useEffect } from 'react';

const STATUSES = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];

function readFileB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result || '')); r.onerror = reject; r.readAsDataURL(file); });
}

const EMPTY = {
  ref_no: '', title: '', client_id: '', client_name: '', contact_person: '', contact_email: '',
  summary: '', scope: '', value: '', issued_date: '', valid_until: '', status: 'Draft', notes: '',
};

function Field({ label, req, flex = '1 1 220px', children }: { label: string; req?: boolean; flex?: string; children: React.ReactNode }) {
  return (
    <div style={{ flex }}>
      <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>{label}{req && <span style={{ color: '#ef4444' }}> *</span>}</label>
      {children}
    </div>
  );
}

export default function ProposalModal({ mode, proposalId, onClose, onSaved }: {
  mode: 'create' | 'edit'; proposalId?: number; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState<any>(EMPTY);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [docName, setDocName] = useState('');
  const [docData, setDocData] = useState('');     // new upload (data URL)
  const [hasDoc, setHasDoc] = useState(false);     // existing attachment
  const [removeDoc, setRemoveDoc] = useState(false);

  useEffect(() => {
    fetch('/api/operations/clients').then(r => r.json()).then(j => { if (j.success) setClients(j.data); });
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !proposalId) return;
    fetch(`/api/operations/proposals/${proposalId}`).then(r => r.json()).then(j => {
      if (j.success) {
        const d = j.data;
        setF({
          ref_no: d.ref_no || '', title: d.title || '', client_id: d.client_id ?? '', client_name: d.client_name || '',
          contact_person: d.contact_person || '', contact_email: d.contact_email || '', summary: d.summary || '',
          scope: d.scope || '', value: d.value ?? '', issued_date: d.issued_date ? String(d.issued_date).slice(0, 10) : '',
          valid_until: d.valid_until ? String(d.valid_until).slice(0, 10) : '', status: d.status || 'Draft', notes: d.notes || '',
        });
        setHasDoc(!!d.has_doc); setDocName(d.doc_name || '');
      }
    }).finally(() => setLoading(false));
  }, [mode, proposalId]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const pickClient = (cid: string) => {
    const c = clients.find(x => String(x.id) === String(cid));
    setF((p: any) => ({ ...p, client_id: cid, client_name: c ? c.company : p.client_name, contact_person: c?.contact_person || p.contact_person, contact_email: c?.email || p.contact_email }));
  };

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setDocData(''); return; }
    if (file.size > 12 * 1024 * 1024) { setError(`${file.name} exceeds 12MB`); e.target.value = ''; return; }
    setError(''); setDocData(await readFileB64(file)); setDocName(file.name); setRemoveDoc(false);
  };

  const save = async () => {
    if (!f.title?.trim()) { setError('Proposal title is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload: any = { ...f };
      if (docData) { payload.doc_data = docData; payload.doc_name = docName; }
      else if (removeDoc) { payload.doc_data = ''; }
      const url = mode === 'create' ? '/api/operations/proposals' : `/api/operations/proposals/${proposalId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const j = await (await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
      if (!j.success) { setError(j.message || 'Failed to save.'); setSaving(false); return; }
      onSaved();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 820 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-file-earmark-richtext" style={{ marginRight: 8 }}></i>{mode === 'create' ? 'New Proposal' : 'Edit Proposal'}</p>{f.ref_no && <p className="usr-modal-sub">{f.ref_no}</p>}</div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : (
            <>
              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-file-earmark-text-fill"></i> Proposal</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Proposal Title" req flex="1 1 100%"><input className="rm-input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Structured Cabling System Proposal" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Reference No" flex="1 1 200px"><input className="rm-input" value={f.ref_no} onChange={e => set('ref_no', e.target.value)} placeholder="e.g. ATL/PRP/2026/001" /></Field>
                  <Field label="Status" flex="1 1 160px"><select className="rm-input" value={f.status} onChange={e => set('status', e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>
                  <Field label="Proposed Value (RM)" flex="1 1 180px"><input type="number" step="0.01" className="rm-input" value={f.value} onChange={e => set('value', e.target.value)} placeholder="0.00" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Issued Date" flex="1 1 180px"><input type="date" className="rm-input" value={f.issued_date} onChange={e => set('issued_date', e.target.value)} /></Field>
                  <Field label="Valid Until" flex="1 1 180px"><input type="date" className="rm-input" value={f.valid_until} onChange={e => set('valid_until', e.target.value)} /></Field>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-building-fill"></i> Client</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Linked Client" flex="1 1 280px"><select className="rm-input" value={f.client_id} onChange={e => pickClient(e.target.value)}><option value="">— None —</option>{clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}</select></Field>
                  <Field label="Client Name" flex="1 1 240px"><input className="rm-input" value={f.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Client / company name" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Contact Person" flex="1 1 220px"><input className="rm-input" value={f.contact_person} onChange={e => set('contact_person', e.target.value)} /></Field>
                  <Field label="Contact Email" flex="1 1 240px"><input type="email" className="rm-input" value={f.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="Recipient when sending" /></Field>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-card-text"></i> Content</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Executive Summary" flex="1 1 100%"><textarea className="rm-input" rows={2} value={f.summary} onChange={e => set('summary', e.target.value)} placeholder="One-paragraph summary shown in the email" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Scope of Work" flex="1 1 100%"><textarea className="rm-input" rows={3} value={f.scope} onChange={e => set('scope', e.target.value)} placeholder="Detailed scope / deliverables" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Internal Notes" flex="1 1 100%"><textarea className="rm-input" rows={2} value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Not sent to client" /></Field>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-paperclip"></i> Proposal Document (PDF)</div>
                <div style={{ padding: '0 2px 10px', fontSize: 12.5, color: '#6b7280' }}>Attach the proposal PDF — it will be sent to the client as an email attachment.</div>
                <div className="d-flex flex-wrap gap-2 align-items-center" style={{ padding: '0 2px' }}>
                  <label className="srm-file-btn" style={{ flex: '2 1 240px', justifyContent: 'flex-start' }}><i className="bi bi-paperclip"></i><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docName || 'Choose File (PDF / DOC)'}</span><input type="file" accept=".pdf,.doc,.docx" onChange={pickFile} /></label>
                  {mode === 'edit' && hasDoc && !docData && !removeDoc && (
                    <>
                      <a className="rm-btn-outline" href={`/api/operations/proposals/${proposalId}?doc=1`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><i className="bi bi-eye-fill"></i> View Current</a>
                      <button className="rm-action-btn rm-action-delete" title="Remove attachment" onClick={() => { setRemoveDoc(true); setDocName(''); }}><i className="bi bi-trash-fill"></i></button>
                    </>
                  )}
                  {removeDoc && <span style={{ fontSize: 12.5, color: '#dc2626' }}>Attachment will be removed on save.</span>}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-check-circle-fill"></i> {mode === 'create' ? 'Create Proposal' : 'Save Changes'}</>}</button>
        </div>
      </div>
    </div>
  );
}
