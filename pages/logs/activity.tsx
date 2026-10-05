'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import LogsLayout from '../../components/LogsLayout';
import { useDateFormat } from '../../lib/useDateFormat';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
type LogEntry = {
  id: number;
  timestamp: string;
  level: LogLevel;
  category: string;
  user: string;
  user_id: number | null;
  ip: string;
  path?: string | null;
  portal?: string | null;
  message: string;
  details?: string;
};
type UserOpt = { id: number; name: string; email: string; role: string; user_type: string };

const LEVELS: LogLevel[] = ['INFO', 'WARN', 'ERROR', 'DEBUG'];

const levelStyle = (level: LogLevel) => {
  const map: Record<LogLevel, { bg: string; color: string }> = {
    INFO:  { bg: '#f0fdf4', color: '#16a34a' },
    WARN:  { bg: '#fffbeb', color: '#d97706' },
    ERROR: { bg: '#fef2f2', color: '#dc2626' },
    DEBUG: { bg: '#f8fafc', color: '#64748b' },
  };
  return map[level];
};

export default function ActivityLoggingPage() {
  const { fmt } = useDateFormat();
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [levelFilter, setLevel]   = useState('All');
  const [userFilter, setUserF]    = useState('All');
  const [portalFilter, setPortal] = useState('All');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [perPage, setPerPage]     = useState(30);
  const [users, setUsers]         = useState<UserOpt[]>([]);

  useEffect(() => {
    fetch('/api/logs/users').then(r => r.json()).then(j => { if (j.success) setUsers(j.data); }).catch(() => {});
  }, []);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams({ limit: String(perPage) });
    if (levelFilter !== 'All') params.set('level', levelFilter);
    if (userFilter !== 'All')  params.set('user_id', userFilter);
    if (portalFilter !== 'All') params.set('portal', portalFilter);
    if (search)   params.set('search', search);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo)   params.set('to', dateTo);
    return params;
  }, [levelFilter, userFilter, portalFilter, search, dateFrom, dateTo, perPage]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/logs/activity?${buildParams()}`);
      const json = await res.json();
      if (json.success) { setLogs(json.data); setTotal(json.total); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const exportCsv = () => {
    const head = ['Timestamp', 'Level', 'Category', 'Portal', 'User', 'IP', 'Path', 'Message'];
    const rows = logs.map(l => [
      l.timestamp, l.level, l.category, l.portal || '', l.user, l.ip || '', l.path || '',
      (l.message || '').replace(/"/g, '""'),
    ]);
    const csv = [head, ...rows].map(r => r.map(c => `"${String(c ?? '')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    fetch('/api/logs/audit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'EXPORT', module: 'Auth', target: 'Activity Logs (CSV)', description: `Exported ${logs.length} activity log entries to CSV` }),
    }).catch(() => {});
  };

  return (
    <>
      <Head><title>Activity Logging - ATLINE Admin</title></Head>
      <LogsLayout activeTab="activity">

        {/* Stats strip */}
        <div className="log-stats-strip">
          {LEVELS.map(lv => {
            const s = levelStyle(lv);
            const count = logs.filter(l => l.level === lv).length;
            return (
              <button key={lv} className={`log-stat-pill ${levelFilter === lv ? 'log-stat-active' : ''}`}
                style={{ '--log-bg': s.bg, '--log-color': s.color } as React.CSSProperties}
                onClick={() => setLevel(levelFilter === lv ? 'All' : lv)}>
                <span className="log-stat-dot" style={{ background: s.color }}></span>
                <span className="log-stat-label">{lv}</span>
                <span className="log-stat-count">{count}</span>
              </button>
            );
          })}
          <div style={{ marginLeft: 'auto', fontSize: 12.5, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-circle-fill" style={{ fontSize: 8, color: '#22c55e' }}></i>
            Live monitoring active
          </div>
        </div>

        {/* Filters */}
        <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
            <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search message, user, IP, path..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="rm-input" style={{ width: 110 }} value={levelFilter} onChange={e => setLevel(e.target.value)}>
            <option value="All">All Levels</option>
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
          <select className="rm-input" style={{ width: 130 }} value={portalFilter} onChange={e => setPortal(e.target.value)}>
            <option value="All">All Portals</option>
            <option value="admin">Admin</option>
            <option value="ess">Self-Service</option>
          </select>
          <select className="rm-input" style={{ width: 180 }} value={userFilter} onChange={e => setUserF(e.target.value)}>
            <option value="All">All Users</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input type="date" className="rm-input" style={{ width: 145 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
          <input type="date" className="rm-input" style={{ width: 145 }} value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
          <button className="usr-btn-reset" onClick={() => { setSearch(''); setLevel('All'); setUserF('All'); setPortal('All'); setDateFrom(''); setDateTo(''); }}>
            <i className="bi bi-arrow-counterclockwise"></i> Reset
          </button>
          <button className="rm-btn-outline" style={{ fontSize: 12.5, padding: '7px 14px' }} onClick={exportCsv} disabled={logs.length === 0}>
            <i className="bi bi-download"></i> Export
          </button>
        </div>

        {/* Log table */}
        <div className="rm-table-wrap">
          <table className="rm-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th className="rm-th-module" style={{ width: 150 }}>Timestamp</th>
                <th className="rm-th-perm" style={{ width: 64 }}>Level</th>
                <th className="rm-th-perm" style={{ width: 100 }}>Category</th>
                <th className="rm-th-module">Message</th>
                <th className="rm-th-perm" style={{ width: 150 }}>User</th>
                <th className="rm-th-perm" style={{ width: 110 }}>IP</th>
                <th className="rm-th-perm" style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                  <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading logs...
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                  <i className="bi bi-journal-x" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No logs found.
                </td></tr>
              ) : logs.map(log => {
                const s = levelStyle(log.level);
                const hasMore = !!(log.details || log.path);
                const isExpanded = expanded === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr className="rm-data-row" style={{ cursor: hasMore ? 'pointer' : 'default' }}
                      onClick={() => hasMore && setExpanded(isExpanded ? null : log.id)}>
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#6b7280', fontWeight: 400 }}>
                        {fmt(log.timestamp, true)}
                      </td>
                      <td className="rm-td-perm">
                        <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 10, letterSpacing: '.3px' }}>
                          {log.level}
                        </span>
                      </td>
                      <td className="rm-td-perm">
                        <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 11, fontWeight: 400, padding: '2px 8px', borderRadius: 10 }}>
                          {log.category}
                        </span>
                      </td>
                      <td style={{ padding: '9px 16px', fontSize: 13, color: '#1f2937' }}>
                        {log.message}
                        {log.portal === 'ess' && <span style={{ marginLeft: 6, fontSize: 10, color: '#7c3aed', background: '#faf5ff', padding: '1px 6px', borderRadius: 8 }}>ESS</span>}
                      </td>
                      <td className="rm-td-perm" style={{ fontSize: 12, color: '#6b7280' }}>{log.user}</td>
                      <td className="rm-td-perm" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{log.ip}</td>
                      <td className="rm-td-perm">
                        {hasMore && <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ color: '#9ca3af', fontSize: 13 }}></i>}
                      </td>
                    </tr>
                    {isExpanded && hasMore && (
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan={7} style={{ padding: '10px 16px 14px 32px' }}>
                          {log.path && (
                            <div style={{ fontSize: 12.5, color: '#374151', marginBottom: log.details ? 6 : 0 }}>
                              <i className="bi bi-link-45deg" style={{ color: '#3b82f6', marginRight: 6 }}></i>
                              <span style={{ fontFamily: 'monospace' }}>{log.path}</span>
                            </div>
                          )}
                          {log.details && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <i className="bi bi-info-circle-fill" style={{ color: '#3b82f6', fontSize: 14, marginTop: 1, flexShrink: 0 }}></i>
                              <span style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#374151', lineHeight: 1.6 }}>{log.details}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="d-flex align-items-center justify-content-between mt-3">
          <span style={{ fontSize: 12.5, color: '#6b7280' }}>Showing {logs.length} of {total} entries</span>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 12.5, color: '#6b7280' }}>Per page:</span>
            <select className="rm-input" style={{ width: 80, fontSize: 12.5, padding: '5px 8px' }} value={perPage} onChange={e => setPerPage(Number(e.target.value))}>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

      </LogsLayout>
    </>
  );
}
