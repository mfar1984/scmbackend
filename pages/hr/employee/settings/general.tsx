'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import EmployeeSettingsLayout from '../../../../components/EmployeeSettingsLayout';
import ReadOnlyGuard from '../../../../components/ReadOnlyGuard';
import { usePermissions } from '../../../../lib/usePermissions';

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

export default function GeneralSettingsPage() {
  const { can } = usePermissions();
  const canUpdate = can('hr.employee.settings.general', 'Update');
  const [idPrefix, setIdPrefix]   = useState('ATL');
  const [idDigits, setIdDigits]   = useState('4');
  const [idNext, setIdNext]       = useState('1');
  const [probation, setProbation] = useState('3');
  const [nationality, setNationality] = useState('Malaysian');
  const [country, setCountry]     = useState('Malaysia');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/hr/general')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data;
          setIdPrefix(d.employee_id_prefix     || 'ATL');
          setIdDigits(d.employee_id_digits      || '4');
          setIdNext(d.employee_id_next          || '1');
          setProbation(d.default_probation_months || '3');
          setNationality(d.default_nationality  || 'Malaysian');
          setCountry(d.default_country          || 'Malaysia');
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/hr/general', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id_prefix: idPrefix,
          employee_id_digits: idDigits,
          employee_id_next:   idNext,
          default_probation_months: probation,
          default_nationality: nationality,
          default_country:     country,
        }),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  // Preview next employee ID
  const previewId = `${idPrefix}${String(idNext).padStart(parseInt(idDigits) || 4, '0')}`;

  return (
    <>
      <Head><title>General — Employee Settings | ATLINE Admin</title></Head>
      <EmployeeSettingsLayout activeTab="general">

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading settings...
          </div>
        ) : (
          <ReadOnlyGuard moduleKey="hr.employee.settings.general">
          <form onSubmit={handleSave}>
            {saved && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> Settings saved successfully.</div>}
            {error && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}>{error}</div>}

            {/* Employee ID */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-hash"></i> Employee ID Format</div>
              <div className="int-info-note mb-3">
                <i className="bi bi-info-circle-fill"></i>
                Next employee will get ID: <strong style={{ fontFamily: 'monospace' }}>{previewId}</strong>
              </div>
              <FormRow label="ID Prefix" hint="Letters before the number">
                <input className="rm-input" style={{ maxWidth: 140 }} value={idPrefix} onChange={e => setIdPrefix(e.target.value.toUpperCase())} placeholder="ATL" />
              </FormRow>
              <FormRow label="Number Digits" hint="Total digits (zero-padded)">
                <input type="number" className="rm-input" style={{ maxWidth: 100 }} value={idDigits} onChange={e => setIdDigits(e.target.value)} min={1} max={10} />
              </FormRow>
              <FormRow label="Next Number" hint="The next sequence number to use" last>
                <input type="number" className="rm-input" style={{ maxWidth: 140 }} value={idNext} onChange={e => setIdNext(e.target.value)} min={1} />
              </FormRow>
            </div>

            {/* Defaults */}
            <div className="int-card">
              <div className="int-card-title"><i className="bi bi-gear-fill"></i> Default Values</div>
              <FormRow label="Probation Period" hint="Default probation duration for new employees">
                <div className="d-flex align-items-center gap-2">
                  <input type="number" className="rm-input" style={{ maxWidth: 100 }} value={probation} onChange={e => setProbation(e.target.value)} min={0} max={24} />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>months</span>
                </div>
              </FormRow>
              <FormRow label="Default Nationality">
                <input className="rm-input" style={{ maxWidth: 240 }} value={nationality} onChange={e => setNationality(e.target.value)} placeholder="Malaysian" />
              </FormRow>
              <FormRow label="Default Country" last>
                <input className="rm-input" style={{ maxWidth: 240 }} value={country} onChange={e => setCountry(e.target.value)} placeholder="Malaysia" />
              </FormRow>
            </div>

            <div className="int-footer">
              <button type="submit" className="rm-btn-primary" disabled={saving || !canUpdate}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-floppy-fill"></i> Save Settings</>}
              </button>
            </div>
          </form>
          </ReadOnlyGuard>
        )}

      </EmployeeSettingsLayout>
    </>
  );
}
