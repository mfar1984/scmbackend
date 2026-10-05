'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import LogsLayout from '../../components/LogsLayout';
import { useDateFormat } from '../../lib/useDateFormat';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'APPROVE' | 'REJECT';

type AuditEntry = {
  id: number;
  timestamp: string;
  action: AuditAction;
  module: string;
  user: string;
  user_role: string;
  ip: string;
  target: string;
  before_data?: Record<string, string> | null;
  after_data?:  Record<string, string> | null;
  description: string;
};

const ACTION_STYLES: Record<AuditAction, { bg: string; color: string; icon: string }> = {
  CREATE:  { bg: '#f0fdf4', color: '#16a34a', icon: 'bi-plus-circle-fill' },
  UPDATE:  { bg: '#eff6ff', color: '#2563eb', icon: 'bi-pencil-fill' },
  DELETE:  { bg: '#fef2f2', color: '#dc2626', icon: 'bi-trash-fill' },
  LOGIN:   { bg: '#f0fdf4', color: '#059669', icon: 'bi-box-arrow-in-right' },
  LOGOUT:  { bg: '#f8fafc', color: '#64748b', icon: 'bi-box-arrow-right' },
  EXPORT:  { bg: '#faf5ff', color: '#7c3aed', icon: 'bi-download' },
  APPROVE: { bg: '#f0fdf4', color: '#16a34a', icon: 'bi-check-circle-fill' },
  REJECT:  { bg: '#fef2f2', color: '#dc2626', icon: 'bi-x-circle-fill' },
};

const MODULES = ['All', 'Auth', 'Leave', 'Claim', 'Overtime', 'Expense', 'Employees', 'Applicants', 'Career Postings', 'Users', 'Roles', 'Clients', 'Products', 'Gallery', 'Downloads', 'Tender', 'Procurement', 'Strategic Partner'];
const ACTIONS: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'APPROVE', 'REJECT'];

type UserOpt = { id: number; name: string; email: string; role: string };

