'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import EssLayout from '../../components/ess/EssLayout';
import { useDateFormat } from '../../lib/useDateFormat';

type Row = { id: number; reference_no: string; category_name: string | null; expense_date: string | null; vendor_name: string | null; amount: number; item_count: number; status: string };
type Item = { item_date: string; description: string; qty: string; unit_price: string };
const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Credit Card', 'Cheque', 'Online Payment'];
const STATUS_BADGE: Record<string, string> = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' };

function readFileB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result || '')); r.onerror = reject; r.readAsDataURL(file); });
}

export default function EssExpenses() {
  const { fmt } = useDateFormat();
  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [f, setF] = useState<any>({});
  const [items, setItems] = useState<Item[]>([]);
  const [receipt, setReceipt] = useState(''); const [receiptName, setReceiptName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/ess/expenses')).json(); if (j.success) setRows(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    fetchRows();
    fetch('/api/hr/expense-categories').then(r => r.json()).then(j => { if (j.success) setCategories(j.data.filter((x: any) => x.status === 'Active')); });
  }, [fetchRows]);

  const money = (v: number) => `RM ${v.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
  const itemsTotal = items.reduce((s, it) => s + ((parseFloat(it.qty) || 0) * (parseFloat(it.unit_price) || 0)), 0);
  const tax = parseFloat(f.tax_amount) || 0;
  const grand = itemsTotal + tax;

  const open = () => { setF({ category_id: '', expense_date: '', vendor_name: '', invoice_number: '', payment_method: 'Bank Transfer', payment_reference: '', tax_amount: '', description: '', remarks: '' }); setItems([]); setReceipt(''); setReceiptName(''); setError(''); setModal(true); };
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const addItem = () => setItems(p => [...p, { item_date: f.expense_date || '', description: '', qty: '1', unit_price: '' }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const setItem = (i: number, k: keyof Item, v: string) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const pickReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setReceipt(''); setReceiptName(''); return; }
    if (file.size > 5 * 1024 * 1024) { setError(`${file.name} exceeds 5MB`); e.target.value = ''; return; }
    setError(''); setReceipt(await readFileB64(file)); setReceiptName(file.name);
  };

  const save = async () => {
    if (!f.category_id) { setError('Please select a category.'); return; }
    if (!f.expense_date) { setError('Please select the expense date.'); return; }
    if (!f.description?.trim()) { setError('Please enter a description.'); return; }
    if (items.length === 0) { setError('Add at least one expense item.'); return; }
    if (items.some(it => !it.description.trim() || !(parseFloat(it.unit_price) > 0))) { setError('Every item needs a description and unit price.'); return; }
    setSaving(true); setError('');
    try {
      const j = await (await fetch('/api/ess/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, receipt, receipt_name: receiptName, items }) })).json();
      if (j.success) { setModal(false); fetchRows(); } else setError(j.message || 'Failed.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>My Expenses | ATLINE Self-Service</title></Head>
      <EssLayout breadcrumb={['My Expenses']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
              <div><h1 className="page-title">My Expenses</h1><p className="page-subtitle">Submit company expenses with itemised breakdown.</p></div>
              <button className="rm-btn-primary" onClick={open}><i className="bi bi-plus-lg"></i> Submit Expense</button>
            </div>
            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Reference</th><th className="rm-th-module">Category</th>
                  <th className="rm-th-module">Vendor</th><th className="rm-th-module">Date</th>
                  <th className="rm-th-perm">Items</th><th className="rm-th-perm">Amount (RM)</th><th className="rm-th-perm">Status</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-wallet2" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No expenses submitted yet.</td></tr>
                  ) : rows.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{r.reference_no}</td>
                      <td className="rm-td-module" style={{ color: '#1f2937' }}>{r.category_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.vendor_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.expense_date ? fmt(r.expense_date) : '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className="usr-role-badge">{r.item_count}</span></td>
                      <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#16a34a' }}>{Number(r.amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
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
            <div className="usr-modal" style={{ maxWidth: 940 }}>
              <div className="usr-modal-header"><div><p className="usr-modal-title"><i className="bi bi-plus-circle" style={{ marginRight: 8 }}></i>Submit Expense</p></div><button className="usr-modal-close" onClick={() => setModal(false)}><i className="bi bi-x-lg"></i></button></div>
              <div className="usr-modal-body">
                {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Category <span style={{ color: '#ef4444' }}>*</span></label><select className="rm-input" value={f.category_id} onChange={e => set('category_id', e.target.value)}><option value="">Select Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div style={{ flex: '1 1 180px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Expense Date <span style={{ color: '#ef4444' }}>*</span></label><input type="date" className="rm-input" value={f.expense_date} onChange={e => set('expense_date', e.target.value)} /></div>
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Vendor Name</label><input className="rm-input" value={f.vendor_name} onChange={e => set('vendor_name', e.target.value)} /></div>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Invoice Number</label><input className="rm-input" value={f.invoice_number} onChange={e => set('invoice_number', e.target.value)} /></div>
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Receipt</label><label className="srm-file-btn" style={{ width: '100%', justifyContent: 'flex-start' }}><i className="bi bi-upload"></i><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{receiptName || 'Choose File'}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={pickReceipt} /></label></div>
                </div>
                <div className="mb-3"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Description <span style={{ color: '#ef4444' }}>*</span></label><textarea className="rm-input" rows={2} value={f.description} onChange={e => set('description', e.target.value)} /></div>
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Payment Method</label><select className="rm-input" value={f.payment_method} onChange={e => set('payment_method', e.target.value)}>{PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
                  <div style={{ flex: '1 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Payment Reference</label><input className="rm-input" value={f.payment_reference} onChange={e => set('payment_reference', e.target.value)} /></div>
                  <div style={{ flex: '1 1 140px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Tax Amount (RM)</label><input type="number" step="0.01" className="rm-input" value={f.tax_amount} onChange={e => set('tax_amount', e.target.value)} placeholder="0.00" /></div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2"><label className="rm-label" style={{ margin: 0 }}>Expense Items <span style={{ color: '#ef4444' }}>*</span></label><button type="button" className="rm-btn-outline" style={{ padding: '6px 14px' }} onClick={addItem}><i className="bi bi-plus-lg"></i> Add Item</button></div>
                {items.length === 0 ? (
                  <div style={{ border: '1px dashed #d1d5db', borderRadius: 10, padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No items added.</div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {items.map((it, i) => {
                      const lineTotal = (parseFloat(it.qty) || 0) * (parseFloat(it.unit_price) || 0);
                      return (
                        <div key={i} className="int-card" style={{ marginBottom: 0 }}>
                          <div className="d-flex justify-content-between align-items-center mb-2"><span style={{ fontSize: 13, color: '#374151' }}>Item {i + 1}</span><button type="button" className="rm-action-btn rm-action-delete" onClick={() => removeItem(i)}><i className="bi bi-trash-fill"></i></button></div>
                          <div className="d-flex flex-wrap gap-2">
                            <div style={{ flex: '1 1 150px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Date</label><input type="date" className="rm-input" value={it.item_date} onChange={e => setItem(i, 'item_date', e.target.value)} /></div>
                            <div style={{ flex: '2 1 200px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Description <span style={{ color: '#ef4444' }}>*</span></label><input className="rm-input" value={it.description} onChange={e => setItem(i, 'description', e.target.value)} /></div>
                            <div style={{ flex: '0 1 90px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Qty</label><input type="number" step="0.01" className="rm-input" value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)} /></div>
                            <div style={{ flex: '0 1 120px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Unit Price <span style={{ color: '#ef4444' }}>*</span></label><input type="number" step="0.01" className="rm-input" value={it.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} placeholder="0" /></div>
                            <div style={{ flex: '0 1 120px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Total</label><div className="rm-input" style={{ background: '#f9fafb', display: 'flex', alignItems: 'center', color: '#1f2937' }}>{lineTotal.toFixed(2)}</div></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ fontSize: 12.5, color: '#16a34a' }}>Total Amount</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: '#16a34a' }}>{money(grand)}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Items: {money(itemsTotal)} + Tax: {money(tax)}</div>
                </div>
              </div>
              <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setModal(false)} disabled={saving}>Cancel</button><button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Submitting...</> : <><i className="bi bi-check-circle-fill"></i> Submit Expense</>}</button></div>
            </div>
          </div>
        )}
      </EssLayout>
    </>
  );
}
