'use client';
import { useState, useEffect } from 'react';

type Item = { competency_name: string; weight: number; score: number; comments: string };

export default function KpiReviewModal({ assignmentId, onClose, onSaved }: { assignmentId: number; onClose: () => void; onSaved: () => void }) {
  const [info, setInfo] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/hr/kpi/assignments/${assignmentId}`).then(r => r.json()).then(j => {
      if (j.success) {
        setInfo(j.data);
        setItems(j.data.items.map((it: any) => ({ competency_name: it.competency_name, weight: Number(it.weight), score: Number(it.score) || 0, comments: it.comments || '' })));
        if (j.data.result?.reviewer_remarks) setRemarks(j.data.result.reviewer_remarks);
      } else setError(j.message || 'Not found.');
    }).catch(() => setError('Failed to load.')).finally(() => setLoading(false));
  }, [assignmentId]);

  const setItem = (i: number, k: keyof Item, v: any) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const weightSum = items.reduce((s, it) => s + (it.weight || 0), 0);
  const weighted = items.reduce((s, it) => s + (it.score || 0) * (it.weight || 0), 0);
  const finalScore = weightSum > 0 ? Math.round((weighted / weightSum) * 100) / 100 : 0;

  const submit = async (finalize: boolean) => {
    if (items.some(it => it.score < 0 || it.score > 100)) { setError('Scores must be between 0 and 100.'); return; }
    setSaving(true); setError('');
    try {
      const j = await (await fetch(`/api/hr/kpi/assignments/${assignmentId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, remarks, finalize }),
      })).json();
      if (j.success) onSaved(); else setError(j.message || 'Failed.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const scoreColor = finalScore >= 85 ? '#16a34a' : finalScore >= 70 ? '#3b82f6' : finalScore >= 55 ? '#f59e0b' : finalScore >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 760 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-clipboard-check" style={{ marginRight: 8 }}></i>KPI Review</p>
            {info && <p className="usr-modal-sub">{info.employee_name} · {info.template_name} · {info.period_name}</p>}
          </div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : error && !info ? (
            <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>
          ) : (
            <>
              {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
              {items.map((it, i) => (
                <div key={i} className="kpi-comp-row">
                  <div className="kpi-comp-head">
                    <span style={{ fontSize: 13.5, color: '#1f2937' }}>{it.competency_name}</span>
                    <span className="kpi-weight-pill">Weight {it.weight}%</span>
                  </div>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <div style={{ flex: '0 0 140px' }}>
                      <input type="number" min={0} max={100} step="1" className="rm-input" value={it.score} onChange={e => setItem(i, 'score', parseFloat(e.target.value) || 0)} placeholder="Score / 100" />
                    </div>
                    <div style={{ flex: '1 1 240px' }}>
                      <input className="rm-input" value={it.comments} onChange={e => setItem(i, 'comments', e.target.value)} placeholder="Comments (optional)" />
                    </div>
                  </div>
                  <div className="kpi-score-bar" style={{ marginTop: 8 }}>
                    <div className="kpi-score-fill" style={{ width: `${Math.min(100, Math.max(0, it.score))}%`, background: scoreColor }}></div>
                  </div>
                </div>
              ))}

              <div className="mt-3 mb-2"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Reviewer Remarks</label><textarea className="rm-input" rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Overall comments..." /></div>

              <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>Weighted Final Score{weightSum !== 100 ? ` (total weight ${weightSum}%)` : ''}</span>
                <span style={{ fontSize: 26, fontWeight: 600, color: scoreColor }}>{finalScore}%</span>
              </div>
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rm-btn-outline" onClick={() => submit(false)} disabled={saving || loading}><i className="bi bi-save"></i> Save Draft</button>
          <button className="rm-btn-primary" style={{ background: '#16a34a' }} onClick={() => submit(true)} disabled={saving || loading}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-check-circle-fill"></i> Finalize Review</>}
          </button>
        </div>
      </div>
    </div>
  );
}
