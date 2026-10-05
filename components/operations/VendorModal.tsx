'use client';
import { useState, useEffect } from 'react';

const STATUSES = ['Active', 'Inactive'];

// Common SCM approved-vendor service categories (used on the public website).
const VENDOR_CATEGORIES = [
  'Ultrasonic Thickness Measurement',
  'In-Water Survey',
  'Radio Communication Equipment Survey',
  'Performance Tests of VDR / SVDR',
  'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey',
  'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service',
  'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service',
  'BWMS Commissioning Testing',
];

const VENDOR_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis',
  'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu',
  'W.P. Kuala Lumpur', 'W.P. Labuan', 'W.P. Putrajaya', 'Singapore', 'Indonesia', 'Others',
];

const EMPTY = { name: '', category: '', manufacturer: '', contact_person: '', phone: '', fax: '', email: '', address: '', state: '', expiry_date: '', status: 'Active', published: true, notes: '' };

function Field({ label, req, flex = '1 1 220px', children }: { label: string; req?: boolean; flex?: string; children: React.ReactNode }) {
  return (
    <div style={{ flex }}>
      <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>{label}{req && <span style={{ color: '#ef4444' }}> *</span>}</label>
      {children}
    </div>
  );
}

export default function VendorModal({ mode, vendorId, onClose, onSaved }: {
  mode: 'create' | 'edit'; vendorId?: number; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState<any>(EMPTY);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('Manual');
  const [catOptions, setCatOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/operations/vendor-categories').then(r => r.json())
      .then(j => { if (j.success && Array.isArray(j.data)) setCatOptions(j.data.map((c: any) => c.name)); })
      .catch(() => { /* fall back to VENDOR_CATEGORIES */ });
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !vendorId) return;
    fetch(`/api/operations/vendors/${vendorId}`).then(r => r.json()).then(j => {
      if (j.success) {
        const d = j.data;
        setF({
          name: d.name || '', category: d.category || '', manufacturer: d.manufacturer || '',
          contact_person: d.contact_person || '', phone: d.phone || '', fax: d.fax || '',
          email: d.email || '', address: d.address || '', state: d.state || '',
          expiry_date: d.expiry_date ? String(d.expiry_date).slice(0, 10) : '',
          status: d.status || 'Active', published: d.published !== 0 && d.published !== false, notes: d.notes || '',
        });
        setSource(d.source || 'Manual');
      }
    }).finally(() => setLoading(false));
  }, [mode, vendorId]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.name?.trim()) { setError('Vendor name is required.'); return; }
    setSaving(true); setError('');
    try {
      const url = mode === 'create' ? '/api/operations/vendors' : `/api/operations/vendors/${vendorId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const j = await (await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })).json();
      if (!j.success) { setError(j.message || 'Failed to save.'); setSaving(false); return; }
      onSaved();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 720 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-truck" style={{ marginRight: 8 }}></i>{mode === 'create' ? 'Add Vendor' : 'Edit Vendor'}</p>{mode === 'edit' && <p className="usr-modal-sub">{source === 'Registration' ? 'Imported from supplier registration' : 'Manually added'}</p>}</div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : (
            <>
              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-truck"></i> Vendor</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Vendor Name" req flex="1 1 100%"><input className="rm-input" value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Cisco Systems Malaysia Sdn Bhd" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Service Category" flex="1 1 100%">
                    <input className="rm-input" list="vendor-cat-list" value={f.category} onChange={e => set('category', e.target.value)} placeholder="Select or type a service category…" />
                    <datalist id="vendor-cat-list">
                      {(catOptions.length ? catOptions : VENDOR_CATEGORIES).map(c => <option key={c} value={c} />)}
                    </datalist>
                  </Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Authorized Manufacturer" flex="1 1 240px"><input className="rm-input" value={f.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="e.g. FURUNO (for VDR/SVDR)" /></Field>
                  <Field label="Approval Expiry Date" flex="1 1 180px"><input type="date" className="rm-input" value={f.expiry_date} onChange={e => set('expiry_date', e.target.value)} /></Field>
                  <Field label="Status" flex="1 1 150px"><select className="rm-input" value={f.status} onChange={e => set('status', e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mt-3" style={{ padding: '0 2px' }}>
                  <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={f.published} onChange={e => set('published', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#0052cc' }} />
                    <span style={{ fontSize: 13, color: '#374151' }}>Show on public website
                      <span style={{ display: 'block', fontSize: 11.5, color: '#9ca3af' }}>Uncheck to keep this vendor in records but hide it from the website directory.</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-person-lines-fill"></i> Contact</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Contact Person" flex="1 1 220px"><input className="rm-input" value={f.contact_person} onChange={e => set('contact_person', e.target.value)} /></Field>
                  <Field label="Phone / Tel" flex="1 1 200px"><input className="rm-input" value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+60X-XXXXXXX" /></Field>
                  <Field label="Fax" flex="1 1 200px"><input className="rm-input" value={f.fax} onChange={e => set('fax', e.target.value)} placeholder="+60X-XXXXXXX" /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <Field label="Email" flex="1 1 240px"><input type="email" className="rm-input" value={f.email} onChange={e => set('email', e.target.value)} /></Field>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <Field label="Address" flex="1 1 340px"><input className="rm-input" value={f.address} onChange={e => set('address', e.target.value)} /></Field>
                  <Field label="State / Region" flex="1 1 200px">
                    <select className="rm-input" value={f.state} onChange={e => set('state', e.target.value)}>
                      <option value="">Select…</option>
                      {VENDOR_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="d-flex flex-wrap gap-3 mt-3" style={{ padding: '0 2px' }}>
                  <Field label="Notes" flex="1 1 100%"><textarea className="rm-input" rows={2} value={f.notes} onChange={e => set('notes', e.target.value)} /></Field>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-check-circle-fill"></i> {mode === 'create' ? 'Add Vendor' : 'Save Changes'}</>}</button>
        </div>
      </div>
    </div>
  );
}
