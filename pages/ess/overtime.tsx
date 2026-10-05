'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import EssLayout from '../../components/ess/EssLayout';
import { useDateFormat } from '../../lib/useDateFormat';

type Row = { id: number; reference_no: string; ot_date: string | null; hours: number | null; day_type: string | null; rate_name: string | null; multiplier: number | null; status: string };
const STATUS_BADGE: Record<string, string> = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' };

function hoursBetween(s: string, e: string): number {
  if (!s || !e) return 0;
  const [sh, sm] = s.split(':').map(Number); const [eh, em] = e.split(':').map(Number);
  if ([sh, sm, eh, em].some(isNaN)) return 0;
  let mins = (eh * 60 + em) - (sh * 60 + sm); if (mins < 0) mins += 1440;
  return Math.round((mins / 60) * 10) / 10;
}

export default function EssOvertime() {
  const { fmt } = useDateFormat();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [otDate, setOtDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [project, setProject] = useState('');
  const [reason, setReason] = useState('');
  const [dayInfo, setDayInfo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/ess/overtime')).json(); if (j.success) setRows(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchRows(); }, [fetchRows]);

  useEffect(() => {
    if (!otDate) { setDayInfo(null); return; }
    fetch(`/api/hr/overtime/day-check?date=${otDate}`).then(r => r.json()).then(j => { if (j.success) setDayInfo(j); }).catch(() => setDayInfo(null));
  }, [otDate]);

  const totalHours = hoursBetween(startTime, endTime);
  const open = () => { setOtDate(''); setStartTime(''); setEndTime(''); setProject(''); setReason(''); setDayInfo(null); setError(''); setModal(true); };

  const save = async () => {
    if (!otDate) { setError('Please select the date.'); return; }
    if (totalHours <= 0) { setError('Please enter valid start and end times.'); return; }
    if (!reason.trim()) { setError('Please enter a reason.'); return; }
    setSaving(true); setError('');
    try {
      const j = await (await fetch('/api/ess/overtime', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        ot_date: otDate, start_time: startTime, end_time: endTime, hours: totalHours,
        day_type: dayInfo?.day_type || null, ot_rate_id: dayInfo?.suggested_rate?.id || null,
        project_name: project, reason,
      }) })).json();
      if (j.success) { setModal(false); fetchRows(); } else setError(j.message || 'Failed.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>My Overtime | ATLINE Self-Service</title></Head>
      <EssLayout breadcrumb={['My Overtime']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
              <div><h1 className="page-title">My Overtime</h1><p className="page-subtitle">Submit overtime and track approval. Rate is auto-detected from the date.</p></div>
              <button className="rm-btn-primary" onClick={open}><i className="bi bi-plus-lg"></i> Submit Overtime</button>
            </div>
            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Reference</th><th className="rm-th-module">Date</th>
                  <th className="rm-th-module">Day Type</th><th className="rm-th-perm">Hours</th>
                  <th className="rm-th-perm">Rate</th><th className="rm-th-perm">Status</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-clock-history" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No overtime submitted yet.</td></tr>
                  ) : rows.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{r.reference_no}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.ot_date ? fmt(r.ot_date) : '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#374151' }}>{r.day_type || '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 13 }}>{r.hours ?? '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>{r.rate_name || '—'}{r.multiplier ? ` (${Number(r.multiplier)}x)` : ''}</td>
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
            <div className="usr-modal" style={{ maxWidth: 640 }}>
              <div className="usr-modal-header"><div><p className="usr-modal-title"><i className="bi bi-plus-circle" style={{ marginRight: 8 }}></i>Submit Overtime</p></div><button className="usr-modal-close" onClick={() => setModal(false)}><i className="bi bi-x-lg"></i></button></div>
              <div className="usr-modal-body">
                {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
                <div className="mb-3"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>OT Date <span style={{ color: '#ef4444' }}>*</span></label><input type="date" className="rm-input" value={otDate} onChange={e => setOtDate(e.target.value)} /></div>
                {dayInfo && (
                  <div style={{ background: dayInfo.badge === 'holiday' ? '#fef2f2' : dayInfo.badge === 'weekend' ? '#fffbeb' : '#eff6ff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, marginBottom: 14 }}>
                    <i className="bi bi-calendar-event me-1"></i> <strong>{dayInfo.day_type}</strong> — {dayInfo.day_label}. Suggested rate: <strong>{dayInfo.suggested_rate?.name || '—'}{dayInfo.suggested_rate ? ` (${Number(dayInfo.suggested_rate.multiplier)}x)` : ''}</strong>
                  </div>
                )}
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div style={{ flex: '1 1 180px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Start Time <span style={{ color: '#ef4444' }}>*</span></label><input type="time" className="rm-input" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
                  <div style={{ flex: '1 1 180px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>End Time <span style={{ color: '#ef4444' }}>*</span></label><input type="time" className="rm-input" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
                  <div style={{ flex: '1 1 120px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Total Hours</label><div className="rm-input" style={{ background: '#f9fafb', display: 'flex', alignItems: 'center', color: totalHours > 0 ? '#16a34a' : '#9ca3af', fontWeight: 500 }}>{totalHours}</div></div>
                </div>
                <div className="mb-3"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Project / Task</label><input className="rm-input" value={project} onChange={e => setProject(e.target.value)} placeholder="Optional" /></div>
                <div className="mb-1"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Reason <span style={{ color: '#ef4444' }}>*</span></label><textarea className="rm-input" rows={2} value={reason} onChange={e => setReason(e.target.value)} /></div>
              </div>
              <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setModal(false)} disabled={saving}>Cancel</button><button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Submitting...</> : <><i className="bi bi-check-circle-fill"></i> Submit Overtime</>}</button></div>
            </div>
          </div>
        )}
      </EssLayout>
    </>
  );
}
