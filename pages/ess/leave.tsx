'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import EssLayout from '../../components/ess/EssLayout';
import { useDateFormat } from '../../lib/useDateFormat';

type Row = { id: number; reference_no: string; leave_type_name: string | null; leave_type_color: string | null; start_date: string | null; end_date: string | null; days: number | null; reason: string | null; remarks: string | null; status: string; has_document: number };
type LType = { id: number; name: string; gender_eligibility?: string; requires_document?: number; days_per_year?: number };
type Bal = { leave_type_id: number; name: string; code: string | null; color: string; entitlement: number; used: number; pending: number; balance: number | null; unlimited: boolean; requires_document: boolean };

const STATUS_BADGE: Record<string, string> = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' };

function daysBetween(s: string, e: string): number {
  if (!s || !e) return 0;
  const a = new Date(s), b = new Date(e);
  if (isNaN(a.getTime()) || isNaN(b.getTime()) || b < a) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
}
function readFileB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result || '')); r.onerror = reject; r.readAsDataURL(file); });
}

export default function EssLeavePage() {
  const { fmt } = useDateFormat();
  const [rows, setRows] = useState<Row[]>([]);
  const [types, setTypes] = useState<LType[]>([]);
  const [balance, setBalance] = useState<Bal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewRow, setViewRow] = useState<Row | null>(null);
  const [form, setForm] = useState<any>({});
  const [docName, setDocName] = useState('');
  const [doc, setDoc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([
        fetch('/api/ess/leave').then(x => x.json()),
        fetch('/api/ess/leave-balance').then(x => x.json()),
      ]);
      if (r.success) setRows(r.data);
      if (b.success) setBalance(b.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    fetchAll();
    fetch('/api/ess/leave-types').then(r => r.json()).then(j => { if (j.success) setTypes(j.data); });
  }, [fetchAll]);

  const selectedType = types.find(t => String(t.id) === String(form.leave_type_id));
  const selectedBal = balance.find(b => b.leave_type_id === Number(form.leave_type_id));
  const totalDays = daysBetween(form.start_date, form.end_date);
  const needDoc = !!selectedType?.requires_document;

  const openCreate = () => { setForm({ leave_type_id: '', start_date: '', end_date: '', reason: '', remarks: '' }); setDoc(''); setDocName(''); setError(''); setModal(true); };
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const pickDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setDoc(''); setDocName(''); return; }
    if (file.size > 5 * 1024 * 1024) { setError(`${file.name} exceeds 5MB`); e.target.value = ''; return; }
    setError(''); setDoc(await readFileB64(file)); setDocName(file.name);
  };

  const save = async () => {
    if (!form.leave_type_id) { setError('Please select a leave type.'); return; }
    if (!form.start_date || !form.end_date) { setError('Please select start and end dates.'); return; }
    if (totalDays <= 0) { setError('End date must be on or after start date.'); return; }
    if (!form.reason?.trim()) { setError('Please enter a reason.'); return; }
    if (needDoc && !doc) { setError(`${selectedType?.name} requires a supporting document.`); return; }
    if (selectedBal && !selectedBal.unlimited && selectedBal.balance != null && totalDays > selectedBal.balance) {
      setError(`Insufficient balance. You have ${selectedBal.balance} day(s) of ${selectedBal.name} left.`); return;
    }
    setSaving(true); setError('');
    try {
      const j = await (await fetch('/api/ess/leave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, days: totalDays, document: doc, document_name: docName }) })).json();
      if (j.success) { setModal(false); fetchAll(); } else setError(j.message || 'Failed.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>My Leave | ATLINE Self-Service</title></Head>
      <EssLayout breadcrumb={['My Leave']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>

            {/* ── Leave Balance section ── */}
            <div style={{ fontSize: 15, color: '#1f2937', fontWeight: 600, marginBottom: 4 }}>Leave Balance</div>
            <p className="page-subtitle" style={{ marginBottom: 16 }}>Your entitlement and remaining days for {new Date().getFullYear()}.</p>
            {balance.length === 0 ? (
              <div style={{ fontSize: 13, color: '#9ca3af' }}>No leave types configured.</div>
            ) : (
              <div className="d-flex flex-wrap gap-3">
                {balance.map(b => (
                  <div key={b.leave_type_id} className="ess-bal-card" style={{ flex: '1 1 170px', minWidth: 150 }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color }}></span>
                      <span style={{ fontSize: 12.5, color: '#374151' }}>{b.name}</span>
                    </div>
                    {b.unlimited ? (
                      <div style={{ fontSize: 22, fontWeight: 600, color: '#3b82f6' }}>∞ <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>unlimited</span></div>
                    ) : (
                      <>
                        <div style={{ fontSize: 24, fontWeight: 600, color: (b.balance ?? 0) > 0 ? '#16a34a' : '#dc2626' }}>{b.balance}<span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}> / {b.entitlement}</span></div>
                        <div style={{ fontSize: 11.5, color: '#9ca3af' }}>used {b.used}{b.pending > 0 ? ` · pending ${b.pending}` : ''}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #eef2f7' }} />

            {/* ── My Leave section ── */}
            <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
              <div><div style={{ fontSize: 15, color: '#1f2937', fontWeight: 600 }}>My Leave</div><p className="page-subtitle" style={{ margin: 0 }}>Apply for leave and track your applications.</p></div>
              <button className="rm-btn-primary" onClick={openCreate}><i className="bi bi-plus-lg"></i> Apply for Leave</button>
            </div>

            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Reference</th><th className="rm-th-module">Leave Type</th>
                  <th className="rm-th-module">From</th><th className="rm-th-module">To</th>
                  <th className="rm-th-perm">Days</th><th className="rm-th-perm">Doc</th><th className="rm-th-perm">Status</th><th className="rm-th-perm">Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-calendar-check" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No leave applications yet.</td></tr>
                  ) : rows.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{r.reference_no}</td>
                      <td className="rm-td-module" style={{ color: '#1f2937' }}>{r.leave_type_name || '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.start_date ? fmt(r.start_date) : '—'}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.end_date ? fmt(r.end_date) : '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 13 }}>{r.days ?? '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}>{(r.has_document === 1 || (r.has_document as any) === true) ? <a href={`/api/ess/leave?doc=${r.id}`} target="_blank" rel="noreferrer" title="View document" style={{ color: '#2563eb' }}><i className="bi bi-paperclip"></i></a> : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${STATUS_BADGE[r.status] || 'badge-pending'}`}>{r.status}</span></td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><button className="rm-action-btn rm-action-view" title="View" onClick={() => setViewRow(r)}><i className="bi bi-eye-fill"></i></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Apply modal */}
        {modal && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" style={{ maxWidth: 640 }}>
              <div className="usr-modal-header"><div><p className="usr-modal-title"><i className="bi bi-plus-circle" style={{ marginRight: 8 }}></i>Apply for Leave</p></div><button className="usr-modal-close" onClick={() => setModal(false)}><i className="bi bi-x-lg"></i></button></div>
              <div className="usr-modal-body">
                {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
                <div className="mb-3">
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Leave Type <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="rm-input" value={form.leave_type_id} onChange={e => set('leave_type_id', e.target.value)}>
                    <option value="">Select Leave Type</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}{t.gender_eligibility && t.gender_eligibility !== 'All' ? ` (${t.gender_eligibility} only)` : ''}</option>)}
                  </select>
                  {selectedBal && (
                    <div style={{ fontSize: 12, color: selectedBal.unlimited ? '#3b82f6' : (selectedBal.balance ?? 0) > 0 ? '#16a34a' : '#dc2626', marginTop: 4 }}>
                      <i className="bi bi-info-circle me-1"></i>
                      {selectedBal.unlimited ? 'Unlimited entitlement.' : `Balance: ${selectedBal.balance} of ${selectedBal.entitlement} days remaining this year.`}
                    </div>
                  )}
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div style={{ flex: '1 1 240px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Start Date <span style={{ color: '#ef4444' }}>*</span></label><input type="date" className="rm-input" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
                  <div style={{ flex: '1 1 240px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>End Date <span style={{ color: '#ef4444' }}>*</span></label><input type="date" className="rm-input" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>
                </div>
                <div className="mb-3">
                  <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Total Days</label>
                  <div className="rm-input" style={{ background: '#f9fafb', display: 'flex', alignItems: 'center', color: totalDays > 0 ? '#16a34a' : '#9ca3af', fontWeight: 500 }}>{totalDays}</div>
                </div>
                {needDoc && (
                  <div className="mb-3">
                    <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Supporting Document <span style={{ color: '#ef4444' }}>*</span></label>
                    <label className="srm-file-btn" style={{ width: '100%', justifyContent: 'flex-start' }}><i className="bi bi-upload"></i><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docName || 'Choose File (e.g. medical certificate)'}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={pickDoc} /></label>
                    <div style={{ fontSize: 11.5, color: '#d97706', marginTop: 4 }}><i className="bi bi-exclamation-triangle-fill me-1"></i>{selectedType?.name} requires a supporting document.</div>
                  </div>
                )}
                <div className="mb-3"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Reason <span style={{ color: '#ef4444' }}>*</span></label><textarea className="rm-input" rows={3} value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Enter reason for leave" /></div>
                <div className="mb-1"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Remarks</label><textarea className="rm-input" rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Optional" /></div>
              </div>
              <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setModal(false)} disabled={saving}>Cancel</button><button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Submitting...</> : <><i className="bi bi-check-circle-fill"></i> Submit Application</>}</button></div>
            </div>
          </div>
        )}

        {/* View modal */}
        {viewRow && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" style={{ maxWidth: 560 }}>
              <div className="usr-modal-header"><div><p className="usr-modal-title">Leave Details</p><p className="usr-modal-sub">{viewRow.reference_no}</p></div><button className="usr-modal-close" onClick={() => setViewRow(null)}><i className="bi bi-x-lg"></i></button></div>
              <div className="usr-modal-body">
                <div className="cr-panel">
                  <div className="cr-panel-head"><i className="bi bi-calendar-check-fill"></i> Leave Information</div>
                  <div className="cr-panel-body">
                    <div className="cr-kv"><span className="cr-kv-label">Leave Type</span><span className="cr-kv-value">{viewRow.leave_type_name || '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">From</span><span className="cr-kv-value">{viewRow.start_date ? fmt(viewRow.start_date) : '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">To</span><span className="cr-kv-value">{viewRow.end_date ? fmt(viewRow.end_date) : '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Total Days</span><span className="cr-kv-value accent">{viewRow.days ?? '—'}</span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Status</span><span className="cr-kv-value"><span className={`badge-status ${STATUS_BADGE[viewRow.status] || 'badge-pending'}`}>{viewRow.status}</span></span></div>
                    <div className="cr-kv"><span className="cr-kv-label">Reason</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{viewRow.reason || '—'}</span></div>
                    {viewRow.remarks && <div className="cr-kv"><span className="cr-kv-label">Remarks</span><span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{viewRow.remarks}</span></div>}
                    {(viewRow.has_document === 1 || (viewRow.has_document as any) === true) && (
                      <div className="cr-kv"><span className="cr-kv-label">Document</span><span className="cr-kv-value"><a href={`/api/ess/leave?doc=${viewRow.id}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}><i className="bi bi-paperclip"></i> View Supporting Document</a></span></div>
                    )}
                  </div>
                </div>
              </div>
              <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setViewRow(null)}>Close</button></div>
            </div>
          </div>
        )}
      </EssLayout>
    </>
  );
}
