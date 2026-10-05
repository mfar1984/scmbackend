'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

type Sound = { name: string; file: string; url: string };

const BUILTIN = { file: '', name: 'Default (built-in chime)' };

export default function NotificationSoundCard() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const j = await (await fetch('/api/config/sounds')).json();
      if (j.success) { setSounds(j.data || []); setSelected(j.selected || ''); }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Sound file too large (max 5MB).'); return; }
    setUploading(true); setError(''); setMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const j = await (await fetch('/api/config/sounds', { method: 'POST', body: fd })).json();
      if (j.success) { setMsg('Sound uploaded.'); load(); setTimeout(() => setMsg(''), 3000); }
      else setError(j.message || 'Upload failed.');
    } catch { setError('Network error during upload.'); }
    finally { setUploading(false); }
  };

  const remove = async (file: string) => {
    if (!confirm('Delete this sound?')) return;
    await fetch(`/api/config/sounds?file=${encodeURIComponent(file)}`, { method: 'DELETE' }).catch(() => {});
    load();
  };

  const preview = (url: string) => {
    try {
      if (audioRef.current) { audioRef.current.pause(); }
      const a = new Audio(url);
      audioRef.current = a;
      a.play().catch(() => setError('Could not play this sound in the browser.'));
    } catch { /* ignore */ }
  };

  // Built-in chime preview (Web Audio) — matches the topbar fallback.
  const previewBuiltin = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.14;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(start); osc.stop(start + 0.24);
      });
      setTimeout(() => ctx.close().catch(() => {}), 900);
    } catch { /* ignore */ }
  };

  const save = async () => {
    setSaving(true); setError(''); setMsg('');
    try {
      const j = await (await fetch('/api/config/branding', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notif_sound: selected }),
      })).json();
      if (j.success) { setMsg('Notification sound saved.'); setTimeout(() => setMsg(''), 3000); }
      else setError(j.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const Row = ({ file, name, url }: { file: string; name: string; url?: string }) => {
    const active = selected === file;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '11px 14px', border: `1px solid ${active ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: 10, background: active ? '#eff6ff' : '#fff',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1, minWidth: 0 }}>
          <input type="radio" name="notifSound" checked={active} onChange={() => setSelected(file)} style={{ accentColor: '#3b82f6' }} />
          <i className="bi bi-music-note-beamed" style={{ color: active ? '#3b82f6' : '#9ca3af' }}></i>
          <span style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </label>
        <div className="d-flex gap-2" style={{ flexShrink: 0 }}>
          <button type="button" className="rm-action-btn rm-action-view" title="Preview" onClick={() => url ? preview(url) : previewBuiltin()}>
            <i className="bi bi-play-fill"></i>
          </button>
          {file && (
            <button type="button" className="rm-action-btn rm-action-delete" title="Delete" onClick={() => remove(file)}>
              <i className="bi bi-trash-fill"></i>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="int-card">
      <div className="int-card-title"><i className="bi bi-bell-fill"></i> Notification Sound</div>
      <div className="int-info-note mb-3">
        <i className="bi bi-info-circle-fill"></i>
        Upload a sound to play when a new HR notification arrives in the admin bell. MP3, WAV, OGG or M4A (max 5MB).
      </div>

      {msg && <div className="rm-saved-banner mb-3"><i className="bi bi-check-circle-fill"></i> {msg}</div>}
      {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <span style={{ fontSize: 12.5, color: '#6b7280' }}>Choose the sound played on new notifications.</span>
        <label className="rm-btn-outline" style={{ cursor: uploading ? 'wait' : 'pointer', fontSize: 12.5, opacity: uploading ? 0.6 : 1 }}>
          {uploading ? <><span className="spinner-border spinner-border-sm me-1"></span> Uploading…</> : <><i className="bi bi-upload"></i> Upload Sound</>}
          <input type="file" accept=".mp3,.wav,.ogg,.m4a" style={{ display: 'none' }} disabled={uploading} onChange={upload} />
        </label>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: 13 }}><span className="spinner-border spinner-border-sm me-2"></span> Loading sounds…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row file={BUILTIN.file} name={BUILTIN.name} />
          {sounds.map(s => <Row key={s.file} file={s.file} name={s.name} url={s.url} />)}
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <button type="button" className="rm-btn-primary" onClick={save} disabled={saving}>
          {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-floppy-fill"></i> Save Sound</>}
        </button>
      </div>
    </div>
  );
}
