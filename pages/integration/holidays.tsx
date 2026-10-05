'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import IntegrationLayout from '../../components/IntegrationLayout';
import { useDateFormat } from '../../lib/useDateFormat';

type HolidayType = 'national' | 'regional' | 'custom';

type Holiday = {
  id: number;
  date: string;
  day_name: string;
  name: string;
  type: HolidayType;
  state_codes?: string | string[] | null;
};

type CustomHoliday = {
  id: number;
  start_date: string;
  end_date: string;
  name: string;
  state_codes?: string | null;
  notes?: string;
};

const MY_STATES: Record<string, string> = {
  '01': 'Johor',          '02': 'Kedah',          '03': 'Kelantan',
  '04': 'Melaka',         '05': 'Negeri Sembilan', '06': 'Pahang',
  '07': 'Pulau Pinang',   '08': 'Perak',           '09': 'Perlis',
  '10': 'Selangor',       '11': 'Terengganu',      '12': 'Sabah',
  '13': 'Sarawak',        '14': 'W.P. Kuala Lumpur', '15': 'W.P. Labuan',
  '16': 'W.P. Putrajaya',
};

function parseStateCodes(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

// Format date from DB — handles ISO string, Date object, or plain YYYY-MM-DD
function formatDate(raw: string | Date | null | undefined): string {
  if (!raw) return '';
  const s = typeof raw === 'string' ? raw : (raw as Date).toISOString();
  return s.slice(0, 10);
}

function TypeBadge({ type }: { type: HolidayType | string }) {
  if (type === 'national') return <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: 11, padding: '2px 9px', borderRadius: 12 }}>National</span>;
  if (type === 'regional') return <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 11, padding: '2px 9px', borderRadius: 12 }}>State</span>;
  return <span style={{ background: '#fef9c3', color: '#a16207', fontSize: 11, padding: '2px 9px', borderRadius: 12 }}>Custom</span>;
}

