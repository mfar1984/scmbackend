'use client';
import { useState, useEffect } from 'react';
import { compileImagesToPdf } from './compilePdf';

const STAGES = ['Draft', 'In Progress', 'Submitted', 'Evaluation', 'Awarded', 'Unsuccessful', 'Closed'];
const CATEGORIES = ['Supply', 'Services', 'Works', 'Supply & Install'];
const METHODS = ['Open Tender', 'Selective Tender', 'Quotation', 'Direct Negotiation'];
const DOC_TYPES = ['Tender Notice', 'Technical Proposal', 'Financial Proposal', 'Company Profile', 'Certificate', 'General'];

function readFileB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result || '')); r.onerror = reject; r.readAsDataURL(file); });
}

const EMPTY = {
  ref_no: '', name: '', agency: '', category: 'Supply', procurement_method: 'Open Tender', description: '',
  closing_date: '', closing_time: '', briefing_date: '', estimated_value: '', document_fee: '', tender_deposit: '',
  assigned_to: '', contact_person: '', contact_designation: '', contact_phone: '', contact_email: '', agency_address: '',
  stage: 'Draft', submitted_date: '',
  eval_type: '', eval_officer: '', eval_status: '', technical_score: '', financial_score: '', eval_remarks: '',
  contract_no: '', actual_value: '', award_date: '', project_start: '', project_end: '', award_status: '',
  outcome: '', outcome_reason: '', reference_price: '',
};

