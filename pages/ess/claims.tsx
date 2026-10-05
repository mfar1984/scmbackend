'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import EssLayout from '../../components/ess/EssLayout';
import { useDateFormat } from '../../lib/useDateFormat';

type Row = { id: number; reference_no: string; claim_type_name: string | null; claim_date: string | null; amount: number; item_count: number; status: string };
type Item = { item_date: string; description: string; category_id: string; amount: string; remarks: string; receipt: string; receipt_name: string };
const STATUS_BADGE: Record<string, string> = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' };

function readFileB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result || '')); r.onerror = reject; r.readAsDataURL(file); });
}

export default function EssClaims() {
  const { fmt } = useDateFormat();
  const [rows, setRows] = useState<Row[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [claimTypeId, setClaimTypeId] = useState('');
  const [claimDate, setClaimDate] = useState('');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/ess/claim')).json(); if (j.success) setRows(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    fetchRows();
    fetch('/api/hr/claim-types').then(r => r.json()).then(j => { if (j.success) setTypes(j.data.filter((x: any) => x.status === 'Active')); });
    fetch('/api/hr/expense-categories').then(r => r.json()).then(j => { if (j.success) setCategories(j.data.filter((x: any) => x.status === 'Active')); });
  }, [fetchRows]);

  const money = (v: any) => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 });
  const total = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);

  const open = () => { setClaimTypeId(''); setClaimDate(''); setDescription(''); setRemarks(''); setItems([]); setError(''); setModal(true); };
  const addItem = () => setItems(p => [...p, { item_date: '', description: '', category_id: '', amount: '', remarks: '', receipt: '', receipt_name: '' }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const setItem = (i: number, k: keyof Item, v: string) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const pickReceipt = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setItem(i, 'receipt', ''); setItem(i, 'receipt_name', ''); return; }
    if (file.size > 5 * 1024 * 1024) { setError(`${file.name} exceeds 5MB`); e.target.value = ''; return; }
    setError(''); const data = await readFileB64(file);
    setItems(p => p.map((it, idx) => idx === i ? { ...it, receipt: data, receipt_name: file.name } : it));
  };

  const save = async () => {
    if (!claimTypeId) { setError('Please select a claim type.'); return; }
    if (!claimDate) { setError('Please select a claim date.'); return; }
    if (!description.trim()) { setError('Please enter a description.'); return; }
    if (items.length === 0) { setError('Add at least one claim item.'); return; }
    if (items.some(it => !it.amount || parseFloat(it.amount) <= 0)) { setError('Every item needs a valid amount.'); return; }
    setSaving(true); setError('');
    try {
      const j = await (await fetch('/api/ess/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ claim_type_id: claimTypeId, claim_date: claimDate, description, remarks, items }) })).json();
      if (j.success) { setModal(false); fetchRows(); } else setError(j.message || 'Failed.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>My Claims | ATLINE Self-Service</title></Head>
      <EssLayout breadcrumb={['My Claims']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
              <div><h1 className="page-title">My Claims</h1><p className="page-subtitle">Submit expense claims with receipts and track approval.</p></div>
              <button className="rm-btn-primary" onClick={open}><i className="bi bi-plus-lg"></i> Submit Claim</button>
            </div>
            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Reference</th><th className="rm-th-module">Type</th>
                  <th className="rm-th-module">Date</th><th className="rm-th-perm">Items</th>
                  <th className="rm-th-perm">Amount (RM)</th><th className="rm-th-perm">Status</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-receipt" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No claims yet.</td></tr>
                  ) : rows.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{r.reference_no}</td>
                      <td className="rm-td-module" style={{ color: '#1f2937' }}>{r.claim_type_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.claim_date ? fmt(r.claim_date) : '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className="usr-role-badge">{r.item_count}</span></td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#16a34a' }}>{money(r.amount)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${STATUS_BADGE[r.status] || 'badge-pending'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {modal && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" style={{ maxWidth: 900 }}>
              <div className="usr-modal-header"><div><p className="usr-modal-title"><i className="bi bi-plus-circle" style={{ marginRight: 8 }}></i>Submit New Claim</p><p className="usr-modal-sub">Each item can have its own receipt</p></div><button className="usr-modal-close" onClick={() => setModal(false)}><i className="bi bi-x-lg"></i></button></div>
              <div className="usr-modal-body">
                {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div style={{ flex: '1 1 280px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Claim Type <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="rm-input" value={claimTypeId} onChange={e => setClaimTypeId(e.target.value)}><option value="">Select Claim Type</option>{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                  </div>
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Claim Date <span style={{ color: '#ef4444' }}>*</span></label><input type="date" className="rm-input" value={claimDate} onChange={e => setClaimDate(e.target.value)} /></div>
                  <div style={{ flex: '1 1 160px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Total</label><div className="rm-input" style={{ background: '#f9fafb', display: 'flex', alignItems: 'center', color: '#16a34a', fontWeight: 500 }}>RM {money(total)}</div></div>
                </div>
                <div className="mb-3"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Description <span style={{ color: '#ef4444' }}>*</span></label><textarea className="rm-input" rows={2} value={description} onChange={e => setDescription(e.target.value)} /></div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="rm-label" style={{ margin: 0 }}>Claim Items <span style={{ color: '#ef4444' }}>*</span></label>
                  <button type="button" className="rm-btn-outline" style={{ padding: '6px 14px' }} onClick={addItem}><i className="bi bi-plus-lg"></i> Add Item</button>
                </div>
                {items.length === 0 ? (
                  <div style={{ border: '1px dashed #d1d5db', borderRadius: 10, padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No items added.</div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {items.map((it, i) => (
                      <div key={i} className="int-card" style={{ marginBottom: 0 }}>
                        <div className="d-flex justify-content-between align-items-center mb-2"><span style={{ fontSize: 13, color: '#374151' }}>Item {i + 1}</span><button type="button" className="rm-action-btn rm-action-delete" onClick={() => removeItem(i)}><i className="bi bi-trash-fill"></i></button></div>
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          <div style={{ flex: '1 1 150px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Date <span style={{ color: '#ef4444' }}>*</span></label><input type="date" className="rm-input" value={it.item_date} onChange={e => setItem(i, 'item_date', e.target.value)} /></div>
                          <div style={{ flex: '1 1 160px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Category</label><select className="rm-input" value={it.category_id} onChange={e => setItem(i, 'category_id', e.target.value)}><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                          <div style={{ flex: '1 1 120px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Amount (RM) <span style={{ color: '#ef4444' }}>*</span></label><input type="number" step="0.01" className="rm-input" value={it.amount} onChange={e => setItem(i, 'amount', e.target.value)} placeholder="0" /></div>
                          <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Receipt</label>
                            <label className="srm-file-btn" style={{ width: '100%', justifyContent: 'flex-start' }}><i className="bi bi-upload"></i><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.receipt_name || 'Choose File'}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => pickReceipt(i, e)} /></label>
                          </div>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          <div style={{ flex: '2 1 280px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Description <span style={{ color: '#ef4444' }}>*</span></label><input className="rm-input" value={it.description} onChange={e => setItem(i, 'description', e.target.value)} /></div>
                          <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Remarks</label><input className="rm-input" value={it.remarks} onChange={e => setItem(i, 'remarks', e.target.value)} placeholder="Optional" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setModal(false)} disabled={saving}>Cancel</button><button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Submitting...</> : <><i className="bi bi-check-circle-fill"></i> Submit Claim</>}</button></div>
            </div>
          </div>
        )}
      </EssLayout>
    </>
  );
}