export default function HolidaysIntegrationPage() {
  const { fmt } = useDateFormat();
  const [year, setYear]           = useState(String(new Date().getFullYear()));
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter]   = useState('All');

  const [holidays, setHolidays]       = useState<Holiday[]>([]);
  const [customHols, setCustomHols]   = useState<CustomHoliday[]>([]);
  const [lastSync, setLastSync]       = useState('');
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [syncResult, setSyncResult]   = useState<{ synced: number; total: number; national: number; regional: number } | null>(null);
  const [syncError, setSyncError]     = useState('');
  const [clearing, setClearing]       = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Add modal
  const [addModal, setAddModal]   = useState(false);
  const [newDate, setNewDate]     = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newName, setNewName]     = useState('');
  const [newState, setNewState]   = useState('');
  const [newNotes, setNewNotes]   = useState('');
  const [addSaving, setAddSaving] = useState(false);

  // ── Fetch holidays from DB ──
  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year });
      if (stateFilter) params.set('state', stateFilter);

      const [pubRes, custRes] = await Promise.all([
        fetch(`/api/holidays?${params}`),
        fetch(`/api/holidays/custom?year=${year}`),
      ]);
      const pubJson  = await pubRes.json();
      const custJson = await custRes.json();

      if (pubJson.success)  { setHolidays(pubJson.data); setLastSync(pubJson.last_sync || ''); }
      if (custJson.success) setCustomHols(custJson.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [year, stateFilter]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  // ── Sync from date-holidays ──
  const handleSync = async () => {
    setSyncing(true); setSyncError(''); setSyncResult(null);
    try {
      const res  = await fetch('/api/holidays/sync', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          year:  parseInt(year),
          state: stateFilter || undefined, // pass selected state if any
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSyncResult({ synced: json.synced, total: json.total, national: json.national, regional: json.regional });
        // Refetch with current state filter applied
        await fetchHolidays();
        setLastSync(new Date().toISOString());
      } else {
        setSyncError(json.message || 'Sync failed.');
      }
    } catch {
      setSyncError('Network error. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // ── Clear holidays ──
  const handleClear = async () => {
    setClearing(true); setClearConfirm(false); setSyncResult(null); setSyncError('');
    try {
      const res  = await fetch('/api/holidays/clear', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ year: parseInt(year) }),
      });
      const json = await res.json();
      if (json.success) {
        setHolidays([]);
        setLastSync('');
      } else {
        setSyncError(json.message || 'Clear failed.');
      }
    } catch {
      setSyncError('Network error.');
    } finally {
      setClearing(false);
    }
  };
  const handleAddCustom = async () => {
    if (!newDate || !newName.trim()) return;
    setAddSaving(true);
    try {
      const res  = await fetch('/api/holidays/custom', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          start_date:  newDate,
          end_date:    newEndDate || newDate,
          name:        newName,
          state_codes: newState ? [newState] : null,
          notes:       newNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAddModal(false);
        setNewDate(''); setNewEndDate(''); setNewName(''); setNewState(''); setNewNotes('');
        fetchHolidays();
      }
    } catch { /* silent */ }
    finally { setAddSaving(false); }
  };

  // ── Delete public holiday ──
  const handleDeletePublic = async (id: number) => {
    await fetch(`/api/holidays?id=${id}`, { method: 'DELETE' });
    setHolidays(p => p.filter(h => h.id !== id));
  };

  // ── Delete custom holiday ──
  const handleDeleteCustom = async (id: number) => {
    await fetch(`/api/holidays/custom?id=${id}`, { method: 'DELETE' });
    setCustomHols(p => p.filter(h => h.id !== id));
  };

  // ── Combine & filter ──
  const allHolidays: (Holiday & { isCustom?: boolean })[] = [
    ...holidays,
    ...customHols.map(c => ({
      id:         c.id,
      date:       c.start_date,
      day_name:   new Date(formatDate(c.start_date)).toLocaleDateString('en-MY', { weekday: 'long' }),
      name:       c.name + (c.end_date !== c.start_date ? ` (until ${fmt(c.end_date)})` : ''),
      type:       'custom' as HolidayType,
      state_codes: c.state_codes,
      isCustom:   true,
    })),
  ].sort((a, b) => formatDate(a.date).localeCompare(formatDate(b.date)));

  const filtered = allHolidays.filter(h => {
    // Type filter
    if (typeFilter === 'National') return h.type === 'national';
    if (typeFilter === 'State')    return h.type === 'regional';
    if (typeFilter === 'Custom')   return h.type === 'custom';
    return true;
  });

  return (
    <>
      <Head><title>Public Holidays — ATLINE Admin</title></Head>
      <IntegrationLayout activeTab="holidays">

        {/* Header */}
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <i className="bi bi-calendar-event-fill"></i>
          </div>
          <div>
            <h2 className="int-section-title">Public Holidays</h2>
            <p className="int-section-sub">
              Manage Malaysian public holidays used by HR leave and payroll modules.
              Auto-synced using <strong>date-holidays</strong> library — no API key required.
            </p>
          </div>
        </div>

        {/* Sync Card */}
        <div className="int-card">
          <div className="int-card-title"><i className="bi bi-cloud-download-fill"></i> Auto-Sync Holidays</div>

          <div className="int-info-note mb-3">
            <i className="bi bi-info-circle-fill"></i>
            Uses the <strong>date-holidays</strong> npm package — covers all Malaysian national and state holidays.
            No external API or API key required.
          </div>

          <div className="d-flex gap-3 align-items-end flex-wrap mb-3">
            <div>
              <label style={{ fontSize: 12.5, color: '#6b7280', display: 'block', marginBottom: 6 }}>Year</label>
              <input
                className="rm-input"
                style={{ maxWidth: 110 }}
                value={year}
                onChange={e => setYear(e.target.value)}
                placeholder={String(new Date().getFullYear())}
              />
            </div>
            <div>
              <label style={{ fontSize: 12.5, color: '#6b7280', display: 'block', marginBottom: 6 }}>State Filter (optional)</label>
              <select className="rm-input" style={{ maxWidth: 220 }} value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
                <option value="">All States (National + Regional)</option>
                {Object.entries(MY_STATES).map(([code, name]) => (
                  <option key={code} value={code}>{name} ({code})</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="rm-btn-primary"
              onClick={handleSync}
              disabled={syncing || clearing}
              style={{ whiteSpace: 'nowrap' }}
            >
              {syncing
                ? <><span className="spinner-border spinner-border-sm me-1"></span>Syncing…</>
                : <><i className="bi bi-cloud-download"></i> Sync Now</>
              }
            </button>
            <button
              type="button"
              className="rm-btn-outline"
              onClick={() => setClearConfirm(true)}
              disabled={syncing || clearing}
              style={{ whiteSpace: 'nowrap', borderColor: '#ef4444', color: '#ef4444' }}
            >
              {clearing
                ? <><span className="spinner-border spinner-border-sm me-1"></span>Clearing…</>
                : <><i className="bi bi-trash-fill"></i> Clear {year}</>
              }
            </button>
          </div>

          {/* Sync result */}
          {syncResult && (
            <div className="int-test-success">
              <i className="bi bi-check-circle-fill"></i>
              Sync complete — <strong>{syncResult.total}</strong> holidays for {year}
              &nbsp;·&nbsp;<strong>{syncResult.national}</strong> national
              &nbsp;·&nbsp;<strong>{syncResult.regional}</strong> state-specific
            </div>
          )}
          {syncError && (
            <div className="int-test-error">
              <i className="bi bi-x-circle-fill"></i> {syncError}
            </div>
          )}

          {lastSync && (
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>
              <i className="bi bi-clock me-1"></i>
              Last synced: {fmt(lastSync, true)}
            </div>
          )}
        </div>

        {/* Holiday List */}
        <div className="int-card">
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div className="int-card-title" style={{ margin: 0 }}>
              <i className="bi bi-list-ul"></i> Holiday List — {year}
              {stateFilter && <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>({MY_STATES[stateFilter]})</span>}
            </div>
            <div className="d-flex gap-2">
              <select
                className="rm-input"
                style={{ width: 140, fontSize: 12.5 }}
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="National">National</option>
                <option value="State">State</option>
                <option value="Custom">Custom</option>
              </select>
              <button
                className="rm-btn-primary"
                style={{ fontSize: 12.5, padding: '7px 14px' }}
                onClick={() => setAddModal(true)}
              >
                <i className="bi bi-plus-lg"></i> Add Custom
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 13 }}>
              <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading holidays...
            </div>
          ) : (
            <>
              <div className="rm-table-wrap">
                <table className="rm-table">
                  <thead>
                    <tr>
                      <th className="rm-th-module" style={{ width: 40 }}>#</th>
                      <th className="rm-th-module">Date</th>
                      <th className="rm-th-module">Day</th>
                      <th className="rm-th-module">Holiday Name</th>
                      <th className="rm-th-perm">Type</th>
                      <th className="rm-th-perm">State(s)</th>
                      <th className="rm-th-perm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: 13 }}>
                          <i className="bi bi-calendar-x" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>
                          No holidays found. Click <strong>Sync Now</strong> to load holidays.
                        </td>
                      </tr>
                    ) : filtered.map((h, i) => {
                      const codes = parseStateCodes(h.state_codes);
                      return (
                        <tr key={`${h.type}-${h.id}`} className="rm-data-row">
                          <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                          <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 13, color: '#374151' }}>
                            {fmt(h.date)}
                          </td>
                          <td style={{ padding: '9px 16px', fontSize: 12.5, color: '#6b7280' }}>
                            {h.day_name || new Date(formatDate(h.date)).toLocaleDateString('en-MY', { weekday: 'long' })}
                          </td>
                          <td style={{ padding: '9px 16px', fontSize: 13, color: '#1f2937' }}>
                            {h.name}
                          </td>
                          <td className="rm-td-perm">
                            <TypeBadge type={h.type} />
                          </td>
                          <td className="rm-td-perm" style={{ fontSize: 12, color: '#6b7280' }}>
                            {codes.length > 0
                              ? codes.map(c => MY_STATES[c] || c).join(', ')
                              : <span style={{ color: '#d1d5db' }}>All</span>
                            }
                          </td>
                          <td className="rm-td-perm">
                            <button
                              className="rm-action-btn rm-action-delete"
                              title="Remove"
                              onClick={() => (h as any).isCustom ? handleDeleteCustom(h.id) : handleDeletePublic(h.id)}
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, fontSize: 12.5, color: '#6b7280' }}>
                {filtered.length} holiday{filtered.length !== 1 ? 's' : ''} listed
                {typeFilter === 'All' && ` · ${holidays.filter(h => h.type === 'national').length} national · ${holidays.filter(h => h.type === 'regional').length} state · ${customHols.length} custom`}
              </div>
            </>
          )}
        </div>

        {/* Add Custom Holiday Modal */}
        {addModal && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" onClick={e => e.stopPropagation()}>
              <div className="usr-modal-header">
                <div>
                  <p className="usr-modal-title">Add Custom Holiday</p>
                  <p className="usr-modal-sub">Add a company-specific or state holiday</p>
                </div>
                <button className="usr-modal-close" onClick={() => setAddModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="usr-modal-body">
                <div className="usr-form-row">
                  <label className="usr-form-label">Start Date <span>*</span></label>
                  <div className="usr-form-field">
                    <input type="date" className="rm-input" value={newDate} onChange={e => setNewDate(e.target.value)} />
                  </div>
                </div>
                <div className="usr-form-row">
                  <label className="usr-form-label">End Date</label>
                  <div className="usr-form-field">
                    <input type="date" className="rm-input" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} placeholder="Leave blank if single day" />
                    <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>Leave blank if single day</div>
                  </div>
                </div>
                <div className="usr-form-row">
                  <label className="usr-form-label">Holiday Name <span>*</span></label>
                  <div className="usr-form-field">
                    <input className="rm-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Hari Keputeraan Sultan Selangor" />
                  </div>
                </div>
                <div className="usr-form-row">
                  <label className="usr-form-label">State</label>
                  <div className="usr-form-field">
                    <select className="rm-input" value={newState} onChange={e => setNewState(e.target.value)}>
                      <option value="">All States (National)</option>
                      {Object.entries(MY_STATES).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="usr-form-row usr-form-row-last">
                  <label className="usr-form-label">Notes</label>
                  <div className="usr-form-field">
                    <input className="rm-input" value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Optional notes" />
                  </div>
                </div>
              </div>
              <div className="usr-modal-footer">
                <button className="rm-btn-outline" onClick={() => setAddModal(false)}>Cancel</button>
                <button className="rm-btn-primary" onClick={handleAddCustom} disabled={addSaving || !newDate || !newName.trim()}>
                  {addSaving
                    ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                    : <><i className="bi bi-plus-lg"></i> Add Holiday</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear Confirm Modal */}
        {clearConfirm && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon" style={{ background: '#fee2e2' }}>
                <i className="bi bi-trash-fill" style={{ color: '#ef4444' }}></i>
              </div>
              <h3>Clear Holiday Data?</h3>
              <p>
                This will permanently delete all <strong>{year}</strong> holiday records from the database.
                Custom holidays will also be removed.
              </p>
              <p style={{ fontSize: 12.5, color: '#9ca3af' }}>
                You can re-sync anytime using the Sync Now button.
              </p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setClearConfirm(false)}>Cancel</button>
                <button className="rm-btn-danger" onClick={handleClear}>
                  <i className="bi bi-trash-fill"></i> Clear {year} Data
                </button>
              </div>
            </div>
          </div>
        )}

      </IntegrationLayout>
    </>
  );
}