export default function AuditLogPage() {
  const { fmt } = useDateFormat();
  const [logs, setLogs]         = useState<AuditEntry[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [actionF, setActionF]   = useState('All');
  const [moduleF, setModuleF]   = useState('All');
  const [userF, setUserF]       = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [perPage, setPerPage]   = useState(30);
  const [users, setUsers]       = useState<UserOpt[]>([]);

  useEffect(() => {
    fetch('/api/logs/users').then(r => r.json()).then(j => { if (j.success) setUsers(j.data); }).catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(perPage) });
      if (actionF !== 'All') params.set('action', actionF);
      if (moduleF !== 'All') params.set('module', moduleF);
      if (userF !== 'All' && userF !== '')   params.set('user_id', userF);
      if (search && search.trim())  params.set('search', search.trim());
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo)   params.set('to', dateTo);

      const res  = await fetch(`/api/logs/audit?${params}`);
      const json = await res.json();
      if (json.success) { setLogs(json.data); setTotal(json.total); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [actionF, moduleF, userF, search, dateFrom, dateTo, perPage]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const exportCsv = () => {
    const head = ['Timestamp', 'Action', 'Module', 'User', 'Role', 'IP', 'Target', 'Description'];
    const rows = logs.map(l => [l.timestamp, l.action, l.module, l.user, l.user_role || '', l.ip || '', l.target, (l.description || '').replace(/"/g, '""')]);
    const csv = [head, ...rows].map(r => r.map(c => `"${String(c ?? '')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    fetch('/api/logs/audit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'EXPORT', module: 'Auth', target: 'Audit Log (CSV)', description: `Exported ${logs.length} audit records to CSV` }),
    }).catch(() => {});
  };

  return (
    <>
      <Head><title>Audit Log - ATLINE Admin</title></Head>
      <LogsLayout activeTab="audit">

        {/* Info banner */}
        <div className="int-info-note mb-4">
          <i className="bi bi-shield-check"></i>
          The audit log records all significant actions performed by users — creates, updates, deletes, approvals and logins.
          Records are immutable and cannot be deleted. Retained for 365 days.
        </div>

        {/* Action filter pills */}
        <div className="d-flex gap-2 flex-wrap mb-3">
          <button className={`log-action-pill ${actionF === 'All' ? 'log-action-all' : ''}`} onClick={() => setActionF('All')}>
            All Actions
          </button>
          {ACTIONS.map(a => {
            const s = ACTION_STYLES[a];
            return (
              <button key={a}
                className={`log-action-pill ${actionF === a ? 'log-action-selected' : ''}`}
                style={actionF === a ? { background: s.bg, color: s.color, borderColor: s.color } : {}}
                onClick={() => setActionF(actionF === a ? 'All' : a)}>
                <i className={`bi ${s.icon}`} style={{ fontSize: 12 }}></i>
                {a}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
            <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search description, user, target..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="rm-input" style={{ width: 180 }} value={userF} onChange={e => setUserF(e.target.value)}>
            <option value="All">All Users</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select className="rm-input" style={{ width: 150 }} value={moduleF} onChange={e => setModuleF(e.target.value)}>
            {MODULES.map(m => <option key={m} value={m}>{m === 'All' ? 'All Modules' : m}</option>)}
          </select>
          <input type="date" className="rm-input" style={{ width: 145 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
          <input type="date" className="rm-input" style={{ width: 145 }} value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
          <button className="usr-btn-reset" onClick={() => { setSearch(''); setActionF('All'); setModuleF('All'); setUserF('All'); setDateFrom(''); setDateTo(''); }}>
            <i className="bi bi-arrow-counterclockwise"></i> Reset
          </button>
          <button className="rm-btn-outline" style={{ fontSize: 12.5, padding: '7px 14px' }} onClick={exportCsv} disabled={logs.length === 0}>
            <i className="bi bi-download"></i> Export
          </button>
        </div>

        {/* Audit table */}
        <div className="rm-table-wrap">
          <table className="rm-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th className="rm-th-module" style={{ width: 160 }}>Timestamp</th>
                <th className="rm-th-perm" style={{ width: 100 }}>Action</th>
                <th className="rm-th-perm" style={{ width: 110 }}>Module</th>
                <th className="rm-th-module">Description / Target</th>
                <th className="rm-th-perm" style={{ width: 180 }}>User</th>
                <th className="rm-th-perm" style={{ width: 120 }}>IP Address</th>
                <th className="rm-th-perm" style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                  <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading audit records...
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                  <i className="bi bi-shield-x" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No audit records found.
                </td></tr>
              ) : logs.map(log => {
                const s = ACTION_STYLES[log.action];
                const isExpanded = expanded === log.id;
                const hasDiff = log.before_data || log.after_data;
                return (
                  <React.Fragment key={log.id}>
                    <tr className="rm-data-row" style={{ cursor: hasDiff ? 'pointer' : 'default' }}
                      onClick={() => hasDiff && setExpanded(isExpanded ? null : log.id)}>
                      <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#6b7280', fontWeight: 400 }}>
                        {fmt(log.timestamp, true)}
                      </td>
                      <td className="rm-td-perm">
                        <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 400, padding: '3px 8px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <i className={`bi ${s.icon}`} style={{ fontSize: 10 }}></i>
                          {log.action}
                        </span>
                      </td>
                      <td className="rm-td-perm">
                        <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 11, fontWeight: 400, padding: '2px 8px', borderRadius: 10 }}>
                          {log.module}
                        </span>
                      </td>
                      <td style={{ padding: '9px 16px' }}>
                        <div style={{ fontSize: 13, color: '#1f2937' }}>{log.description}</div>
                        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{log.target}</div>
                      </td>
                      <td className="rm-td-perm">
                        <div style={{ fontSize: 12.5, color: '#374151' }}>{log.user}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{log.user_role}</div>
                      </td>
                      <td className="rm-td-perm" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{log.ip}</td>
                      <td className="rm-td-perm">
                        {hasDiff && (
                          <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ color: '#9ca3af', fontSize: 13 }}></i>
                        )}
                      </td>
                    </tr>
                    {isExpanded && hasDiff && (
                      <tr key={`${log.id}-diff`} style={{ background: '#f8fafc' }}>
                        <td colSpan={7} style={{ padding: '12px 16px 16px 32px' }}>
                          <div className="audit-diff">
                            {log.before_data && (
                              <div className="audit-diff-col audit-diff-before">
                                <div className="audit-diff-header"><i className="bi bi-dash-circle-fill"></i> Before</div>
                                {Object.entries(log.before_data).map(([k, v]) => (
                                  <div key={k} className="audit-diff-row">
                                    <span className="audit-diff-key">{k}</span>
                                    <span className="audit-diff-val audit-diff-val-old">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {log.after_data && (
                              <div className="audit-diff-col audit-diff-after">
                                <div className="audit-diff-header"><i className="bi bi-plus-circle-fill"></i> After</div>
                                {Object.entries(log.after_data).map(([k, v]) => (
                                  <div key={k} className="audit-diff-row">
                                    <span className="audit-diff-key">{k}</span>
                                    <span className="audit-diff-val audit-diff-val-new">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
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
          <span style={{ fontSize: 12.5, color: '#6b7280' }}>
            Showing {logs.length} of {total} audit records
          </span>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 12.5, color: '#6b7280' }}>Per page:</span>
            <select className="rm-input" style={{ width: 80, fontSize: 12.5, padding: '5px 8px' }} value={perPage} onChange={e => setPerPage(Number(e.target.value))}>
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

      </LogsLayout>
    </>
  );
}
