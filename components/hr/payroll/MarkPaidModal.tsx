'use client';
import { useState } from 'react';

function readFileB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function MarkPaidModal({ period, onClose, onDone }: { period: any; onClose: () => void; onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [paymentDate, setPaymentDate] = useState(period.pay_date || today);
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState('');
  const [proofName, setProofName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pickProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setProof(''); setProofName(''); return; }
    if (file.size > 10 * 1024 * 1024) { setError(`${file.name} exceeds 10MB`); e.target.value = ''; return; }
    setError('');
    setProof(await readFileB64(file)); setProofName(file.name);
  };

  const handlePay = async () => {
    if (!paymentDate) { setError('Please select the payment date.'); return; }
    if (!proof) { setError('Payment proof attachment is required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/hr/payroll/periods/${period.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay', payment_date: paymentDate, payment_reference: reference, payment_proof: proof, payment_proof_name: proofName, remarks }),
      });
      const json = await res.json();
      if (json.success) onDone();
      else setError(json.message || 'Failed to mark as paid.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 540 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Mark as Paid</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          <div className="pr-approve-row"><span className="pr-approve-label">Period</span><span className="pr-approve-value">{period.name}</span></div>

          <div style={{ marginTop: 14 }} className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Payment Date <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="date" className="rm-input" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Payment Reference</label>
            <input className="rm-input" value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. Bank transfer reference number" />
          </div>
          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Payment Proof (Attachment) <span style={{ color: '#ef4444' }}>*</span></label>
            <label className="srm-file-btn" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <i className="bi bi-upload"></i>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proofName || 'Choose File'}</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={pickProof} />
            </label>
            <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>Upload bank transfer receipt or payment proof (PDF, JPG, PNG - Max 10MB)</div>
          </div>
          <div className="mb-1">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Remarks</label>
            <textarea className="rm-input" rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional remarks..." />
          </div>
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rm-btn-primary" style={{ background: '#06b6d4' }} onClick={handlePay} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-cash-coin"></i> Mark as Paid</>}
          </button>
        </div>
      </div>
    </div>
  );
}
