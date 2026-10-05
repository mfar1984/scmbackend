/**
 * Date/Time formatting helper
 * Reads date_format and time_format from config_settings (general module)
 * and formats dates consistently across all pages.
 */

import db from './db';

type DateConfig = {
  dateFormat: string;  // e.g. 'DD MMM YYYY'
  timeFormat: string;  // '12h' | '24h'
  timezone:   string;  // e.g. 'Asia/Kuala_Lumpur'
};

// Cache config in memory (refreshed on each server restart)
let _config: DateConfig | null = null;

export async function getDateConfig(): Promise<DateConfig> {
  if (_config) return _config;

  try {
    const rows = await db('config_settings')
      .where({ module: 'general' })
      .whereIn('key', ['date_format', 'time_format', 'timezone'])
      .select('key', 'value');

    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value || '';

    _config = {
      dateFormat: map.date_format || 'DD MMM YYYY',
      timeFormat: map.time_format || '12h',
      timezone:   map.timezone    || 'Asia/Kuala_Lumpur',
    };
  } catch {
    _config = {
      dateFormat: 'DD MMM YYYY',
      timeFormat: '12h',
      timezone:   'Asia/Kuala_Lumpur',
    };
  }

  return _config;
}

// Clear cache — call this after saving general config
export function clearDateConfigCache() {
  _config = null;
}

/**
 * Format a date value using the configured format.
 * Works on both server (API routes) and client (pass config explicitly).
 *
 * @param date   - Date object, ISO string, or MySQL datetime string
 * @param config - DateConfig (from getDateConfig() or API response)
 * @param includeTime - Whether to append time
 */
export function formatDate(
  date: Date | string | null | undefined,
  config: DateConfig,
  includeTime = false
): string {
  if (!date) return '—';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  // Format date part
  const day   = String(d.getDate()).padStart(2, '0');
  const month = d.getMonth(); // 0-indexed
  const year  = d.getFullYear();

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  let datePart = '';
  switch (config.dateFormat) {
    case 'DD MMM YYYY':
      datePart = `${day} ${MONTHS[month]} ${year}`;
      break;
    case 'DD/MM/YYYY':
      datePart = `${day}/${String(month + 1).padStart(2, '0')}/${year}`;
      break;
    case 'YYYY-MM-DD':
      datePart = `${year}-${String(month + 1).padStart(2, '0')}-${day}`;
      break;
    case 'MM/DD/YYYY':
      datePart = `${String(month + 1).padStart(2, '0')}/${day}/${year}`;
      break;
    default:
      datePart = `${day} ${MONTHS[month]} ${year}`;
  }

  if (!includeTime) return datePart;

  // Format time part
  const hours   = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');

  let timePart = '';
  if (config.timeFormat === '24h') {
    timePart = `${String(hours).padStart(2, '0')}:${minutes}`;
  } else {
    const h   = hours % 12 || 12;
    const ampm = hours < 12 ? 'am' : 'pm';
    timePart = `${h}:${minutes} ${ampm}`;
  }

  return `${datePart}, ${timePart}`;
}

/**
 * Format time only
 */
export function formatTime(
  date: Date | string | null | undefined,
  config: DateConfig
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const hours   = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');

  if (config.timeFormat === '24h') {
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  const h    = hours % 12 || 12;
  const ampm = hours < 12 ? 'am' : 'pm';
  return `${h}:${minutes} ${ampm}`;
}
