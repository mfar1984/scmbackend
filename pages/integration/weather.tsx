'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import IntegrationLayout from '../../components/IntegrationLayout';
import { useDateFormat } from '../../lib/useDateFormat';

function FormRow({ label, hint, last, children }: {
  label: string; hint?: string; last?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`usr-form-row ${last ? 'usr-form-row-last' : ''}`}>
      <div className="usr-form-label" style={{ paddingTop: 8 }}>
        <div>{label}</div>
        {hint && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 2 }}>{hint}</div>}
      </div>
      <div className="usr-form-field">{children}</div>
    </div>
  );
}

type WeatherPreview = {
  city: string;
  country: string;
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string | null;
  wind_speed: number;
  unit: string;
};

// Map OpenWeatherMap icon code to Bootstrap icon + color
function weatherIcon(icon: string | null, description: string): { icon: string; color: string } {
  if (!icon && !description) return { icon: 'bi-cloud', color: '#94a3b8' };
  const d = description.toLowerCase();
  if (d.includes('thunder'))                    return { icon: 'bi-cloud-lightning-rain-fill', color: '#7c3aed' };
  if (d.includes('drizzle') || d.includes('rain')) return { icon: 'bi-cloud-rain-fill',       color: '#3b82f6' };
  if (d.includes('snow'))                       return { icon: 'bi-cloud-snow-fill',           color: '#93c5fd' };
  if (d.includes('mist') || d.includes('fog') || d.includes('haze')) return { icon: 'bi-cloud-fog2-fill', color: '#94a3b8' };
  if (d.includes('clear'))                      return { icon: 'bi-sun-fill',                  color: '#f59e0b' };
  if (d.includes('few clouds') || d.includes('partly')) return { icon: 'bi-cloud-sun-fill',   color: '#f59e0b' };
  return { icon: 'bi-cloud-fill', color: '#64748b' };
}

