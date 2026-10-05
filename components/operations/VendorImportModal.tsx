'use client';
import { useState, useEffect } from 'react';

export default function VendorImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/operations/vendors?available=1').then(r => r.json()).then(j => { if (j.success) setSuppliers(j.data); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const importOne = async (supplierId: number) => {
    setBusy(supplierId); setError('');
    try {
      const j = await (await fetch('/api/operations/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ supplier_id: supplierId }) })).json();
      if (j.success) { setSuppliers(p => p.filter(s => s.id !== supplierId)); onImported(); }
      else setError(j.message || 'Import failed.');
    } catch { setError('Network error.'); } finally { setBusy(null); }
  };

  const q = search.toLowerCase();
  const filtered = suppliers.filter(s => [s.company_name, s.email, s.services].some(v => String(v ?? '').toLowerCase().includes(q)));

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 720 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-box-arrow-in-down" style={{ marginRight: 8 }}></i>Import from Supplier Registrations</p><p className="usr-modal-sub">Approved / active suppliers not yet in your vendor list</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
            <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search supplier…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : (
            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr><th className="rm-th-module">Company</th><th className="rm-th-perm">Services</th><th className="rm-th-perm">State</th><th className="rm-th-perm">Action</th></tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 28, color: '#9ca3af', fontSize: 13 }}>No approved suppliers available to import.</td></tr>
                  ) : filtered.map(s => (
                    <tr key={s.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ color: '#1f2937' }}>{s.company_name}{s.email ? <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{s.email}</div> : null}</td>
                      <td className="rm-td-perm" style={{ fontSize: 12.5, color: '#6b7280' }}>{s.services ? String(s.services).split(',')[0].trim() : '—'}</td>
                      <td className="rm-td-perm" style={{ fontSize: 12.5, color: '#6b7280' }}>{s.state || '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}>
                        <button className="rm-btn-outline" style={{ padding: '4px 12px', fontSize: 12.5 }} disabled={busy === s.id} onClick={() => importOne(s.id)}>{busy === s.id ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-plus-lg"></i> Import</>}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
