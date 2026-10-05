'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import ReadOnlyGuard from '../../../components/ReadOnlyGuard';
import { usePermissions } from '../../../lib/usePermissions';

function FormRow({ label, hint, children, last }: { label: string; hint?: string; children: React.ReactNode; last?: boolean }) {
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

export default function PayrollSettingsPage() {
  const { can } = usePermissions();
  const canUpdate = can('hr.payroll.settings', 'Update');
  const [s, setS] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/hr/payroll/settings').then(r => r.json()).then(j => { if (j.success) setS(j.data); })
      .catch(() => setError('Failed to load settings.')).finally(() => setLoading(false));
  }, []);

  const set = (k: string, v: string) => setS(p => ({ ...p, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/hr/payroll/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
      const json = await res.json();
      if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>Payroll Settings | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Payroll', 'Settings']}>
        <PermissionGate moduleKey="hr.payroll.settings">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Payroll Settings</h1>
              <p className="page-subtitle">Statutory contribution rates and payroll defaults (Malaysia).</p>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
                <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading settings...
              </div>
            ) : (
              <ReadOnlyGuard moduleKey="hr.payroll.settings">
              <form onSubmit={handleSave}>
                {saved && <div className="rm-saved-banner mb-4"><i className="bi bi-check-circle-fill"></i> Payroll settings saved.</div>}
                {error && <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}>{error}</div>}

                <div className="int-card">
                  <div className="int-card-title"><i className="bi bi-piggy-bank-fill"></i> EPF (KWSP)</div>
                  <FormRow label="Employee Rate (%)" hint="Default employee EPF contribution">
                    <input type="number" step="0.01" className="rm-input" style={{ maxWidth: 140 }} value={s.epf_employee_rate ?? ''} onChange={e => set('epf_employee_rate', e.target.value)} />
                  </FormRow>
                  <FormRow label="Employer Rate (%)" last>
                    <input type="number" step="0.01" className="rm-input" style={{ maxWidth: 140 }} value={s.epf_employer_rate ?? ''} onChange={e => set('epf_employer_rate', e.target.value)} />
                  </FormRow>
                </div>

                <div className="int-card">
                  <div className="int-card-title"><i className="bi bi-shield-fill-check"></i> SOCSO (PERKESO)</div>
                  <FormRow label="Employee Rate (%)">
                    <input type="number" step="0.01" className="rm-input" style={{ maxWidth: 140 }} value={s.socso_employee_rate ?? ''} onChange={e => set('socso_employee_rate', e.target.value)} />
                  </FormRow>
                  <FormRow label="Employer Rate (%)" last>
                    <input type="number" step="0.01" className="rm-input" style={{ maxWidth: 140 }} value={s.socso_employer_rate ?? ''} onChange={e => set('socso_employer_rate', e.target.value)} />
                  </FormRow>
                </div>

                <div className="int-card">
                  <div className="int-card-title"><i className="bi bi-cash-stack"></i> EIS &amp; General</div>
                  <FormRow label="EIS Rate (%)">
                    <input type="number" step="0.01" className="rm-input" style={{ maxWidth: 140 }} value={s.eis_rate ?? ''} onChange={e => set('eis_rate', e.target.value)} />
                  </FormRow>
                  <FormRow label="Default Pay Day" hint="Day of month salaries are paid">
                    <input type="number" className="rm-input" style={{ maxWidth: 100 }} value={s.pay_day ?? ''} onChange={e => set('pay_day', e.target.value)} min={1} max={31} />
                  </FormRow>
                  <FormRow label="Currency" last>
                    <input className="rm-input" style={{ maxWidth: 120 }} value={s.currency ?? ''} onChange={e => set('currency', e.target.value)} />
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
          </div>
        </div>
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
