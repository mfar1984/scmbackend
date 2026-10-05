/**
 * React hook — fetches date/time config from API and returns formatter functions.
 * Client-side only. Does NOT import db directly.
 */

import { useState, useEffect, useCallback } from 'react';

type DateConfig = {
  dateFormat: string;
  timeFormat: string;
  timezone:   string;
};

const DEFAULT_CONFIG: DateConfig = {
  dateFormat: 'DD MMM YYYY',
  timeFormat: '12h',
  timezone:   'Asia/Kuala_Lumpur',
};

// Module-level cache — fetch once per browser session
let _cachedConfig: DateConfig | null = null;
let _fetchPromise: Promise<DateConfig> | null = null;

async function fetchConfig(): Promise<DateConfig> {
  if (_cachedConfig) return _cachedConfig;
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = fetch('/api/config/date-format')
    .then(r => r.json())
    .then(json => {
      _cachedConfig = json.success ? json.data : DEFAULT_CONFIG;
      _fetchPromise = null;
      return _cachedConfig!;
    })
    .catch(() => {
      _fetchPromise = null;
      return DEFAULT_CONFIG;
    });

  return _fetchPromise;
}

// ── Format helpers (pure functions, no DB) ──────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function _formatDate(date: Date | string | null | undefined, config: DateConfig, includeTime: boolean): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const day   = String(d.getDate()).padStart(2, '0');
  const month = d.getMonth();
  const year  = d.getFullYear();

  let datePart = '';
  switch (config.dateFormat) {
    case 'DD MMM YYYY':  datePart = `${day} ${MONTHS[month]} ${year}`; break;
    case 'DD/MM/YYYY':   datePart = `${day}/${String(month+1).padStart(2,'0')}/${year}`; break;
    case 'YYYY-MM-DD':   datePart = `${year}-${String(month+1).padStart(2,'0')}-${day}`; break;
    case 'MM/DD/YYYY':   datePart = `${String(month+1).padStart(2,'0')}/${day}/${year}`; break;
    default:             datePart = `${day} ${MONTHS[month]} ${year}`;
  }

  if (!includeTime) return datePart;

  const hours   = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  let timePart  = '';

  if (config.timeFormat === '24h') {
    timePart = `${String(hours).padStart(2,'0')}:${minutes}`;
  } else {
    const h    = hours % 12 || 12;
    const ampm = hours < 12 ? 'am' : 'pm';
    timePart   = `${h}:${minutes} ${ampm}`;
  }

  return `${datePart}, ${timePart}`;
}

// ── React hook ──────────────────────────────────────────────

export function useDateFormat() {
  const [config, setConfig] = useState<DateConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    fetchConfig().then(setConfig);
  }, []);

  const fmt = useCallback(
    (date: Date | string | null | undefined, includeTime = false) =>
      _formatDate(date, config, includeTime),
    [config]
  );

  const fmtTime = useCallback(
    (date: Date | string | null | undefined) => {
      if (!date) return '—';
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '—';
      const hours   = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      if (config.timeFormat === '24h') return `${String(hours).padStart(2,'0')}:${minutes}`;
      const h = hours % 12 || 12;
      return `${h}:${minutes} ${hours < 12 ? 'am' : 'pm'}`;
    },
    [config]
  );

  return { fmt, fmtTime, config };
}
