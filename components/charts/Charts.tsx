'use client';
// Lightweight pure-SVG charts — no external dependencies.
// DonutChart, BarChart, LineChart. Responsive via viewBox.

import { useState } from 'react';

/* ── Donut / Pie ── */
export function DonutChart({ data, size = 160, thickness = 22, centerLabel, centerValue }: {
  data: { label: string; value: number; color: string }[];
  size?: number; thickness?: number; centerLabel?: string; centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="d-flex align-items-center gap-3 flex-wrap">
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef2f7" strokeWidth={thickness} />
          {total > 0 && data.map((d, i) => {
            const frac = d.value / total;
            const dash = frac * circ;
            const seg = (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
                strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        {(centerValue || centerLabel) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {centerValue && <div style={{ fontSize: 24, fontWeight: 600, color: '#1f2937' }}>{centerValue}</div>}
            {centerLabel && <div style={{ fontSize: 11, color: '#9ca3af' }}>{centerLabel}</div>}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        {data.map((d, i) => (
          <div key={i} className="d-flex align-items-center justify-content-between" style={{ padding: '3px 0', fontSize: 12.5 }}>
            <span className="d-flex align-items-center gap-2" style={{ color: '#6b7280' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, display: 'inline-block' }}></span>{d.label}
            </span>
            <span style={{ color: '#1f2937', fontWeight: 500 }}>{d.value}</span>
          </div>
        ))}
        {total === 0 && <div style={{ fontSize: 12, color: '#9ca3af' }}>No data</div>}
      </div>
    </div>
  );
}

/* ── Vertical Bar Chart ── */
export function BarChart({ data, height = 180, color = '#3b82f6', valuePrefix = '' }: {
  data: { label: string; value: number }[]; height?: number; color?: string; valuePrefix?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map(d => d.value));
  const barH = height - 36;
  return (
    <div>
      <div className="d-flex align-items-end justify-content-between" style={{ height, gap: 8 }}>
        {data.map((d, i) => {
          const h = (d.value / max) * barH;
          return (
            <div key={i} className="d-flex flex-column align-items-center" style={{ flex: 1, minWidth: 0 }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <div style={{ height: barH, display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'center', position: 'relative' }}>
                {hover === i && (
                  <div style={{ position: 'absolute', top: -2, transform: 'translateY(-100%)', background: '#1f2937', color: '#fff', fontSize: 11, padding: '3px 7px', borderRadius: 5, whiteSpace: 'nowrap', zIndex: 2 }}>
                    {valuePrefix}{d.value.toLocaleString()}
                  </div>
                )}
                <div style={{ width: '70%', maxWidth: 38, height: Math.max(2, h), background: color, borderRadius: '5px 5px 0 0', opacity: hover === null || hover === i ? 1 : 0.55, transition: 'opacity .15s' }}></div>
              </div>
              <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 6, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Line Chart ── */
export function LineChart({ data, height = 180, color = '#3b82f6', valuePrefix = '' }: {
  data: { label: string; value: number }[]; height?: number; color?: string; valuePrefix?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 600; const padX = 10; const padY = 16;
  const max = Math.max(1, ...data.map(d => d.value));
  const min = Math.min(0, ...data.map(d => d.value));
  const range = max - min || 1;
  const plotW = w - padX * 2; const plotH = height - padY * 2 - 18;
  const pts = data.map((d, i) => {
    const x = padX + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
    const y = padY + plotH - ((d.value - min) / range) * plotH;
    return { x, y, d };
  });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${path} L ${pts[pts.length - 1]?.x.toFixed(1)} ${(padY + plotH).toFixed(1)} L ${pts[0]?.x.toFixed(1)} ${(padY + plotH).toFixed(1)} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {pts.length > 0 && <path d={area} fill="url(#lc-grad)" />}
        {pts.length > 0 && <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle cx={p.x} cy={p.y} r={hover === i ? 5 : 3.5} fill="#fff" stroke={color} strokeWidth={2} />
            <rect x={p.x - 20} y={0} width={40} height={height} fill="transparent" />
            {hover === i && (
              <g>
                <rect x={p.x - 26} y={p.y - 30} width={52} height={20} rx={5} fill="#1f2937" />
                <text x={p.x} y={p.y - 16} textAnchor="middle" fill="#fff" fontSize="11">{valuePrefix}{p.d.value.toLocaleString()}</text>
              </g>
            )}
          </g>
        ))}
        {pts.map((p, i) => (
          <text key={`l${i}`} x={p.x} y={height - 2} textAnchor="middle" fill="#9ca3af" fontSize="10.5">{p.d.label}</text>
        ))}
      </svg>
    </div>
  );
}