/* Labelled field helper */
function Field({ label, req, hint, flex = '1 1 220px', children }: { label: string; req?: boolean; hint?: string; flex?: string; children: React.ReactNode }) {
  return (
    <div style={{ flex }}>
      <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>{label}{req && <span style={{ color: '#ef4444' }}> *</span>}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

export default function TenderModal({ mode, tenderId, fmt, onClose, onSaved }: {
  mode: 'create' | 'edit'; tenderId?: number; fmt: (d: any, t?: boolean) => string; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState<any>(EMPTY);
  const [docs, setDocs] = useState<any[]>([]);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]); // staged before tender exists (create mode)
  const [hasCompiled, setHasCompiled] = useState(false);
  const [loading, setLoading] = useState(mode !== 'create');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'details' | 'docs'>('details');

  const [upType, setUpType] = useState('General');
  const [upName, setUpName] = useState('');
  const [upData, setUpData] = useState('');
  const [uploading, setUploading] = useState(false);
  const [compiling, setCompiling] = useState(false);

  const load = async () => {
    if (!tenderId) return;
    const j = await (await fetch(`/api/operations/tenders/${tenderId}`)).json();
    if (j.success) {
      const d = j.data;
      const D = (v: any) => v ? String(v).slice(0, 10) : '';
      setF({
        ref_no: d.ref_no || '', name: d.name || '', agency: d.agency || '', category: d.category || 'Supply',
        procurement_method: d.procurement_method || 'Open Tender', description: d.description || '',
        closing_date: D(d.closing_date), closing_time: d.closing_time || '', briefing_date: D(d.briefing_date),
        estimated_value: d.estimated_value ?? '', document_fee: d.document_fee ?? '', tender_deposit: d.tender_deposit ?? '',
        assigned_to: d.assigned_to || '', contact_person: d.contact_person || '', contact_designation: d.contact_designation || '',
        contact_phone: d.contact_phone || '', contact_email: d.contact_email || '', agency_address: d.agency_address || '',
        stage: d.stage || 'Draft', submitted_date: D(d.submitted_date),
        eval_type: d.eval_type || '', eval_officer: d.eval_officer || '', eval_status: d.eval_status || '',
        technical_score: d.technical_score ?? '', financial_score: d.financial_score ?? '', eval_remarks: d.eval_remarks || '',
        contract_no: d.contract_no || '', actual_value: d.actual_value ?? '', award_date: D(d.award_date),
        project_start: D(d.project_start), project_end: D(d.project_end), award_status: d.award_status || '',
        outcome: d.outcome || '', outcome_reason: d.outcome_reason || '', reference_price: d.reference_price ?? '',
      });
      setDocs(d.documents || []);
      setHasCompiled(!!d.has_compiled);
    }
  };
  useEffect(() => { if (mode !== 'create') load().finally(() => setLoading(false)); /* eslint-disable-next-line */ }, [tenderId]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.name?.trim()) { setError('Tender name is required.'); setTab('details'); return; }
    if (!f.ref_no?.trim()) { setError('Reference number is required.'); setTab('details'); return; }
    setSaving(true); setError('');
    try {
      const url = mode === 'create' ? '/api/operations/tenders' : `/api/operations/tenders/${tenderId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const j = await (await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })).json();
      if (!j.success) { setError(j.message || 'Failed to save.'); setSaving(false); return; }
      // On create, upload any staged documents to the new tender
      if (mode === 'create' && j.id && pendingDocs.length) {
        for (const d of pendingDocs) {
          await fetch('/api/operations/tender-documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tender_id: j.id, doc_type: d.doc_type, file_name: d.file_name, file_data: d.file_data }) });
        }
      }
      onSaved();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const pickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setUpData(''); setUpName(''); return; }
    if (file.size > 12 * 1024 * 1024) { setError(`${file.name} exceeds 12MB`); e.target.value = ''; return; }
    setError(''); setUpData(await readFileB64(file)); setUpName(file.name);
  };
  const addDoc = async () => {
    if (!upData) { setError('Choose a file first.'); return; }
    const mime = (upData.match(/^data:([^;]+);/) || [])[1] || 'application/octet-stream';
    if (mode === 'create') {
      // stage locally — uploaded after the tender is created
      setPendingDocs(p => [...p, { doc_type: upType, file_name: upName, file_data: upData, mime_type: mime }]);
      setUpData(''); setUpName('');
      return;
    }
    if (!tenderId) return;
    setUploading(true); setError('');
    try {
      const j = await (await fetch('/api/operations/tender-documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tender_id: tenderId, doc_type: upType, file_name: upName, file_data: upData }) })).json();
      if (j.success) { setUpData(''); setUpName(''); await load(); } else setError(j.message || 'Upload failed.');
    } catch { setError('Network error.'); } finally { setUploading(false); }
  };
  const deleteDoc = async (docId: number) => { await fetch(`/api/operations/tender-documents?id=${docId}`, { method: 'DELETE' }); await load(); };
  const removePending = (i: number) => setPendingDocs(p => p.filter((_, idx) => idx !== i));
  const compile = async () => {
    if (!tenderId) return;
    setCompiling(true); setError('');
    try {
      const imageDocs = docs.filter(d => (d.mime_type || '').startsWith('image/'));
      if (imageDocs.length === 0) { setError('No image documents to compile. Upload scanned images (JPG/PNG) first.'); setCompiling(false); return; }
      const urls: string[] = [];
      for (const d of imageDocs) {
        const res = await fetch(`/api/operations/tender-documents?id=${d.id}`);
        const blob = await res.blob();
        urls.push(await new Promise<string>(resolve => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.readAsDataURL(blob); }));
      }
      const pdf = await compileImagesToPdf(urls);
      const j = await (await fetch(`/api/operations/tenders/${tenderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ compiled_doc: pdf, compiled_doc_name: `${f.ref_no || 'tender'}-submission.pdf` }) })).json();
      if (j.success) setHasCompiled(true); else setError(j.message || 'Compile failed.');
    } catch (e: any) { setError('Compile error: ' + (e?.message || 'unknown')); } finally { setCompiling(false); }
  };

  const showEval = ['Submitted', 'Evaluation', 'Awarded', 'Unsuccessful', 'Closed'].includes(f.stage);
  const showAward = ['Awarded', 'Closed'].includes(f.stage);
  const showArchive = ['Unsuccessful', 'Closed'].includes(f.stage);

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 880 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-file-earmark-text" style={{ marginRight: 8 }}></i>{mode === 'create' ? 'New Tender' : 'Edit Tender'}</p>{f.ref_no && <p className="usr-modal-sub">{f.ref_no}</p>}</div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>

        <div className="int-tabs" style={{ padding: '0 24px', marginTop: 4 }}>
          <button className={`int-tab-btn${tab === 'details' ? ' active' : ''}`} onClick={() => setTab('details')}>Details</button>
          <button className={`int-tab-btn${tab === 'docs' ? ' active' : ''}`} onClick={() => setTab('docs')}>Documents ({mode === 'create' ? pendingDocs.length : docs.length})</button>
        </div>

        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : tab === 'details' ? (
            <>
              {/* Tender Information */}
              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-file-earmark-text-fill"></i> Tender Information</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Tender Name" req flex="1 1 100%"><input className="rm-input" value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Supply & Installation of Structured Cabling System" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Reference No" req flex="1 1 220px"><input className="rm-input" value={f.ref_no} onChange={e => set('ref_no', e.target.value)} placeholder="e.g. KPM/ICT/2026/001" /></Field>
                  <Field label="Category" flex="1 1 180px"><select className="rm-input" value={f.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
                  <Field label="Procurement Method" flex="1 1 200px"><select className="rm-input" value={f.procurement_method} onChange={e => set('procurement_method', e.target.value)}>{METHODS.map(m => <option key={m}>{m}</option>)}</select></Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Stage" flex="1 1 180px"><select className="rm-input" value={f.stage} onChange={e => set('stage', e.target.value)}>{STAGES.map(s => <option key={s}>{s}</option>)}</select></Field>
                  <Field label="Assigned To (Internal)" flex="1 1 220px"><input className="rm-input" value={f.assigned_to} onChange={e => set('assigned_to', e.target.value)} placeholder="Officer handling this tender" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mt-3" style={{ padding: '0 2px' }}>
                  <Field label="Scope / Description" flex="1 1 100%"><textarea className="rm-input" rows={2} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Brief scope of the tender" /></Field>
                </div>
              </div>

              {/* Agency & Contact */}
              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-building-fill"></i> Agency &amp; Contact</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Agency / Client" flex="1 1 320px"><input className="rm-input" value={f.agency} onChange={e => set('agency', e.target.value)} placeholder="e.g. Kementerian Pendidikan Malaysia" /></Field>
                  <Field label="Agency Address" flex="1 1 320px"><input className="rm-input" value={f.agency_address} onChange={e => set('agency_address', e.target.value)} placeholder="Address of the procuring agency" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Contact Person" flex="1 1 220px"><input className="rm-input" value={f.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Name of agency contact" /></Field>
                  <Field label="Designation" flex="1 1 220px"><input className="rm-input" value={f.contact_designation} onChange={e => set('contact_designation', e.target.value)} placeholder="e.g. Procurement Officer" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Contact Phone" flex="1 1 220px"><input className="rm-input" value={f.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="03-XXXX XXXX" /></Field>
                  <Field label="Contact Email" flex="1 1 220px"><input type="email" className="rm-input" value={f.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="officer@agency.gov.my" /></Field>
                </div>
              </div>

              {/* Timeline & Fees */}
              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-calendar-event-fill"></i> Timeline &amp; Fees</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Briefing Date" flex="1 1 180px"><input type="date" className="rm-input" value={f.briefing_date} onChange={e => set('briefing_date', e.target.value)} /></Field>
                  <Field label="Closing Date" flex="1 1 180px"><input type="date" className="rm-input" value={f.closing_date} onChange={e => set('closing_date', e.target.value)} /></Field>
                  <Field label="Closing Time" flex="1 1 140px"><input type="time" className="rm-input" value={f.closing_time} onChange={e => set('closing_time', e.target.value)} /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Estimated Value (RM)" flex="1 1 180px"><input type="number" step="0.01" className="rm-input" value={f.estimated_value} onChange={e => set('estimated_value', e.target.value)} placeholder="0.00" /></Field>
                  <Field label="Document Fee (RM)" flex="1 1 160px"><input type="number" step="0.01" className="rm-input" value={f.document_fee} onChange={e => set('document_fee', e.target.value)} placeholder="0.00" /></Field>
                  <Field label="Tender Deposit (RM)" flex="1 1 160px"><input type="number" step="0.01" className="rm-input" value={f.tender_deposit} onChange={e => set('tender_deposit', e.target.value)} placeholder="0.00" /></Field>
                </div>
              </div>

              {showEval && (
                <div className="int-card">
                  <div className="int-card-title"><i className="bi bi-clipboard-data-fill"></i> Submission &amp; Evaluation</div>
                  <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                    <Field label="Submitted Date" flex="1 1 160px"><input type="date" className="rm-input" value={f.submitted_date} onChange={e => set('submitted_date', e.target.value)} /></Field>
                    <Field label="Evaluation Type" flex="1 1 140px"><select className="rm-input" value={f.eval_type} onChange={e => set('eval_type', e.target.value)}><option value="">—</option><option>Technical</option><option>Financial</option><option>Both</option></select></Field>
                    <Field label="Eval Status" flex="1 1 140px"><select className="rm-input" value={f.eval_status} onChange={e => set('eval_status', e.target.value)}><option value="">—</option><option>Pending</option><option>In Progress</option><option>Completed</option></select></Field>
                  </div>
                  <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                    <Field label="Officer In Charge" flex="1 1 200px"><input className="rm-input" value={f.eval_officer} onChange={e => set('eval_officer', e.target.value)} /></Field>
                    <Field label="Technical Score" flex="1 1 130px"><input type="number" step="0.01" className="rm-input" value={f.technical_score} onChange={e => set('technical_score', e.target.value)} placeholder="0-100" /></Field>
                    <Field label="Financial Score" flex="1 1 130px"><input type="number" step="0.01" className="rm-input" value={f.financial_score} onChange={e => set('financial_score', e.target.value)} placeholder="0-100" /></Field>
                  </div>
                  <div style={{ padding: '0 2px' }}><Field label="Evaluation Remarks" flex="1 1 100%"><textarea className="rm-input" rows={2} value={f.eval_remarks} onChange={e => set('eval_remarks', e.target.value)} /></Field></div>
                </div>
              )}

              {showAward && (
                <div className="int-card">
                  <div className="int-card-title"><i className="bi bi-trophy-fill"></i> Award</div>
                  <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                    <Field label="Contract No" flex="1 1 180px"><input className="rm-input" value={f.contract_no} onChange={e => set('contract_no', e.target.value)} /></Field>
                    <Field label="Actual Value (RM)" flex="1 1 160px"><input type="number" step="0.01" className="rm-input" value={f.actual_value} onChange={e => set('actual_value', e.target.value)} /></Field>
                    <Field label="Award Date" flex="1 1 150px"><input type="date" className="rm-input" value={f.award_date} onChange={e => set('award_date', e.target.value)} /></Field>
                  </div>
                  <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                    <Field label="Project Start" flex="1 1 150px"><input type="date" className="rm-input" value={f.project_start} onChange={e => set('project_start', e.target.value)} /></Field>
                    <Field label="Project End" flex="1 1 150px"><input type="date" className="rm-input" value={f.project_end} onChange={e => set('project_end', e.target.value)} /></Field>
                    <Field label="Award Status" flex="1 1 140px"><select className="rm-input" value={f.award_status} onChange={e => set('award_status', e.target.value)}><option value="">—</option><option>Active</option><option>Completed</option></select></Field>
                  </div>
                </div>
              )}

              {showArchive && (
                <div className="int-card">
                  <div className="int-card-title"><i className="bi bi-archive-fill"></i> Outcome / Archive</div>
                  <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                    <Field label="Outcome" flex="1 1 180px"><select className="rm-input" value={f.outcome} onChange={e => set('outcome', e.target.value)}><option value="">—</option><option>Unsuccessful</option><option>Cancelled</option><option>Expired</option></select></Field>
                    <Field label="Reference Price (RM)" flex="1 1 180px"><input type="number" step="0.01" className="rm-input" value={f.reference_price} onChange={e => set('reference_price', e.target.value)} /></Field>
                  </div>
                  <div style={{ padding: '0 2px' }}><Field label="Reason" flex="1 1 100%"><textarea className="rm-input" rows={2} value={f.outcome_reason} onChange={e => set('outcome_reason', e.target.value)} /></Field></div>
                </div>
              )}
            </>
          ) : (
            /* DOCUMENTS TAB */
            <>
              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-upload"></i> {mode === 'create' ? 'Attach Document' : 'Upload Document'}</div>
                {mode === 'create' && <div style={{ padding: '0 2px 10px', fontSize: 12.5, color: '#6b7280' }}>Attach documents now — they will be uploaded automatically once the tender is created.</div>}
                <div className="d-flex flex-wrap gap-2 align-items-end" style={{ padding: '0 2px' }}>
                  <Field label="Type" flex="1 1 180px"><select className="rm-input" value={upType} onChange={e => setUpType(e.target.value)}>{DOC_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
                  <Field label="File" flex="2 1 240px"><label className="srm-file-btn" style={{ width: '100%', justifyContent: 'flex-start' }}><i className="bi bi-paperclip"></i><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{upName || 'Choose File (PDF / JPG / PNG)'}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={pickUpload} /></label></Field>
                  <button className="rm-btn-primary" disabled={uploading || !upData} onClick={addDoc}>{uploading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-plus-lg"></i> Add</>}</button>
                </div>
              </div>

              {mode === 'create' ? (
                <div className="rm-table-wrap">
                  <table className="rm-table">
                    <thead><tr><th className="rm-th-module">Type</th><th className="rm-th-module">File</th><th className="rm-th-perm">Actions</th></tr></thead>
                    <tbody>
                      {pendingDocs.length === 0 ? (
                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: 28, color: '#9ca3af', fontSize: 13 }}>No documents attached yet.</td></tr>
                      ) : pendingDocs.map((d, i) => (
                        <tr key={i} className="rm-data-row">
                          <td className="rm-td-module"><span className="usr-role-badge">{d.doc_type}</span></td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#374151' }}><i className={`bi ${(d.mime_type || '').includes('pdf') ? 'bi-file-earmark-pdf' : 'bi-file-earmark-image'} me-1`}></i>{d.file_name}</td>
                          <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                            <button className="rm-action-btn rm-action-delete" title="Remove" onClick={() => removePending(i)}><i className="bi bi-trash-fill"></i></button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rm-table-wrap">
                  <table className="rm-table">
                    <thead><tr><th className="rm-th-module">Type</th><th className="rm-th-module">File</th><th className="rm-th-perm">Uploaded</th><th className="rm-th-perm">Actions</th></tr></thead>
                    <tbody>
                      {docs.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: 28, color: '#9ca3af', fontSize: 13 }}>No documents uploaded.</td></tr>
                      ) : docs.map(d => (
                        <tr key={d.id} className="rm-data-row">
                          <td className="rm-td-module"><span className="usr-role-badge">{d.doc_type}</span></td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#374151' }}><i className={`bi ${(d.mime_type || '').includes('pdf') ? 'bi-file-earmark-pdf' : 'bi-file-earmark-image'} me-1`}></i>{d.file_name}</td>
                          <td className="rm-td-perm" style={{ fontSize: 12, color: '#6b7280' }}>{fmt(d.uploaded_at)}</td>
                          <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                            <a className="rm-action-btn rm-action-view" title="View" href={`/api/operations/tender-documents?id=${d.id}`} target="_blank" rel="noreferrer"><i className="bi bi-eye-fill"></i></a>
                            <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => deleteDoc(d.id)}><i className="bi bi-trash-fill"></i></button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {mode !== 'create' && (
                <div className="int-card" style={{ marginTop: 14 }}>
                  <div className="int-card-title"><i className="bi bi-file-earmark-pdf-fill"></i> Compiled Submission PDF</div>
                  <div style={{ padding: '0 2px', fontSize: 12.5, color: '#6b7280', marginBottom: 10 }}>Compile all uploaded <strong>image</strong> documents (scans) into a single PDF bundle attached to this tender.</div>
                  <div className="d-flex gap-2 align-items-center" style={{ padding: '0 2px' }}>
                    <button className="rm-btn-outline" onClick={compile} disabled={compiling}>{compiling ? <><span className="spinner-border spinner-border-sm me-1"></span> Compiling…</> : <><i className="bi bi-file-earmark-pdf"></i> Compile &amp; Scan to PDF</>}</button>
                    {hasCompiled ? <a className="rm-btn-primary" href={`/api/operations/tenders/${tenderId}?compiled=1`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><i className="bi bi-download"></i> View Compiled PDF</a> : <span style={{ fontSize: 12.5, color: '#9ca3af' }}>No compiled PDF yet.</span>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-check-circle-fill"></i> {mode === 'create' ? 'Create Tender' : 'Save Changes'}</>}</button>
        </div>
      </div>
    </div>
  );
}
