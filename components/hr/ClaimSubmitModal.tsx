'use client';
import { useState, useEffect } from 'react';

type Opt = { id: number; name: string; full_name?: string; employee_id?: string };
type Item = { item_date: string; description: string; category_id: string; amount: string; remarks: string; receipt: string; receipt_name: string };

function readFileB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function ClaimSubmitModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const [employees, setEmployees] = useState<Opt[]>([]);
  const [types, setTypes] = useState<Opt[]>([]);
  const [categories, setCategories] = useState<Opt[]>([]);

  const [employeeId, setEmployeeId] = useState('');
  const [claimTypeId, setClaimTypeId] = useState('');
  const [claimDate, setClaimDate] = useState('');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/hr/employees-list').then(r => r.json()),
      fetch('/api/hr/claim-types').then(r => r.json()),
      fetch('/api/hr/expense-categories').then(r => r.json()),
    ]).then(([e, t, c]) => {
      if (e.success) setEmployees(e.data);
      if (t.success) setTypes(t.data.filter((x: any) => x.status === 'Active'));
      if (c.success) setCategories(c.data.filter((x: any) => x.status === 'Active'));
    }).catch(() => {});
  }, []);

  const total = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);

  const addItem = () => setItems(p => [...p, { item_date: '', description: '', category_id: '', amount: '', remarks: '', receipt: '', receipt_name: '' }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const setItem = (i: number, k: keyof Item, v: string) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const pickReceipt = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setItem(i, 'receipt', ''); setItem(i, 'receipt_name', ''); return; }
    if (file.size > 5 * 1024 * 1024) { setError(`${file.name} exceeds 5MB`); e.target.value = ''; return; }
    setError('');
    const data = await readFileB64(file);
    setItems(p => p.map((it, idx) => idx === i ? { ...it, receipt: data, receipt_name: file.name } : it));
  };

  const handleSubmit = async () => {
    if (!employeeId) { setError('Please select an employee.'); return; }
    if (!claimTypeId) { setError('Please select a claim type.'); return; }
    if (!claimDate) { setError('Please select a claim date.'); return; }
    if (!description.trim()) { setError('Please enter a description.'); return; }
    if (items.length === 0) { setError('Please add at least one claim item.'); return; }
    if (items.some(it => !it.amount || parseFloat(it.amount) <= 0)) { setError('Every item must have a valid amount.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/hr/claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId, claim_type_id: claimTypeId, claim_date: claimDate,
          description, remarks, items,
        }),
      });
      const json = await res.json();
      if (json.success) onSubmitted();
      else setError(json.message || 'Failed to submit claim.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 900 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-plus-circle" style={{ marginRight: 8 }}></i>Submit New Claim</p><p className="usr-modal-sub">Create an expense claim with one or more items</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

          <div className="d-flex flex-wrap gap-3 mb-3">
            <div style={{ flex: '1 1 320px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Employee <span style={{ color: '#ef4444' }}>*</span></label>
              <select className="rm-input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                <option value="">— Select Employee —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 320px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Claim Type <span style={{ color: '#ef4444' }}>*</span></label>
              <select className="rm-input" value={claimTypeId} onChange={e => setClaimTypeId(e.target.value)}>
                <option value="">Select Claim Type</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-3 mb-3">
            <div style={{ flex: '1 1 320px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Claim Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" className="rm-input" value={claimDate} onChange={e => setClaimDate(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 320px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Total Amount</label>
              <div className="rm-input" style={{ background: '#f9fafb', display: 'flex', alignItems: 'center', color: '#16a34a', fontWeight: 500 }}>
                RM {total.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Description <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea className="rm-input" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter claim description" />
          </div>
          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Remarks</label>
            <textarea className="rm-input" rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Additional remarks (optional)" />
          </div>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="rm-label" style={{ margin: 0 }}>Claim Items <span style={{ color: '#ef4444' }}>*</span></label>
            <button type="button" className="rm-btn-outline" style={{ padding: '6px 14px' }} onClick={addItem}><i className="bi bi-plus-lg"></i> Add Item</button>
          </div>

          {items.length === 0 ? (
            <div style={{ border: '1px dashed #d1d5db', borderRadius: 10, padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              No items added. Click &quot;Add Item&quot; to begin.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {items.map((it, i) => (
                <div key={i} className="int-card" style={{ marginBottom: 0, position: 'relative' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span style={{ fontSize: 13, color: '#374151' }}>Item {i + 1}</span>
                    <button type="button" className="rm-action-btn rm-action-delete" onClick={() => removeItem(i)}><i className="bi bi-trash-fill"></i></button>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    <div style={{ flex: '1 1 150px' }}>
                      <label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Date <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="date" className="rm-input" value={it.item_date} onChange={e => setItem(i, 'item_date', e.target.value)} />
                    </div>
                    <div style={{ flex: '1 1 160px' }}>
                      <label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Category</label>
                      <select className="rm-input" value={it.category_id} onChange={e => setItem(i, 'category_id', e.target.value)}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Amount (RM) <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="number" step="0.01" className="rm-input" value={it.amount} onChange={e => setItem(i, 'amount', e.target.value)} placeholder="0" />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                      <label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Receipt</label>
                      <label className="srm-file-btn" style={{ width: '100%', justifyContent: 'flex-start' }}>
                        <i className="bi bi-upload"></i>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.receipt_name || 'Choose File'}</span>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => pickReceipt(i, e)} />
                      </label>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <div style={{ flex: '2 1 280px' }}>
                      <label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Description <span style={{ color: '#ef4444' }}>*</span></label>
                      <input className="rm-input" value={it.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Item description" />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                      <label className="rm-label" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Remarks</label>
                      <input className="rm-input" value={it.remarks} onChange={e => setItem(i, 'remarks', e.target.value)} placeholder="Optional" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rm-btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Submitting...</> : <><i className="bi bi-check-circle-fill"></i> Submit Claim</>}
          </button>
        </div>
      </div>
    </div>
  );
}
