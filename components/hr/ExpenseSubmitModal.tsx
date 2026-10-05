'use client';
import { useState, useEffect } from 'react';

type Emp = { id: number; full_name: string; employee_id: string };
type Cat = { id: number; name: string };
type Item = { item_date: string; description: string; qty: string; unit_price: string };

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Credit Card', 'Cheque', 'Online Payment'];

function readFileB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function ExpenseSubmitModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);

  const [employeeId, setEmployeeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [receipt, setReceipt] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/hr/employees-list').then(r => r.json()),
      fetch('/api/hr/expense-categories').then(r => r.json()),
    ]).then(([e, c]) => {
      if (e.success) setEmployees(e.data);
      if (c.success) setCategories(c.data.filter((x: any) => x.status === 'Active'));
    }).catch(() => {});
  }, []);

  const itemsTotal = items.reduce((s, it) => s + ((parseFloat(it.qty) || 0) * (parseFloat(it.unit_price) || 0)), 0);
  const tax = parseFloat(taxAmount) || 0;
  const grandTotal = itemsTotal + tax;

  const addItem = () => setItems(p => [...p, { item_date: expenseDate || '', description: '', qty: '1', unit_price: '' }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const setItem = (i: number, k: keyof Item, v: string) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const pickReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setReceipt(''); setReceiptName(''); return; }
    if (file.size > 5 * 1024 * 1024) { setError(`${file.name} exceeds 5MB`); e.target.value = ''; return; }
    setError('');
    setReceipt(await readFileB64(file)); setReceiptName(file.name);
  };

  const handleSubmit = async () => {
    if (!employeeId) { setError('Please select an employee.'); return; }
    if (!categoryId) { setError('Please select a category.'); return; }
    if (!expenseDate) { setError('Please select the expense date.'); return; }
    if (!description.trim()) { setError('Please enter a description.'); return; }
    if (items.length === 0) { setError('Please add at least one expense item.'); return; }
    if (items.some(it => !it.description.trim() || !(parseFloat(it.unit_price) > 0))) { setError('Every item needs a description and a valid unit price.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/hr/expenses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId, category_id: categoryId, expense_date: expenseDate,
          vendor_name: vendorName, invoice_number: invoiceNumber, payment_method: paymentMethod,
          payment_reference: paymentReference, tax_amount: taxAmount, description, remarks,
          receipt, receipt_name: receiptName, items,
        }),
      });
      const json = await res.json();
      if (json.success) onSubmitted();
      else setError(json.message || 'Failed to submit.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const money = (v: number) => `RM ${v.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 940 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-plus-circle" style={{ marginRight: 8 }}></i>Submit Expense</p><p className="usr-modal-sub">Record a company expense with itemised breakdown</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

          <div className="d-flex flex-wrap gap-3 mb-3">
            <div style={{ flex: '1 1 280px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Employee <span style={{ color: '#ef4444' }}>*</span></label>
              <select className="rm-input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                <option value="">— Select Employee —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Category <span style={{ color: '#ef4444' }}>*</span></label>
              <select className="rm-input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Expense Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" className="rm-input" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
            </div>
          </div>

          <div className="d-flex flex-wrap gap-3 mb-3">
            <div style={{ flex: '1 1 280px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Vendor Name</label>
              <input className="rm-input" value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="Enter vendor name" />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Invoice Number</label>
              <input className="rm-input" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Enter invoice number" />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Receipt</label>
              <label className="srm-file-btn" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <i className="bi bi-upload"></i>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{receiptName || 'Choose File'}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={pickReceipt} />
              </label>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Upload image or PDF (Max 5MB)</div>
            </div>
          </div>

          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Description <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea className="rm-input" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter expense description" />
          </div>

          <div className="d-flex flex-wrap gap-3 mb-3">
            <div style={{ flex: '1 1 200px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Payment Method <span style={{ color: '#ef4444' }}>*</span></label>
              <select className="rm-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 240px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Payment Reference</label>
              <input className="rm-input" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="Transaction/Ref number" />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Tax Amount (RM)</label>
              <input type="number" step="0.01" className="rm-input" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Remarks</label>
            <textarea className="rm-input" rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Additional remarks (optional)" />
          </div>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="rm-label" style={{ margin: 0 }}>Expense Items <span style={{ color: '#ef4444' }}>*</span></label>
            <button type="button" className="rm-btn-outline" style={{ padding: '6px 14px' }} onClick={addItem}><i className="bi bi-plus-lg"></i> Add Item</button>
          </div>

          {items.length === 0 ? (
            <div style={{ border: '1px dashed #d1d5db', borderRadius: 10, padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              No items added. Click &quot;Add Item&quot; to begin.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {items.map((it, i) => {
                const lineTotal = (parseFloat(it.qty) || 0) * (parseFloat(it.unit_price) || 0);
                return (
                  <div key={i} className="int-card" style={{ marginBottom: 0 }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span style={{ fontSize: 13, color: '#374151' }}>Item {i + 1}</span>
                      <button type="button" className="rm-action-btn rm-action-delete" onClick={() => removeItem(i)}><i className="bi bi-trash-fill"></i></button>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <div style={{ flex: '1 1 150px' }}>
                        <label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Date <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="date" className="rm-input" value={it.item_date} onChange={e => setItem(i, 'item_date', e.target.value)} />
                      </div>
                      <div style={{ flex: '2 1 200px' }}>
                        <label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Description <span style={{ color: '#ef4444' }}>*</span></label>
                        <input className="rm-input" value={it.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Item description" />
                      </div>
                      <div style={{ flex: '0 1 90px' }}>
                        <label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Qty <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="number" step="0.01" className="rm-input" value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)} placeholder="1" />
                      </div>
                      <div style={{ flex: '0 1 120px' }}>
                        <label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Unit Price (RM) <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="number" step="0.01" className="rm-input" value={it.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} placeholder="0" />
                      </div>
                      <div style={{ flex: '0 1 120px' }}>
                        <label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Total (RM)</label>
                        <div className="rm-input" style={{ background: '#f9fafb', display: 'flex', alignItems: 'center', color: '#1f2937' }}>{lineTotal.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 12.5, color: '#16a34a' }}>Total Amount</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#16a34a' }}>{money(grandTotal)}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Items: {money(itemsTotal)} + Tax: {money(tax)}</div>
          </div>
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rm-btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Submitting...</> : <><i className="bi bi-check-circle-fill"></i> Submit Expense</>}
          </button>
        </div>
      </div>
    </div>
  );
}
