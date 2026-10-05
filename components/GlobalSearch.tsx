'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { NAV } from './Sidebar';
import { usePermissions } from '../lib/usePermissions';

type SearchEntry = {
  label: string;     // "Global Config"
  group: string;     // "Settings"
  section: string;   // "Application" / "Human Resources" / "Web Tools" / ""
  icon: string;      // bootstrap icon class
  href: string;
  permKey?: string;
};

/**
 * Flatten the sidebar NAV into a searchable list of leaf pages.
 * (Group rows that have children become section labels, not search hits.)
 */
function buildIndex(): SearchEntry[] {
  const out: SearchEntry[] = [];
  for (const sec of NAV) {
    if (sec.divider) continue;
    const sectionLabel = sec.section || '';
    for (const item of sec.items || []) {
      // Top-level direct page (e.g. Dashboard, Tender Management)
      if (item.href && (!item.children || item.children.length === 0)) {
        out.push({ label: item.label, group: '', section: sectionLabel, icon: item.icon, href: item.href, permKey: item.permKey });
        continue;
      }
      // Group with children
      for (const c of item.children || []) {
        if (c.children && c.children.length) {
          for (const cc of c.children) {
            if (cc.href) out.push({ label: cc.label, group: `${item.label} · ${c.label}`, section: sectionLabel, icon: item.icon, href: cc.href, permKey: cc.permKey });
          }
        } else if (c.href) {
          out.push({ label: c.label, group: item.label, section: sectionLabel, icon: item.icon, href: c.href, permKey: c.permKey });
        }
      }
    }
  }
  return out;
}

const INDEX = buildIndex();

type Props = { open: boolean; onClose: () => void };

export default function GlobalSearch({ open, onClose }: Props) {
  const router = useRouter();
  const { canAccess, loaded } = usePermissions();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      // Focus next tick so the input exists in the DOM
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Permission-filtered index
  const visible = useMemo(() => {
    if (!loaded) return INDEX;
    return INDEX.filter(e => !e.permKey || canAccess(e.permKey));
  }, [loaded, canAccess]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return visible.slice(0, 30);
    const out: { entry: SearchEntry; score: number }[] = [];
    for (const e of visible) {
      const hay = `${e.label} ${e.group} ${e.section} ${e.href}`.toLowerCase();
      if (!hay.includes(term)) continue;
      // Higher score = better match. Label start > label contains > anywhere.
      let score = 0;
      const lbl = e.label.toLowerCase();
      if (lbl === term) score = 1000;
      else if (lbl.startsWith(term)) score = 500;
      else if (lbl.includes(term)) score = 200;
      else score = 50;
      out.push({ entry: e, score });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 30).map(x => x.entry);
  }, [q, visible]);

  // Clamp active index when results change
  useEffect(() => { setActive(0); }, [q]);

  if (!open) return null;

  const go = (href: string) => { onClose(); router.push(href); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      const r = results[active];
      if (r) go(r.href);
    }
  };

  return (
    <div className="gs-overlay" onClick={onClose}>
      <div className="gs-modal" onClick={e => e.stopPropagation()}>
        <div className="gs-input-wrap">
          <i className="bi bi-search gs-input-icon"></i>
          <input
            ref={inputRef}
            className="gs-input"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search pages, modules, settings…"
          />
          <kbd className="gs-kbd">Esc</kbd>
        </div>

        <div className="gs-results">
          {results.length === 0 ? (
            <div className="gs-empty">
              <i className="bi bi-search"></i>
              <p>No matches{q ? ` for "${q}"` : ''}.</p>
            </div>
          ) : results.map((r, i) => (
            <div
              key={`${r.href}-${r.label}`}
              className={`gs-row ${i === active ? 'active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r.href)}
              role="button"
              tabIndex={0}
            >
              <div className="gs-row-icon"><i className={`bi ${r.icon}`}></i></div>
              <div className="gs-row-text">
                <div className="gs-row-title">{r.label}</div>
                <div className="gs-row-sub">
                  {[r.section, r.group].filter(Boolean).join(' · ') || r.href}
                </div>
              </div>
              <i className="bi bi-arrow-return-left gs-row-go"></i>
            </div>
          ))}
        </div>

        <div className="gs-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
