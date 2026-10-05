'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import IntegrationLayout from '../../components/IntegrationLayout';
import { usePermissions } from '../../lib/usePermissions';
import { useDateFormat } from '../../lib/useDateFormat';

type BinItem = {
  id: number; module_key: string; module_label: string | null; source_table: string;
  record_id: number; label: string; file_count: number; deleted_at: string; deleted_by_name: string | null;
};

const RETENTIONS = [
  { v: 0, label: 'Never' },
  { v: 30, label: '30 days' },
  { v: 60, label: '60 days' },
  { v: 90, label: '90 days' },
  { v: 180, label: '180 days' },
  { v: 365, label: '1 year' },
];

function humanSize(bytes: number): string {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const USAGE_CAP = 10 * 1024 * 1024; // 10 MB soft cap for the usage bar

export default function RecycleBinPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canRestore = can('settings.integration.recycle_bin', 'Update');
  const canPurge = can('settings.integration.recycle_bin', 'Delete');

  const [items, setItems] = useState<BinItem[]>([]);
  const [usage, setUsage] = useState(0);
  const [retention, setRetention] = useState(30);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'purge' | 'empty'; item?: BinItem } | null>(null);
  const [savingRet, setSavingRet] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const j = await (await fetch('/api/integration/recycle-bin')).json();
      if (j.success) { setItems(j.data); setUsage(j.usage_bytes || 0); setRetention(j.retention_days || 0); }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const restore = async (item: BinItem) => {
    setBusy(item.id);
    try {
      const j = await (await fetch(`/api/integration/recycle-bin/${item.id}`, { method: 'POST' })).json();
      if (j.success) { flash('Item restored.'); load(); } else alert(j.message || 'Restore failed.');
    } catch { alert('Network error.'); } finally { setBusy(null); }
  };

  const purge = async (item: BinItem) => {
    setBusy(item.id);
    try {
      const j = await (await fetch(`/api/integration/recycle-bin/${item.id}`, { method: 'DELETE' })).json();
      if (j.success) { flash('Permanently deleted.'); load(); } else alert(j.message || 'Delete failed.');
    } catch { alert('Network error.'); } finally { setBusy(null); setConfirm(null); }
  };

  const emptyAll = async () => {
    try {
      const j = await (await fetch('/api/integration/recycle-bin/empty', { method: 'POST' })).json();
      if (j.success) { flash(`Emptied — ${j.purged} item(s) removed.`); load(); } else alert(j.message || 'Failed.');
    } catch { alert('Network error.'); } finally { setConfirm(null); }
  };

  const saveRetention = async (days: number) => {
    setRetention(days); setSavingRet(true);
    try {
      const j = await (await fetch('/api/integration/recycle-bin/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ retention_days: days }),
      })).json();
      if (j.success) flash('Retention updated.'); else alert(j.message || 'Failed.');
    } catch { alert('Network error.'); } finally { setSavingRet(false); }
  };

  const daysLeft = (deletedAt: string): number | null => {
    if (!retention) return null;
    const expiry = new Date(deletedAt).getTime() + retention * 86400000;
    return Math.max(0, Math.ceil((expiry - Date.now()) / 86400000));
  };

  const q = search.toLowerCase();
  const filtered = items.filter(it => [it.label, it.module_label, it.module_key].some(v => String(v ?? '').toLowerCase().includes(q)));
  const pct = Math.min(100, Math.round((usage / USAGE_CAP) * 100));

  return (
    <>
      <Head><title>Recycle Bin — ATLINE Admin</title></Head>
      <IntegrationLayout activeTab="recycle-bin">
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#64748b,#475569)' }}>
            <i className="bi bi-trash3-fill"></i>
          </div>
          <div>
            <h2 className="int-section-title">Recycle Bin</h2>
            <p className="int-section-sub">Deleted records across all modules are kept here. Restore them, or remove them permanently. Items auto-delete after the retention period.</p>
          </div>
        </div>

        {msg && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> {msg}</div>}

        {/* Usage + retention */}
        <div className="int-card">
          <div className="d-flex flex-wrap gap-4 align-items-center justify-content-between">
            <div style={{ flex: '1 1 280px' }}>
              <div className="d-flex justify-content-between" style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 6 }}>
                <span><i className="bi bi-hdd me-1"></i> Storage used</span>
                <span>{humanSize(usage)} / {humanSize(USAGE_CAP)}</span>
              </div>
              <div style={{ height: 8, background: '#eef2f7', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct > 85 ? '#ef4444' : 'linear-gradient(90deg,#64748b,#475569)', transition: 'width .3s' }}></div>
              </div>
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <label className="rm-label" style={{ display: 'block', marginBottom: 6, fontSize: 12.5 }}>Auto-delete after</label>
              <select className="rm-input" style={{ width: 160 }} value={retention} onChange={e => saveRetention(parseInt(e.target.value))} disabled={!canRestore || savingRet}>
                {RETENTIONS.map(r => <option key={r.v} value={r.v}>{r.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
            <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search deleted items…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {canPurge && items.length > 0 && <button className="rm-btn-danger" onClick={() => setConfirm({ kind: 'empty' })}><i className="bi bi-trash3"></i> Empty Bin</button>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
        ) : (
          <div className="rm-table-wrap">
            <table className="rm-table" style={{ minWidth: 880 }}>
              <thead><tr>
                <th className="rm-th-module">Item</th><th className="rm-th-perm">Module</th>
                <th className="rm-th-perm">Files</th><th className="rm-th-perm">Deleted By</th>
                <th className="rm-th-perm">Deleted</th><th className="rm-th-perm">Auto-delete</th>
                <th className="rm-th-perm">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-trash3" style={{ fontSize: 30, display: 'block', marginBottom: 10 }}></i>Recycle bin is empty.</td></tr>
                ) : filtered.map(it => {
                  const left = daysLeft(it.deleted_at);
                  return (
                    <tr key={it.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ color: '#1f2937' }}>{it.label}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className="usr-role-badge">{it.module_label || it.module_key}</span></td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280' }}>{it.file_count ? <><i className="bi bi-paperclip me-1"></i>{it.file_count}</> : '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280' }}>{it.deleted_by_name || '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmt(it.deleted_at, true)}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12 }}>{left === null ? <span style={{ color: '#9ca3af' }}>Never</span> : <span style={{ color: left <= 3 ? '#ef4444' : '#6b7280' }}>{left} day{left !== 1 ? 's' : ''}</span>}</td>
                      <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                        {canRestore && <button className="rm-action-btn rm-action-edit" title="Restore" disabled={busy === it.id} onClick={() => restore(it)}><i className="bi bi-arrow-counterclockwise"></i></button>}
                        {canPurge && <button className="rm-action-btn rm-action-delete" title="Delete permanently" disabled={busy === it.id} onClick={() => setConfirm({ kind: 'purge', item: it })}><i className="bi bi-trash-fill"></i></button>}
                        {!canRestore && !canPurge && <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>}
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''} in bin</div>}

        {confirm && (
          <div className="rm-modal-overlay">
            <div className="rm-modal">
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>{confirm.kind === 'empty' ? 'Empty Recycle Bin?' : 'Delete Permanently?'}</h3>
              <p>{confirm.kind === 'empty'
                ? 'This permanently removes ALL items in the bin and their attached files. This cannot be undone.'
                : <>This permanently removes <strong>{confirm.item?.label}</strong>{confirm.item?.file_count ? ' and its attached files' : ''}. This cannot be undone.</>}</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setConfirm(null)}>Cancel</button>
                <button className="rm-btn-danger" onClick={() => confirm.kind === 'empty' ? emptyAll() : purge(confirm.item!)}><i className="bi bi-trash-fill"></i> Delete</button>
              </div>
            </div>
          </div>
        )}
      </IntegrationLayout>
    </>
  );
}
