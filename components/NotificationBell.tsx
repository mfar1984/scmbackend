'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';

type Notif = {
  id: number; type: string; title: string; message: string; link: string | null;
  reference_no: string | null; actor: string | null; is_read: number; created_at: string;
};

const TYPE_ICON: Record<string, string> = {
  leave: 'bi-calendar-check-fill', claim: 'bi-receipt',
  overtime: 'bi-clock-history', expense: 'bi-wallet2',
};
const TYPE_COLOR: Record<string, string> = {
  leave: '#3b82f6', claim: '#8b5cf6', overtime: '#f59e0b', expense: '#16a34a',
};

function timeAgo(ts: string): string {
  const d = new Date(ts).getTime();
  if (isNaN(d)) return '';
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Build a short notification "ping" sound with the Web Audio API (no asset needed).
function playPing() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [880, 1320];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(start); osc.stop(start + 0.24);
    });
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch { /* ignore */ }
}

export default function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const prevUnread = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const soundUrl = useRef<string>('');

  // Load the configured notification sound once.
  useEffect(() => {
    fetch('/api/config/sounds').then(r => r.json()).then(j => {
      if (j.success && j.selected) soundUrl.current = `/api/public/asset/sounds/${j.selected}`;
    }).catch(() => {});
  }, []);

  const playSound = useCallback(() => {
    if (soundUrl.current) {
      try { const a = new Audio(soundUrl.current); a.play().catch(() => playPing()); return; }
      catch { /* fall through */ }
    }
    playPing();
  }, []);

  const load = useCallback(async (playOnIncrease = false) => {
    try {
      const j = await (await fetch('/api/notifications')).json();
      if (!j.success) return;
      setItems(j.data || []);
      const u = Number(j.unread || 0);
      if (playOnIncrease && prevUnread.current !== null && u > prevUnread.current) playSound();
      prevUnread.current = u;
      setUnread(u);
      // Broadcast counts so the sidebar can show per-section badges.
      window.dispatchEvent(new CustomEvent('atline:notif-counts', { detail: j.counts || {} }));
    } catch { /* silent */ }
  }, [playSound]);

  // Keep the latest load/playSound in refs so the SSE effect can run once
  // (stable, empty deps) without reconnecting on every render.
  const loadRef = useRef(load);
  const playRef = useRef(playSound);
  useEffect(() => { loadRef.current = load; playRef.current = playSound; }, [load, playSound]);

  // Live updates via SSE — pushes within ~3s of a new submission, no refresh.
  useEffect(() => {
    loadRef.current(); // initial snapshot (no sound)

    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => loadRef.current(true), 20000);
    };

    try {
      es = new EventSource('/api/notifications/stream');
      es.addEventListener('update', (ev: MessageEvent) => {
        let isNew = false;
        try { isNew = !!JSON.parse(ev.data)?.isNew; } catch { /* ignore */ }
        // Refresh the list; play the sound when a genuinely new item arrived.
        loadRef.current().then(() => { if (isNew) playRef.current(); });
      });
      es.onerror = () => {
        // Connection dropped (proxy/timeout) — fall back to polling.
        if (stopped) return;
        es?.close();
        startPolling();
      };
    } catch {
      startPolling();
    }

    return () => {
      stopped = true;
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) }).catch(() => {});
    load();
  };

  const openItem = async (n: Notif) => {
    if (!n.is_read) {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }) }).catch(() => {});
    }
    setOpen(false);
    load();
    if (n.link) router.push(n.link);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button className="topbar-btn" title="Notifications" onClick={() => setOpen(o => !o)}>
        <i className="bi bi-bell"></i>
        {unread > 0 && <span className="topbar-notif-dot"></span>}
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, padding: '0 4px',
            background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff',
          }}>{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 360, maxWidth: '90vw',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,.16)', zIndex: 1000, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>Notifications {unread > 0 && <span style={{ color: '#ef4444' }}>({unread})</span>}</span>
            {unread > 0 && <button onClick={markAll} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12.5, cursor: 'pointer' }}>Mark all read</button>}
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#9ca3af', fontSize: 13 }}>
                <i className="bi bi-bell-slash" style={{ fontSize: 24, display: 'block', marginBottom: 8 }}></i>
                No notifications yet.
              </div>
            ) : items.map(n => (
              <div key={n.id} onClick={() => openItem(n)} style={{
                display: 'flex', gap: 11, padding: '12px 16px', cursor: 'pointer',
                borderBottom: '1px solid #f6f8fb', background: n.is_read ? '#fff' : '#f5f9ff',
                transition: 'background .15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#eef4ff')}
                onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? '#fff' : '#f5f9ff')}
              >
                <div style={{
                  width: 34, height: 34, flexShrink: 0, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${TYPE_COLOR[n.type] || '#64748b'}1a`, color: TYPE_COLOR[n.type] || '#64748b',
                }}>
                  <i className={`bi ${TYPE_ICON[n.type] || 'bi-bell-fill'}`}></i>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#1f2937', fontWeight: n.is_read ? 400 : 600 }}>{n.title}</div>
                  <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.4, marginTop: 1 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{timeAgo(n.created_at)}</div>
                </div>
                {!n.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: 6 }}></span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
