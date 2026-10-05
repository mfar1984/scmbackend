'use client';
import { useState } from 'react';

export default function ApprovePeriodModal({ period, onClose, onDone }: { period: any; onClose: () => void; onDone: () => void }) {
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/hr/payroll/periods/${period.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', remarks }),
      });
      const json = await res.json();
      if (json.success) onDone();
      else setError(json.message || 'Failed to approve.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const money = (v: any) => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 });

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 520 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title">Approve Payroll Period</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          <div className="pr-approve-row"><span className="pr-approve-label">Period</span><span className="pr-approve-value">{period.name}</span></div>
          <div className="pr-approve-row"><span className="pr-approve-label">Total Employees</span><span className="pr-approve-value">{period.employee_count}</span></div>
          <div className="pr-approve-row"><span className="pr-approve-label">Total Net Salary</span><span className="pr-approve-value" style={{ color: '#16a34a' }}>RM {money(period.net_total)}</span></div>

          <div style={{ marginTop: 16 }}>
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Approval Remarks</label>
            <textarea className="rm-input" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional approval remarks..." />
          </div>
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rm-btn-primary" style={{ background: '#16a34a' }} onClick={handleApprove} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Approving...</> : <><i className="bi bi-check-circle-fill"></i> Approve Period</>}
          </button>
        </div>
      </div>
    </div>
  );
}
