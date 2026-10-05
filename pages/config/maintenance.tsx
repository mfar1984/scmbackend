'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import ConfigLayout from '../../components/ConfigLayout';

function FormRow({ label, hint, last, children }: { label: string; hint?: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div className={`usr-form-row${last ? ' usr-form-row-last' : ''}`}>
      <div className="usr-form-label" style={{ paddingTop: 8 }}>
        <div>{label}</div>
        {hint && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 2 }}>{hint}</div>}
      </div>
      <div className="usr-form-field">{children}</div>
    </div>
  );
}

type LogEntry = { timestamp?: string; time?: string; level: string; message: string; user?: string; category?: string; };
type HealthItem = { label: string; status: string; ok: 'up' | 'warn' | 'down'; icon: string };

export default function MaintenanceConfigPage() {
  const [maintenance, setMaintenance]   = useState(false);
  const [maintMsg, setMaintMsg]         = useState('We are currently performing scheduled maintenance. We will be back shortly.');
  const [maintAllowIp, setMaintAllowIp] = useState('127.0.0.1');
  const [debugMode, setDebugMode]       = useState(false);
  const [logLevel, setLogLevel]         = useState('INFO');
  const [logRetention, setLogRetention] = useState('30');
  const [clearing, setClearing]         = useState<string | null>(null);
  const [clearResult, setClearResult]   = useState<string | null>(null);
  const [cacheMsg, setCacheMsg]         = useState<string | null>(null);
  const [logs, setLogs]                 = useState<LogEntry[]>([]);
  const [health, setHealth]             = useState<HealthItem[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    fetch('/api/config/maintenance')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data;
          setMaintenance(d.maintenance_mode === '1');
          setMaintMsg(d.maint_message   || 'We are currently performing scheduled maintenance. We will be back shortly.');
          setMaintAllowIp(d.maint_allow_ip || '127.0.0.1');
          setDebugMode(d.debug_mode     === '1');
          setLogLevel(d.log_level       || 'INFO');
          setLogRetention(d.log_retention || '30');
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const loadStatus = () => {
    setStatusLoading(true);
    fetch('/api/config/system-status')
      .then(r => r.json())
      .then(j => { if (j.success) { setHealth(j.data.health || []); setLogs(j.data.logs || []); } })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  };
  useEffect(() => { loadStatus(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res  = await fetch('/api/config/maintenance', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenance_mode: maintenance ? '1' : '0',
          maint_message: maintMsg, maint_allow_ip: maintAllowIp,
          debug_mode: debugMode ? '1' : '0',
          log_level: logLevel, log_retention: logRetention,
        }),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const clearCache = async (type: string) => {
    setClearing(type);
    setClearResult(null);
    setError('');
    try {
      const j = await (await fetch('/api/config/cache', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }),
      })).json();
      if (j.success || j.warning) {
        setClearResult(type);
        setCacheMsg(j.message || 'Done.');
        setTimeout(() => { setClearResult(null); setCacheMsg(null); }, 5000);
      } else {
        setError(j.message || 'Cache operation failed.');
      }
    } catch { setError('Network error during cache operation.'); }
    finally { setClearing(null); }
  };

  const levelColor = (level: string) => {
    if (level === 'ERROR') return { bg: '#fef2f2', color: '#dc2626' };
    if (level === 'WARN')  return { bg: '#fffbeb', color: '#d97706' };
    return { bg: '#f0fdf4', color: '#16a34a' };
  };

  const formatLogTime = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };

  const exportLogs = () => {
    const lines = logs.map(l => {
      const ts = formatLogTime(l.timestamp || l.time || '');
      return `[${ts}] ${l.level}\t${l.user ? l.user + '\t' : ''}${l.message}`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atline-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head><title>Maintenance & Cache — ATLINE Admin</title></Head>
      <ConfigLayout activeTab="maintenance">
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#374151,#1f2937)' }}>
            <i className="bi bi-tools"></i>
          </div>
          <div>
            <h2 className="int-section-title">Maintenance & Cache</h2>
            <p className="int-section-sub">Manage maintenance mode, clear system cache, configure debug logging and monitor system health.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading settings...
          </div>
        ) : (
        <form onSubmit={handleSave}>
          {saved  && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> Settings saved.</div>}
          {error  && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}>{error}</div>}

          {/* Maintenance Mode */}
          <div className="int-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-cone-striped"></i> Maintenance Mode</div>
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: 13, color: maintenance ? '#ef4444' : '#6b7280', fontWeight: maintenance ? 700 : 400 }}>
                  {maintenance ? '⚠ ACTIVE' : 'Inactive'}
                </span>
                <div className={`int-toggle ${maintenance ? 'int-toggle-on' : ''}`} style={{ background: maintenance ? '#ef4444' : undefined }} onClick={() => setMaintenance(!maintenance)}>
                  <div className="int-toggle-thumb"></div>
                </div>
              </div>
            </div>
            {maintenance && (
              <div className="int-warn-note mb-3">
                <i className="bi bi-exclamation-triangle-fill"></i>
                Maintenance mode is <strong>ON</strong>. The public website is currently inaccessible to visitors.
              </div>
            )}
            <FormRow label="Maintenance Message" hint="Shown to visitors during maintenance">
              <textarea className="rm-input" rows={3} value={maintMsg} onChange={e => setMaintMsg(e.target.value)} style={{ resize: 'vertical' }} />
            </FormRow>
            <FormRow label="Allow IP Addresses" hint="Comma-separated IPs that can bypass maintenance mode" last>
              <input className="rm-input" value={maintAllowIp} onChange={e => setMaintAllowIp(e.target.value)} placeholder="127.0.0.1, 192.168.1.1" />
            </FormRow>
          </div>

          {/* Cache Management */}
          <div className="int-card">
            <div className="int-card-title"><i className="bi bi-lightning-charge-fill"></i> Cache Management</div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Clear cached data to force fresh content. Use after editing website content if changes are not showing.
            </p>
            {cacheMsg && (
              <div className="rm-saved-banner mb-3"><i className="bi bi-check-circle-fill"></i> {cacheMsg}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'app',    label: 'Website Content Cache', desc: 'Revalidates the public website so CMS edits appear immediately' },
                { key: 'data',   label: 'Data / Fetch Cache',    desc: 'Clears cached API/fetch responses on the server' },
                { key: 'assets', label: 'Static Assets Cache',   desc: 'Revalidates asset references on the website' },
                { key: 'all',    label: 'Clear All Cache',       desc: 'Runs all of the above in one operation' },
              ].map(c => (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1f2937' }}>{c.label}</div>
                    <div style={{ fontSize: 12.5, color: '#6b7280' }}>{c.desc}</div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {clearResult === c.key && <span style={{ fontSize: 12.5, color: '#16a34a', fontWeight: 600 }}><i className="bi bi-check-circle-fill me-1"></i>Cleared</span>}
                    <button type="button" className="rm-btn-outline" style={{ fontSize: 12.5, padding: '6px 14px' }} onClick={() => clearCache(c.key)} disabled={clearing === c.key}>
                      {clearing === c.key
                        ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 12, height: 12, borderWidth: 2 }}></span>Clearing…</>
                        : <><i className="bi bi-trash3"></i> Clear</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Debug & Logging */}
          <div className="int-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-bug-fill"></i> Debug & Logging</div>
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: 13, color: '#6b7280' }}>Debug Mode: {debugMode ? 'ON' : 'OFF'}</span>
                <div className={`int-toggle ${debugMode ? 'int-toggle-on' : ''}`} onClick={() => setDebugMode(!debugMode)}>
                  <div className="int-toggle-thumb"></div>
                </div>
              </div>
            </div>
            {debugMode && (
              <div className="int-warn-note mb-3">
                <i className="bi bi-exclamation-triangle-fill"></i>
                Debug mode exposes detailed error messages. <strong>Disable in production.</strong>
              </div>
            )}
            <FormRow label="Log Level">
              <select className="rm-input" style={{ maxWidth: 160 }} value={logLevel} onChange={e => setLogLevel(e.target.value)}>
                <option>DEBUG</option><option>INFO</option><option>WARN</option><option>ERROR</option>
              </select>
            </FormRow>
            <FormRow label="Log Retention" hint="Days to keep log files" last>
              <div className="d-flex align-items-center gap-2">
                <input type="number" className="rm-input" style={{ maxWidth: 100 }} value={logRetention} onChange={e => setLogRetention(e.target.value)} min={1} max={365} />
                <span style={{ fontSize: 13, color: '#6b7280' }}>days</span>
              </div>
            </FormRow>
          </div>

          <div className="int-footer" style={{ marginBottom: 20 }}>
            <button type="submit" className="rm-btn-primary" disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                : <><i className="bi bi-floppy-fill"></i> Save Settings</>
              }
            </button>
          </div>
        </form>
        )}

        {/* System Logs */}
        <div className="int-card">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-journal-text"></i> Recent System Logs</div>
            <div className="d-flex gap-2">
              <button type="button" className="rm-btn-outline" style={{ fontSize: 12.5, padding: '6px 14px' }} onClick={loadStatus}>
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
              <button type="button" className="rm-btn-outline" style={{ fontSize: 12.5, padding: '6px 14px' }} onClick={exportLogs} disabled={logs.length === 0}>
                <i className="bi bi-download"></i> Export Logs
              </button>
            </div>
          </div>
          <div style={{ background: '#0f172a', borderRadius: 10, padding: '16px 18px', fontFamily: 'monospace', fontSize: 12.5, maxHeight: 320, overflowY: 'auto' }}>
            {statusLoading ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: 20 }}><span className="spinner-border spinner-border-sm me-2"></span> Loading logs…</div>
            ) : logs.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>No log entries yet.</div>
            ) : logs.map((log, i) => {
              const c = levelColor(log.level);
              const ts = log.timestamp || log.time || '';
              return (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#64748b', flexShrink: 0 }}>{formatLogTime(ts)}</span>
                  <span style={{ background: c.bg, color: c.color, padding: '1px 7px', borderRadius: 6, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{log.level}</span>
                  <span style={{ color: '#e2e8f0' }}>{log.message}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Health */}
        <div className="int-card" style={{ marginTop: 16 }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-heart-pulse-fill"></i> System Health</div>
            <button type="button" className="rm-btn-outline" style={{ fontSize: 12.5, padding: '6px 14px' }} onClick={loadStatus}>
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {(statusLoading && health.length === 0 ? Array.from({ length: 6 }) : health).map((item: any, idx) => {
              const color = !item ? '#9ca3af' : item.ok === 'up' ? '#22c55e' : item.ok === 'warn' ? '#f59e0b' : '#ef4444';
              return (
                <div key={item?.label || idx} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <i className={`bi ${item?.icon || 'bi-hourglass-split'}`} style={{ fontSize: 20, color }}></i>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{item?.label || '—'}</div>
                    <div style={{ fontSize: 12, color, fontWeight: 600 }}>{item?.status || 'Checking…'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ConfigLayout>
    </>
  );
}
