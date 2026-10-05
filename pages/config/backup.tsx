'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import ConfigLayout from '../../components/ConfigLayout';
import ReadOnlyGuard from '../../components/ReadOnlyGuard';
import { usePermissions } from '../../lib/usePermissions';
import { useDateFormat } from '../../lib/useDateFormat';

type BackupRecord = {
  id: number; file_name: string; size_bytes: number; storage: string;
  type: 'Auto' | 'Manual'; status: 'Complete' | 'Failed' | 'Running'; note: string | null; created_at: string;
};

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

function humanSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const STORAGE_LABEL: Record<string, string> = { local: 'Local', r2: 'Cloudflare', ftp: 'FTP/SFTP' };

export default function BackupConfigPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canUpdate = can('settings.config.backup', 'Update');
  const canCreate = can('settings.config.backup', 'Create');
  const canDelete = can('settings.config.backup', 'Delete');
  const canExport = can('settings.config.backup', 'Export');
  const [autoBackup, setAutoBackup]   = useState(true);
  const [schedule, setSchedule]       = useState('daily');
  const [backupTime, setBackupTime]   = useState('03:00');
  const [retention, setRetention]     = useState('30');
  const [storage, setStorage]         = useState('local');
  // Cloudflare R2
  const [r2Account, setR2Account]     = useState('');
  const [r2Bucket, setR2Bucket]       = useState('');
  const [r2Key, setR2Key]             = useState('');
  const [r2Secret, setR2Secret]       = useState('');
  // FTP / SFTP
  const [ftpHost, setFtpHost]         = useState('');
  const [ftpPort, setFtpPort]         = useState('21');
  const [ftpUser, setFtpUser]         = useState('');
  const [ftpPass, setFtpPass]         = useState('');
  const [ftpProtocol, setFtpProtocol] = useState('ftp');
  const [ftpDir, setFtpDir]           = useState('/backups');

  const [backups, setBackups]         = useState<BackupRecord[]>([]);
  const [running, setRunning]         = useState(false);
  const [restoreId, setRestoreId]     = useState<number | null>(null);
  const [restoring, setRestoring]     = useState(false);
  const [delId, setDelId]             = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState('');
  const [testing, setTesting]         = useState(false);
  const [testMsg, setTestMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  const loadSettings = useCallback(() => {
    fetch('/api/config/backup')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data;
          setAutoBackup(d.auto_backup !== '0');
          setSchedule(d.schedule      || 'daily');
          setBackupTime(d.backup_time || '03:00');
          setRetention(d.retention    || '30');
          setStorage(d.storage        || 'local');
          setR2Account(d.r2_account_id || '');
          setR2Bucket(d.r2_bucket      || '');
          setR2Key(d.r2_access_key     || '');
          setR2Secret(d.r2_secret      || '');
          setFtpHost(d.ftp_host        || '');
          setFtpPort(d.ftp_port        || '21');
          setFtpUser(d.ftp_user        || '');
          setFtpPass(d.ftp_pass        || '');
          setFtpProtocol(d.ftp_protocol || (d.ftp_secure === '1' ? 'ftps' : 'ftp'));
          setFtpDir(d.ftp_dir          || '/backups');
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const loadHistory = useCallback(() => {
    fetch('/api/config/backups').then(r => r.json()).then(j => { if (j.success) setBackups(j.data); }).catch(() => {});
  }, []);

  useEffect(() => { loadSettings(); loadHistory(); }, [loadSettings, loadHistory]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const body: Record<string, string> = {
        auto_backup: autoBackup ? '1' : '0',
        schedule, backup_time: backupTime, retention, storage,
        r2_account_id: r2Account, r2_bucket: r2Bucket,
        ftp_host: ftpHost, ftp_port: ftpPort, ftp_user: ftpUser,
        ftp_protocol: ftpProtocol, ftp_secure: ftpProtocol === 'ftps' ? '1' : '0', ftp_dir: ftpDir,
      };
      // Only send secrets if changed (not the masked value containing ****)
      if (r2Key && !r2Key.includes('****')) body.r2_access_key = r2Key;
      if (r2Secret && !r2Secret.includes('****')) body.r2_secret = r2Secret;
      if (ftpPass && !ftpPass.includes('****')) body.ftp_pass = ftpPass;

      const res  = await fetch('/api/config/backup', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const testConnection = async () => {
    setTesting(true); setTestMsg(null);
    try {
      const j = await (await fetch('/api/config/backups/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storage }),
      })).json();
      setTestMsg({ ok: !!j.success, text: j.message || (j.success ? 'Connected.' : 'Failed.') });
    } catch { setTestMsg({ ok: false, text: 'Network error.' }); }
    finally { setTesting(false); }
  };

  const runBackup = async () => {
    setRunning(true); setError('');
    try {
      const j = await (await fetch('/api/config/backups', { method: 'POST' })).json();
      if (!j.success) setError(j.message || 'Backup failed.');
      loadHistory();
    } catch { setError('Network error during backup.'); }
    finally { setRunning(false); }
  };

  const doDelete = async () => {
    if (delId == null) return;
    const j = await (await fetch(`/api/config/backups/${delId}`, { method: 'DELETE' })).json();
    setDelId(null);
    if (j.success) loadHistory(); else setError(j.message || 'Delete failed.');
  };

  const doRestore = async () => {
    if (restoreId == null) return;
    setRestoring(true); setError('');
    try {
      const j = await (await fetch('/api/config/backups/restore', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: restoreId }),
      })).json();
      if (j.success) { setRestoreId(null); setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(j.message || 'Restore failed.');
    } catch { setError('Network error during restore.'); }
    finally { setRestoring(false); }
  };

  return (
    <>
      <Head><title>Backup & Restore — ATLINE Admin</title></Head>
      <ConfigLayout activeTab="backup">
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)' }}>
            <i className="bi bi-cloud-arrow-up-fill"></i>
          </div>
          <div>
            <h2 className="int-section-title">Backup & Restore</h2>
            <p className="int-section-sub">Configure backups, choose where they are stored, and restore from previous snapshots.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading settings...
          </div>
        ) : (
        <ReadOnlyGuard moduleKey="settings.config.backup">
        <form onSubmit={handleSave}>
          {saved  && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> Done.</div>}
          {error  && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}>{error}</div>}

          {/* Auto Backup */}
          <div className="int-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-clock-fill"></i> Automatic Backup</div>
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: 13, color: '#6b7280' }}>{autoBackup ? 'Enabled' : 'Disabled'}</span>
                <div className={`int-toggle ${autoBackup ? 'int-toggle-on' : ''}`} onClick={() => setAutoBackup(!autoBackup)}>
                  <div className="int-toggle-thumb"></div>
                </div>
              </div>
            </div>
            <FormRow label="Schedule">
              <select className="rm-input" style={{ maxWidth: 180 }} value={schedule} onChange={e => setSchedule(e.target.value)} disabled={!autoBackup}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </FormRow>
            <FormRow label="Backup Time" hint="Server time (UTC+8)">
              <input type="time" className="rm-input" style={{ maxWidth: 140 }} value={backupTime} onChange={e => setBackupTime(e.target.value)} disabled={!autoBackup} />
            </FormRow>
            <FormRow label="Retention Period" hint="Backups older than this are deleted" last>
              <div className="d-flex align-items-center gap-2">
                <input type="number" className="rm-input" style={{ maxWidth: 100 }} value={retention} onChange={e => setRetention(e.target.value)} min={1} max={365} />
                <span style={{ fontSize: 13, color: '#6b7280' }}>days</span>
              </div>
            </FormRow>
            <div className="int-info-note" style={{ marginTop: 4 }}>
              <i className="bi bi-info-circle-fill"></i>
              On cPanel/shared hosting, set a cron job to call the scheduled backup at your chosen time. Manual backups below work immediately.
            </div>
          </div>

          {/* Storage */}
          <div className="int-card">
            <div className="int-card-title"><i className="bi bi-hdd-fill"></i> Storage Destination</div>
            <FormRow label="Storage Type" last>
              <div className="d-flex gap-3 flex-wrap align-items-center">
                {[{ val: 'local', label: 'Local Storage', icon: 'bi-hdd' }, { val: 'r2', label: 'Cloudflare', icon: 'bi-cloud' }, { val: 'ftp', label: 'FTP/SFTP', icon: 'bi-server' }].map(opt => (
                  <label key={opt.val} className="int-radio-label">
                    <input type="radio" name="storage" value={opt.val} checked={storage === opt.val} onChange={() => { setStorage(opt.val); setTestMsg(null); }} />
                    <span><i className={`bi ${opt.icon} me-1`}></i>{opt.label}</span>
                  </label>
                ))}
                {storage !== 'local' && (
                  <button type="button" className="rm-btn-outline" style={{ fontSize: 12.5, padding: '6px 12px' }} onClick={testConnection} disabled={testing}>
                    {testing ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 12, height: 12, borderWidth: 2 }}></span>Testing…</> : <><i className="bi bi-plug"></i> Test Connection</>}
                  </button>
                )}
              </div>

              {testMsg && (
                <div className={`alert ${testMsg.ok ? 'alert-success' : 'alert-danger'} mt-3 mb-0`} style={{ fontSize: 12.5 }}>
                  <i className={`bi ${testMsg.ok ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'} me-1`}></i>{testMsg.text}
                </div>
              )}

              {storage === 'r2' && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="int-info-note" style={{ margin: 0 }}>
                    <i className="bi bi-info-circle-fill"></i>
                    Create an R2 bucket and an API token in your Cloudflare dashboard. Use the S3 API credentials below.
                  </div>
                  <input className="rm-input" value={r2Account} onChange={e => setR2Account(e.target.value)} placeholder="Account ID (e.g. a1b2c3d4...)" />
                  <input className="rm-input" value={r2Bucket} onChange={e => setR2Bucket(e.target.value)} placeholder="Bucket name (e.g. atline-backups)" />
                  <input className="rm-input" value={r2Key} onChange={e => setR2Key(e.target.value)} placeholder="R2 Access Key ID" />
                  <input type="password" className="rm-input" value={r2Secret} onChange={e => setR2Secret(e.target.value)} placeholder="R2 Secret Access Key" />
                </div>
              )}

              {storage === 'ftp' && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="d-flex gap-2 flex-wrap align-items-center">
                    <select className="rm-input" style={{ flex: '0 0 160px' }} value={ftpProtocol} onChange={e => {
                      const v = e.target.value; setFtpProtocol(v);
                      // auto-set the conventional default port when switching protocol
                      if (v === 'sftp' && (ftpPort === '21' || !ftpPort)) setFtpPort('22');
                      if (v !== 'sftp' && ftpPort === '22') setFtpPort('21');
                    }}>
                      <option value="ftp">FTP</option>
                      <option value="ftps">FTPS (FTP over TLS)</option>
                      <option value="sftp">SFTP (SSH)</option>
                    </select>
                    <input className="rm-input" style={{ flex: '2 1 200px' }} value={ftpHost} onChange={e => setFtpHost(e.target.value)} placeholder="Host / IP (e.g. 172.29.116.111)" />
                    <input className="rm-input" style={{ flex: '0 0 90px' }} value={ftpPort} onChange={e => setFtpPort(e.target.value)} placeholder="Port" />
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <input className="rm-input" style={{ flex: '1 1 200px' }} value={ftpUser} onChange={e => setFtpUser(e.target.value)} placeholder="Username" />
                    <input type="password" className="rm-input" style={{ flex: '1 1 200px' }} value={ftpPass} onChange={e => setFtpPass(e.target.value)} placeholder="Password" />
                  </div>
                  <input className="rm-input" value={ftpDir} onChange={e => setFtpDir(e.target.value)} placeholder="Remote directory (e.g. / or /backups)" />
                </div>
              )}
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
        </ReadOnlyGuard>
        )}

        {/* Manual Backup */}
        <div className="int-card">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-play-circle-fill"></i> Manual Backup</div>
            {canCreate && (
            <button className="rm-btn-primary" onClick={runBackup} disabled={running} style={{ fontSize: 12.5, padding: '7px 16px' }}>
              {running
                ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 13, height: 13, borderWidth: 2 }}></span>Creating backup…</>
                : <><i className="bi bi-cloud-arrow-up"></i> Run Backup Now</>}
            </button>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Creates an immediate full backup (database + uploaded files) and stores it at the selected destination.
          </p>

          {/* Backup history */}
          <div className="rm-table-wrap">
            <table className="rm-table" style={{ minWidth: 680 }}>
              <thead>
                <tr>
                  <th className="rm-th-module">#</th>
                  <th className="rm-th-module">Backup File</th>
                  <th className="rm-th-perm">Size</th>
                  <th className="rm-th-perm">Date</th>
                  <th className="rm-th-perm">Storage</th>
                  <th className="rm-th-perm">Type</th>
                  <th className="rm-th-perm">Status</th>
                  <th className="rm-th-perm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-archive" style={{ fontSize: 26, display: 'block', marginBottom: 8 }}></i>No backups yet. Run a backup to get started.</td></tr>
                ) : backups.map((b, i) => (
                  <tr key={b.id} className="rm-data-row">
                    <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                    <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12 }}>{b.file_name}{b.status === 'Failed' && b.note ? <div style={{ color: '#ef4444', fontSize: 11, fontFamily: 'inherit' }}>{b.note}</div> : null}</td>
                    <td className="rm-td-perm" style={{ fontSize: 12.5 }}>{humanSize(b.size_bytes)}</td>
                    <td className="rm-td-perm" style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmt(b.created_at, true)}</td>
                    <td className="rm-td-perm" style={{ fontSize: 12, color: '#6b7280' }}>{STORAGE_LABEL[b.storage] || b.storage}</td>
                    <td className="rm-td-perm">
                      <span style={{ background: b.type === 'Auto' ? '#eff6ff' : '#faf5ff', color: b.type === 'Auto' ? '#2563eb' : '#7c3aed', fontSize: 11, padding: '2px 9px', borderRadius: 12 }}>{b.type}</span>
                    </td>
                    <td className="rm-td-perm">
                      <span className={`badge-status ${b.status === 'Complete' ? 'badge-approved' : b.status === 'Running' ? 'badge-pending' : 'badge-rejected'}`}>{b.status}</span>
                    </td>
                    <td className="rm-td-perm">
                      <div className="d-flex gap-2 justify-content-center">
                        {b.status === 'Complete' && (
                          <>
                            {canExport && <a className="rm-action-btn rm-action-view" title="Download" href={`/api/config/backups/${b.id}?download=1`} target="_blank" rel="noreferrer"><i className="bi bi-download"></i></a>}
                            {canUpdate && <button className="rm-action-btn rm-action-edit" title="Restore" onClick={() => setRestoreId(b.id)}><i className="bi bi-arrow-counterclockwise"></i></button>}
                          </>
                        )}
                        {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDelId(b.id)}><i className="bi bi-trash-fill"></i></button>}
                        {!canExport && !canUpdate && !canDelete && <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Restore confirm */}
        {restoreId !== null && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Restore from Backup?</h3>
              <p>This overwrites the current database with the selected backup. This action cannot be undone.</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setRestoreId(null)} disabled={restoring}>Cancel</button>
                <button className="rm-btn-primary" onClick={doRestore} disabled={restoring}>
                  {restoring ? <><span className="spinner-border spinner-border-sm me-1"></span> Restoring…</> : <><i className="bi bi-arrow-counterclockwise"></i> Restore</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {delId !== null && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Backup?</h3>
              <p>This permanently removes the backup file from its storage location.</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setDelId(null)}>Cancel</button>
                <button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button>
              </div>
            </div>
          </div>
        )}
      </ConfigLayout>
    </>
  );
}
