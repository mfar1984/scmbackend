'use client';
import { useState, useEffect } from 'react';

type Profile = { profile_key: string; name: string; status: string };

type Props = {
  applicant: { id: number; full_name: string; position_applied: string | null; email: string | null };
  onClose: () => void;
  onScheduled: (msg: string) => void;
};

export default function ScheduleInterviewModal({ applicant, onClose, onScheduled }: Props) {
  const [date, setDate]         = useState('');
  const [time, setTime]         = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes]       = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileKey, setProfileKey] = useState('hr');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    fetch('/api/integration/email-profiles')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const active = json.data.filter((p: Profile) => p.status === 'Active');
          setProfiles(active);
          const hr = active.find((p: Profile) => p.profile_key === 'hr');
          setProfileKey(hr ? 'hr' : (active[0]?.profile_key || 'hr'));
        }
      })
      .catch(() => { /* silent */ });
  }, []);

  const handleSubmit = async () => {
    if (!date) { setError('Interview date is required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/hr/career/applicants/schedule-interview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: applicant.id,
          interview_date: date,
          interview_time: time,
          interview_location: location,
          interview_notes: notes,
          email_profile: profileKey,
        }),
      });
      const json = await res.json();
      if (json.success) onScheduled(json.message || 'Interview scheduled and email sent.');
      else setError(json.message || 'Failed to schedule interview.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 600 }}>
        <div className="usr-modal-header">
          <div>
            <p className="usr-modal-title"><i className="bi bi-calendar2-check" style={{ marginRight: 8 }}></i>Schedule Interview</p>
            <p className="usr-modal-sub">{applicant.full_name} · {applicant.position_applied || '—'}</p>
          </div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>

        <div className="usr-modal-body">
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Provide interview details. An email will be sent to <strong>{applicant.email || 'the applicant'}</strong> with a confirmation link.
          </p>
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

          <div className="usr-form-row">
            <label className="usr-form-label" style={{ paddingTop: 8 }}>Interview Date <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="usr-form-field"><input type="date" className="rm-input" value={date} onChange={e => setDate(e.target.value)} /></div>
          </div>
          <div className="usr-form-row">
            <label className="usr-form-label" style={{ paddingTop: 8 }}>Interview Time</label>
            <div className="usr-form-field"><input type="time" className="rm-input" value={time} onChange={e => setTime(e.target.value)} /></div>
          </div>
          <div className="usr-form-row">
            <label className="usr-form-label" style={{ paddingTop: 8 }}>Location</label>
            <div className="usr-form-field"><input className="rm-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. ATLINE Office, Meeting Room 1" /></div>
          </div>
          <div className="usr-form-row">
            <label className="usr-form-label" style={{ paddingTop: 8 }}>Send From</label>
            <div className="usr-form-field">
              <select className="rm-input" value={profileKey} onChange={e => setProfileKey(e.target.value)}>
                {profiles.map(p => <option key={p.profile_key} value={p.profile_key}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="usr-form-row usr-form-row-last">
            <label className="usr-form-label" style={{ paddingTop: 8 }}>Additional Notes</label>
            <div className="usr-form-field"><textarea className="rm-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional information for the applicant…" /></div>
          </div>

          <div className="int-info-note mt-2">
            <i className="bi bi-info-circle-fill"></i>
            The applicant must click <strong>Confirm Attendance</strong> in the email. Once confirmed, the status changes to <strong>Interview Scheduled – Confirmed</strong>.
          </div>
        </div>

        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rm-btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Sending…</> : <><i className="bi bi-send-fill"></i> Schedule &amp; Send Email</>}
          </button>
        </div>
      </div>
    </div>
  );
}
