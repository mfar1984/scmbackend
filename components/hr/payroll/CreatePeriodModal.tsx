'use client';
import { useState } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CreatePeriodModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const now = new Date();
  const [month, setMonth] = useState(MONTHS[now.getMonth()]);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [payDate, setPayDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 2 + i);

  const handleSave = async () => {
    if (!payDate) { setError('Please select the expected payment date.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/hr/payroll/periods', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, pay_date: payDate }),
      });
      const json = await res.json();
      if (json.success) onSaved();
      else setError(json.message || 'Failed to create period.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 520 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-plus-circle" style={{ marginRight: 8 }}></i>Create Payroll Period</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Month <span style={{ color: '#ef4444' }}>*</span></label>
            <select className="rm-input" value={month} onChange={e => setMonth(e.target.value)}>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Year <span style={{ color: '#ef4444' }}>*</span></label>
            <select className="rm-input" value={year} onChange={e => setYear(e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Payment Date <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="date" className="rm-input" value={payDate} onChange={e => setPayDate(e.target.value)} />
            <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>Expected salary payment date</div>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', fontSize: 12.5, color: '#1d4ed8', display: 'flex', gap: 8 }}>
            <i className="bi bi-info-circle-fill" style={{ marginTop: 2 }}></i>
            <span>After creating the period, you can process payroll to generate payslips for all active employees.</span>
          </div>
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rm-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Creating...</> : <><i className="bi bi-check-circle-fill"></i> Create Period</>}
          </button>
        </div>
      </div>
    </div>
  );
}
