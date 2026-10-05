'use client';
import { useState, useEffect } from 'react';

type Record = { id: number; level: number; action: string; actor_name: string | null; remarks: string | null; created_at: string };

/** Read-only approval history for an application (leave/claim/overtime/expenses). */
export default function ApprovalTrail({ module, id, fmt }: { module: string; id: number; fmt: (d: any, t?: boolean) => string }) {
  const [rows, setRows] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/hr/approval-trail?module=${module}&id=${id}`)
      .then(r => r.json())
      .then(j => { if (j.success) setRows(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [module, id]);

  return (
    <div className="cr-panel">
      <div className="cr-panel-head"><i className="bi bi-diagram-3-fill"></i> Approval Trail</div>
      <div className="cr-panel-body">
        {loading ? (
          <div style={{ fontSize: 12.5, color: '#9ca3af' }}><span className="spinner-border spinner-border-sm me-1"></span> Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ fontSize: 12.5, color: '#9ca3af', textAlign: 'center', padding: '6px 0' }}>No approval action yet — still pending.</div>
        ) : (
          <div className="apt-timeline">
            {rows.map(r => (
              <div key={r.id} className="apt-row">
                <div className={`apt-dot ${r.action === 'Approved' ? 'apt-ok' : 'apt-no'}`}>
                  <i className={`bi ${r.action === 'Approved' ? 'bi-check-lg' : 'bi-x-lg'}`}></i>
                </div>
                <div className="apt-body">
                  <div className="apt-head">
                    <span className="apt-action" style={{ color: r.action === 'Approved' ? '#16a34a' : '#dc2626' }}>
                      {r.action === 'Approved' ? `Approved — Level ${r.level}` : 'Rejected'}
                    </span>
                    <span className="apt-time">{fmt(r.created_at, true)}</span>
                  </div>
                  <div className="apt-actor">by {r.actor_name || 'System'}</div>
                  {r.remarks && <div className="apt-remarks">“{r.remarks}”</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