export default function WeatherIntegrationPage() {
  const { fmt, fmtTime } = useDateFormat();
  const [enabled, setEnabled]     = useState(false);
  const [provider, setProvider]   = useState('openweathermap');
  const [apiKey, setApiKey]       = useState('');
  const [city, setCity]           = useState('Petaling Jaya');
  const [countryCode, setCountry] = useState('MY');
  const [units, setUnits]         = useState('metric');

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const [showKey, setShowKey]   = useState(false);

  const [testing, setTesting]           = useState(false);
  const [testError, setTestError]       = useState('');
  const [preview, setPreview]           = useState<WeatherPreview | null>(null);

  // ── Tides state ──
  const [tidesEnabled, setTidesEnabled]   = useState(false);
  const [tidesApiKey, setTidesApiKey]     = useState('');
  const [tidesLocation, setTidesLocation] = useState('Pelabuhan Kelang');
  const [showTidesKey, setShowTidesKey]   = useState(false);
  const [tidesSyncing, setTidesSyncing]   = useState(false);
  const [tidesError, setTidesError]       = useState('');
  const [tidesPreview, setTidesPreview]   = useState<any>(null);

  // ── Load settings from DB ──
  useEffect(() => {
    fetch('/api/integration/weather')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data;
          setEnabled(d.enabled      === '1');
          setProvider(d.provider    || 'openweathermap');
          setApiKey(d.api_key       || '');
          setCity(d.city            || 'Petaling Jaya');
          setCountry(d.country_code || 'MY');
          setUnits(d.units          || 'metric');
          // Tides
          setTidesEnabled(d.tides_enabled === '1');
          setTidesApiKey(d.tides_api_key  || '');
          setTidesLocation(d.tides_location || 'Pelabuhan Kelang');
          // Load last synced tides data if any
          if (d.tides_data) {
            try { setTidesPreview(JSON.parse(d.tides_data)); } catch { /* ignore */ }
          }
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Save settings to DB ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res  = await fetch('/api/integration/weather', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          enabled:        enabled ? '1' : '0',
          provider,
          api_key:        apiKey,
          city,
          country_code:   countryCode,
          units,
          tides_enabled:  tidesEnabled ? '1' : '0',
          tides_api_key:  tidesApiKey,
          tides_location: tidesLocation,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(json.message || 'Failed to save.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Tides sync ──
  const handleTidesSync = async () => {
    setTidesSyncing(true); setTidesError(''); setTidesPreview(null);
    try {
      const res  = await fetch('/api/integration/tides-test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        setTidesPreview(json.data);
      } else {
        setTidesError(json.message || 'Sync failed.');
      }
    } catch {
      setTidesError('Network error. Please try again.');
    } finally {
      setTidesSyncing(false);
    }
  };

  // ── Test connection ──
  const handleTest = async () => {
    setTesting(true); setTestError(''); setPreview(null);
    try {
      const res  = await fetch('/api/integration/weather-test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        setPreview(json.data);
      } else {
        setTestError(json.message || 'Connection failed.');
      }
    } catch {
      setTestError('Network error. Please try again.');
    } finally {
      setTesting(false);
    }
  };

  const providerLabel: Record<string, string> = {
    openweathermap: 'OpenWeatherMap',
    weatherapi:     'WeatherAPI.com',
    accuweather:    'AccuWeather',
    openmeteo:      'Open-Meteo (Free)',
  };

  return (
    <>
      <Head><title>Weather Integration — ATLINE Admin</title></Head>
      <IntegrationLayout activeTab="weather">

        {/* Header */}
        <div className="int-section-header">
          <div className="int-section-icon" style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)' }}>
            <i className="bi bi-cloud-sun-fill"></i>
          </div>
          <div>
            <h2 className="int-section-title">Weather Integration</h2>
            <p className="int-section-sub">
              Configure weather data API for dashboard widgets and field operations.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {saved && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> Weather settings saved successfully.</div>}
            {error && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}><i className="bi bi-exclamation-circle-fill me-2"></i>{error}</div>}

            {/* Weather API Config */}
            <div className="int-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="int-card-title" style={{ margin: 0 }}>
                  <i className="bi bi-cloud-fill"></i> Weather API
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{enabled ? 'Enabled' : 'Disabled'}</span>
                  <div className={`int-toggle ${enabled ? 'int-toggle-on' : ''}`} onClick={() => setEnabled(!enabled)}>
                    <div className="int-toggle-thumb"></div>
                  </div>
                </div>
              </div>

              <FormRow label="Provider" hint="Select your weather data provider">
                <select className="rm-input" value={provider} onChange={e => setProvider(e.target.value)}>
                  <option value="openweathermap">OpenWeatherMap</option>
                  <option value="weatherapi">WeatherAPI.com</option>
                  <option value="openmeteo">Open-Meteo (Free — no API key needed)</option>
                </select>
              </FormRow>

              {provider !== 'openmeteo' && (
                <FormRow
                  label="API Key"
                  hint={
                    provider === 'openweathermap'
                      ? 'Get free key at openweathermap.org/api'
                      : 'Get free key at weatherapi.com'
                  }
                >
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showKey ? 'text' : 'password'}
                      className="rm-input"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="Enter API key"
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setShowKey(!showKey)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15,
                    }}>
                      <i className={`bi ${showKey ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </FormRow>
              )}

              {provider === 'openmeteo' && (
                <div className="int-info-note mb-3">
                  <i className="bi bi-info-circle-fill"></i>
                  Open-Meteo is completely free and requires no API key. Just set your city and country below.
                </div>
              )}

              <FormRow label="Default City" hint="City name for weather display">
                <input
                  className="rm-input"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Petaling Jaya"
                />
              </FormRow>

              <FormRow label="Country Code" hint="ISO 2-letter country code">
                <input
                  className="rm-input"
                  style={{ maxWidth: 100 }}
                  value={countryCode}
                  onChange={e => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="MY"
                  maxLength={2}
                />
              </FormRow>

              <FormRow label="Units" last>
                <div className="d-flex gap-3">
                  {[
                    { val: 'metric',   label: 'Metric (°C, km/h)' },
                    { val: 'imperial', label: 'Imperial (°F, mph)' },
                  ].map(opt => (
                    <label key={opt.val} className="int-radio-label">
                      <input
                        type="radio"
                        name="units"
                        value={opt.val}
                        checked={units === opt.val}
                        onChange={() => setUnits(opt.val)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </FormRow>
            </div>

            {/* Test Connection */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-wifi"></i> Test Connection</div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                Fetch live weather data using your saved settings to verify the connection.
              </p>

              <div className="d-flex align-items-center gap-3 mb-3">
                <button
                  type="button"
                  className="rm-btn-outline"
                  onClick={handleTest}
                  disabled={testing}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {testing
                    ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 13, height: 13, borderWidth: 2 }}></span>Fetching…</>
                    : <><i className="bi bi-cloud-download"></i> Fetch Weather Now</>
                  }
                </button>
                <span style={{ fontSize: 12.5, color: '#9ca3af' }}>
                  Will fetch weather for <strong>{city}, {countryCode}</strong> using <strong>{providerLabel[provider] || provider}</strong>
                </span>
              </div>

              {/* Error */}
              {testError && (
                <div className="int-test-error">
                  <i className="bi bi-x-circle-fill"></i> {testError}
                </div>
              )}

              {/* Weather Preview Card */}
              {preview && (
                <div style={{
                  background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                  borderRadius: 12,
                  padding: '20px 24px',
                  color: '#ffffff',
                  marginTop: 8,
                }}>
                  {/* Top row */}
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 2 }}>
                        <i className="bi bi-geo-alt-fill me-1"></i>
                        {preview.city}{preview.country ? `, ${preview.country}` : ''}
                      </div>
                      <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 4 }}>
                        {preview.temp}{preview.unit}
                      </div>
                      <div style={{ fontSize: 14, opacity: 0.9, textTransform: 'capitalize' }}>
                        {preview.description}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <i
                        className={`bi ${weatherIcon(preview.icon, preview.description).icon}`}
                        style={{ fontSize: 56, opacity: 0.9 }}
                      ></i>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: '1px solid rgba(255,255,255,0.2)',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>
                        <i className="bi bi-thermometer-half me-1"></i>Feels Like
                      </div>
                      <div style={{ fontSize: 16 }}>{preview.feels_like}{preview.unit}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>
                        <i className="bi bi-droplet-fill me-1"></i>Humidity
                      </div>
                      <div style={{ fontSize: 16 }}>{preview.humidity}%</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>
                        <i className="bi bi-wind me-1"></i>Wind
                      </div>
                      <div style={{ fontSize: 16 }}>
                        {preview.wind_speed} {units === 'imperial' ? 'mph' : 'km/h'}
                      </div>
                    </div>
                  </div>

                  {/* Success note */}
                  <div style={{
                    marginTop: 14,
                    fontSize: 11.5,
                    opacity: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <i className="bi bi-check-circle-fill"></i>
                    Connection successful · {providerLabel[provider] || provider}
                  </div>
                </div>
              )}
            </div>

            {/* ── Tides Section ── */}
            <div className="int-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="int-card-title" style={{ margin: 0 }}>
                  <i className="bi bi-water"></i> Tides (WorldTides API)
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{tidesEnabled ? 'Enabled' : 'Disabled'}</span>
                  <div className={`int-toggle ${tidesEnabled ? 'int-toggle-on' : ''}`} onClick={() => setTidesEnabled(!tidesEnabled)}>
                    <div className="int-toggle-thumb"></div>
                  </div>
                </div>
              </div>

              <div className="int-info-note mb-3">
                <i className="bi bi-info-circle-fill"></i>
                Uses <a href="https://www.worldtides.info" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>WorldTides API</a> — accurate tidal data for all Malaysian coastal locations.
                Get your API key at <a href="https://www.worldtides.info/developer" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>worldtides.info/developer</a>.
              </div>

              <FormRow label="WorldTides API Key" hint="Your WorldTides API key">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showTidesKey ? 'text' : 'password'}
                    className="rm-input"
                    value={tidesApiKey}
                    onChange={e => setTidesApiKey(e.target.value)}
                    placeholder="Enter WorldTides API key"
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowTidesKey(!showTidesKey)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15,
                  }}>
                    <i className={`bi ${showTidesKey ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </FormRow>

              <FormRow label="Default Location" hint="Malaysian coastal location for tidal data" last>
                <select className="rm-input" value={tidesLocation} onChange={e => setTidesLocation(e.target.value)}>
                  <optgroup label="Semenanjung — West Coast">
                    {['Pulau Langkawi','Pulau Pinang','Lumut','Pelabuhan Kelang','Tanjung Keling','Kukup'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Semenanjung — East Coast">
                    {['Johor Bahru','Tanjung Sedili','Pulau Tioman','Tanjung Gelang','Cendering','Geting'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Sarawak">
                    {['Pulau Lakei','Sejingkat','Bintulu','Miri'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Sabah & Labuan">
                    {['Kota Kinabalu','Kudat','Sandakan','Lahad Datu','Tawau','Labuan'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </optgroup>
                </select>
              </FormRow>
            </div>

            {/* Tides Test */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-arrow-repeat"></i> Sync Tides Data</div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                Fetch tidal extremes (high/low tides) for the next 3 days from WorldTides API.
              </p>

              <div className="d-flex align-items-center gap-3 mb-3">
                <button
                  type="button"
                  className="rm-btn-outline"
                  onClick={handleTidesSync}
                  disabled={tidesSyncing}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {tidesSyncing
                    ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 13, height: 13, borderWidth: 2 }}></span>Syncing…</>
                    : <><i className="bi bi-arrow-repeat"></i> Sync Now</>
                  }
                </button>
                <span style={{ fontSize: 12.5, color: '#9ca3af' }}>
                  Will fetch 3-day tidal data for <strong>{tidesLocation}</strong>
                </span>
              </div>

              {tidesError && (
                <div className="int-test-error mb-3">
                  <i className="bi bi-x-circle-fill"></i> {tidesError}
                </div>
              )}

              {/* Tides Preview */}
              {tidesPreview && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #0891b2, #0e7490)',
                    padding: '14px 20px',
                    color: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: 15 }}>
                        <i className="bi bi-geo-alt-fill me-2"></i>
                        {tidesPreview.location}
                        <span style={{ fontSize: 12, opacity: 0.8, marginLeft: 8 }}>{tidesPreview.region}</span>
                      </div>
                      <div style={{ fontSize: 11.5, opacity: 0.75, marginTop: 3 }}>
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Synced · {fmt(tidesPreview.synced_at, true)}
                      </div>
                    </div>
                    <i className="bi bi-water" style={{ fontSize: 28, opacity: 0.7 }}></i>
                  </div>

                  {/* Extremes table */}
                  <div style={{ padding: '0 4px' }}>
                    <table className="rm-table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th className="rm-th-module">Date</th>
                          <th className="rm-th-module">Time (MYT)</th>
                          <th className="rm-th-perm">Type</th>
                          <th className="rm-th-perm">Height (m)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tidesPreview.extremes.map((e: any, i: number) => {
                          const dt = new Date(e.dt);
                          // Convert UTC to MYT (UTC+8)
                          const myt = new Date(dt.getTime() + 8 * 60 * 60 * 1000);
                          return (
                            <tr key={i} className="rm-data-row">
                              <td className="rm-td-module" style={{ fontSize: 12.5, color: '#374151' }}>
                                {fmt(myt)}
                              </td>
                              <td className="rm-td-module" style={{ fontSize: 13, fontFamily: 'monospace', color: '#374151' }}>
                                {fmtTime(myt)}
                              </td>
                              <td className="rm-td-perm">
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  fontSize: 12, padding: '2px 10px', borderRadius: 12,
                                  background: e.type === 'High' ? '#dbeafe' : '#f0fdf4',
                                  color:      e.type === 'High' ? '#1d4ed8' : '#15803d',
                                }}>
                                  <i className={`bi ${e.type === 'High' ? 'bi-arrow-up' : 'bi-arrow-down'}`}></i>
                                  {e.type} Tide
                                </span>
                              </td>
                              <td className="rm-td-perm" style={{ fontSize: 13, color: '#374151' }}>
                                <span style={{
                                  fontFamily: 'monospace',
                                  color: e.type === 'High' ? '#1d4ed8' : '#15803d',
                                }}>
                                  {e.height.toFixed(2)} m
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="int-footer">
              <button type="submit" className="rm-btn-primary" disabled={saving}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                  : <><i className="bi bi-floppy-fill"></i> Save Settings</>
                }
              </button>
            </div>
          </form>
        )}
      </IntegrationLayout>
    </>
  );
}
