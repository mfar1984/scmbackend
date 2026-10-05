'use client';
import { useState, useEffect } from 'react';

type Emp = { id: number; full_name: string; employee_id: string; gender?: string | null };
type LType = { id: number; name: string; gender_eligibility?: string; requires_document?: number };

function readFileB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result || '')); r.onerror = reject; r.readAsDataURL(file); });
}

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start); const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
  return Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
}

export default function LeaveApplyModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [types, setTypes] = useState<LType[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [doc, setDoc] = useState('');
  const [docName, setDocName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/hr/employees-list').then(r => r.json()),
      fetch('/api/hr/leave-types').then(r => r.json()),
    ]).then(([e, t]) => {
      if (e.success) setEmployees(e.data);
      if (t.success) setTypes(t.data.filter((x: any) => x.status === 'Active'));
    }).catch(() => {});
  }, []);

  const totalDays = daysBetween(startDate, endDate);

  // Filter leave types by the selected employee's gender
  const selectedEmp = employees.find(e => String(e.id) === employeeId);
  const empGender = selectedEmp?.gender || '';
  const eligibleTypes = types.filter(t => {
    const ge = t.gender_eligibility || 'All';
    if (ge === 'All') return true;
    if (!empGender) return true; // employee has no gender set → show all (HR can decide)
    return ge === empGender;
  });

  // If the currently-selected type becomes ineligible after switching employee, clear it
  useEffect(() => {
    if (leaveTypeId && !eligibleTypes.some(t => String(t.id) === leaveTypeId)) {
      setLeaveTypeId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const selectedType = eligibleTypes.find(t => String(t.id) === leaveTypeId);
  const needDoc = !!selectedType?.requires_document;

  const pickDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setDoc(''); setDocName(''); return; }
    if (file.size > 5 * 1024 * 1024) { setError(`${file.name} exceeds 5MB`); e.target.value = ''; return; }
    setError(''); setDoc(await readFileB64(file)); setDocName(file.name);
  };

  const handleSubmit = async () => {
    if (!employeeId) { setError('Please select an employee.'); return; }
    if (!leaveTypeId) { setError('Please select a leave type.'); return; }
    if (!startDate || !endDate) { setError('Please select start and end dates.'); return; }
    if (totalDays <= 0) { setError('End date must be on or after the start date.'); return; }
    if (!reason.trim()) { setError('Please enter a reason.'); return; }
    if (needDoc && !doc) { setError(`${selectedType?.name} requires a supporting document.`); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/hr/leave', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, leave_type_id: leaveTypeId, start_date: startDate, end_date: endDate, days: totalDays, reason, remarks, document: doc, document_name: docName }),
      });
      const json = await res.json();
      if (json.success) onSubmitted();
      else setError(json.message || 'Failed to submit.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 720 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-plus-circle" style={{ marginRight: 8 }}></i>Apply for Leave</p><p className="usr-modal-sub">Submit a new leave application</p></div>
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
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Select employee to view leave balance</div>
          </div>

          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Leave Type <span style={{ color: '#ef4444' }}>*</span></label>
            <select className="rm-input" value={leaveTypeId} onChange={e => setLeaveTypeId(e.target.value)} disabled={!employeeId}>
              <option value="">{employeeId ? 'Select Leave Type' : 'Select an employee first'}</option>
              {eligibleTypes.map(t => <option key={t.id} value={t.id}>{t.name}{t.gender_eligibility && t.gender_eligibility !== 'All' ? ` (${t.gender_eligibility} only)` : ''}</option>)}
            </select>
            {employeeId && empGender && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Showing leave types available for {empGender.toLowerCase()} employees.
              </div>
            )}
            {employeeId && !empGender && (
              <div style={{ fontSize: 11, color: '#d97706', marginTop: 4 }}>
                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                This employee has no gender set — gender-specific leave (maternity/paternity) cannot be filtered. Update the employee record.
              </div>
            )}
          </div>

          <div className="d-flex flex-wrap gap-3 mb-3">
            <div style={{ flex: '1 1 240px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Start Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" className="rm-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 240px' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>End Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" className="rm-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Total Days</label>
            <div className="rm-input" style={{ background: '#f9fafb', display: 'flex', alignItems: 'center', color: totalDays > 0 ? '#16a34a' : '#9ca3af', fontWeight: 500 }}>
              {totalDays}
            </div>
          </div>

          {needDoc && (
            <div className="mb-3">
              <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Supporting Document <span style={{ color: '#ef4444' }}>*</span></label>
              <label className="srm-file-btn" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <i className="bi bi-upload"></i>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docName || 'Choose File (e.g. medical certificate)'}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={pickDoc} />
              </label>
              <div style={{ fontSize: 11.5, color: '#d97706', marginTop: 4 }}><i className="bi bi-exclamation-triangle-fill me-1"></i>{selectedType?.name} requires a supporting document.</div>
            </div>
          )}

          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Reason <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea className="rm-input" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Enter reason for leave" />
          </div>

          <div className="mb-2">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Remarks</label>
            <textarea className="rm-input" rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Additional remarks (optional)" />
          </div>
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rm-btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Submitting...</> : <><i className="bi bi-check-circle-fill"></i> Submit Application</>}
          </button>
        </div>
      </div>
    </div>
  );
}
