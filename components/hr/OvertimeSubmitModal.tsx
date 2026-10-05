'use client';
import { useState, useEffect } from 'react';

type Emp = { id: number; full_name: string; employee_id: string };
type Rate = { id: number; name: string; multiplier: number; applies_to?: string };

function hoursBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if ([sh, sm, eh, em].some(n => isNaN(n))) return 0;
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // crosses midnight
  return Math.round((mins / 60) * 100) / 100;
}

const BADGE_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  holiday: { bg: '#fef2f2', color: '#dc2626', icon: 'bi-calendar-event-fill' },
  weekend: { bg: '#eff6ff', color: '#2563eb', icon: 'bi-calendar2-week-fill' },
  normal:  { bg: '#f0fdf4', color: '#16a34a', icon: 'bi-calendar-check-fill' },
};

export default function OvertimeSubmitModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [otDate, setOtDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [rateId, setRateId] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dayInfo, setDayInfo] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/hr/employees-list').then(r => r.json()),
      fetch('/api/hr/overtime-rates').then(r => r.json()),
    ]).then(([e, r]) => {
      if (e.success) setEmployees(e.data);
      if (r.success) setRates(r.data.filter((x: any) => x.status === 'Active'));
    }).catch(() => {});
  }, []);

  // When date changes, auto-detect day type + suggest rate
  useEffect(() => {
    if (!otDate) { setDayInfo(null); return; }
    setChecking(true);
    fetch(`/api/hr/overtime/day-check?date=${otDate}`)
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setDayInfo(j);
          if (j.suggested_rate) setRateId(String(j.suggested_rate.id));
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [otDate]);

  const totalHours = hoursBetween(startTime, endTime);

  const handleSubmit = async () => {
    if (!employeeId) { setError('Please select an employee.'); return; }
    if (!projectName.trim()) { setError('Please enter a project name.'); return; }
    if (!otDate) { setError('Please select the overtime date.'); return; }
    if (!startTime || !endTime) { setError('Please enter start and end times.'); return; }
    if (totalHours <= 0) { setError('End time must be after start time.'); return; }
    if (!reason.trim()) { setError('Please enter a reason.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/hr/overtime', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId, project_name: projectName, ot_rate_id: rateId || null,
          ot_date: otDate, start_time: startTime, end_time: endTime, hours: totalHours,
          day_type: dayInfo?.day_type || null, reason, remarks,
        }),
      });
      const json = await res.json();
      if (json.success) onSubmitted();
      else setError(json.message || 'Failed to submit.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const bs = dayInfo ? (BADGE_STYLE[dayInfo.badge] || BADGE_STYLE.normal) : null;

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 720 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-plus-circle" style={{ marginRight: 8 }}></i>Submit Overtime</p><p className="usr-modal-sub">Day type &amp; rate are detected automatically</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Employee <span style={{ color: '#ef4444' }}>*</span></label>
            <select className="rm-input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">— Select Employee —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Project Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input className="rm-input" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Enter project name" />
          </div>

          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Overtime Date <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="date" className="rm-input" value={otDate} onChange={e => setOtDate(e.target.value)} />
            {checking && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}><span className="spinner-border spinner-border-sm me-1" style={{ width: 11, height: 11 }}></span> Checking day type…</div>}
            {dayInfo && bs && (
              <>
                <div style={{ marginTop: 8, background: bs.bg, color: bs.color, borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className={`bi ${bs.icon}`}></i> {dayInfo.day_label}
                </div>
                {dayInfo.suggested_rate && (
                  <div style={{ marginTop: 6, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '9px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="bi bi-receipt"></i> <span><strong>Suggested Rate:</strong> {dayInfo.suggested_rate.name} ({Number(dayInfo.suggested_rate.multiplier).toFixed(2)}x)</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="d-flex flex-wrap gap-3 mb-3">
            <div style={{ flex: '1 1 240px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Start Time <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="time" className="rm-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 240px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>End Time <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="time" className="rm-input" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="d-flex flex-wrap gap-3 mb-3">
            <div style={{ flex: '1 1 200px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Total Hours</label>
              <div className="rm-input" style={{ background: '#f9fafb', display: 'flex', alignItems: 'center', color: totalHours > 0 ? '#16a34a' : '#9ca3af', fontWeight: 500 }}>{totalHours}</div>
            </div>
            <div style={{ flex: '1 1 280px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Overtime Rate</label>
              <select className="rm-input" value={rateId} onChange={e => setRateId(e.target.value)}>
                <option value="">— Select Rate —</option>
                {rates.map(r => <option key={r.id} value={r.id}>{r.name} ({Number(r.multiplier).toFixed(2)}x)</option>)}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Reason <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea className="rm-input" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Enter reason for overtime" />
          </div>
          <div className="mb-2">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Remarks</label>
            <textarea className="rm-input" rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Additional remarks (optional)" />
          </div>
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rm-btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Submitting...</> : <><i className="bi bi-check-circle-fill"></i> Submit Overtime</>}
          </button>
        </div>
      </div>
    </div>
  );
}
