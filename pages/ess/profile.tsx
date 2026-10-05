'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import EssLayout from '../../components/ess/EssLayout';
import AccountSettings from '../../components/AccountSettings';
import { useDateFormat } from '../../lib/useDateFormat';

function KV({ label, value }: { label: string; value: any }) {
  return (
    <div className="cr-kv"><span className="cr-kv-label">{label}</span><span className="cr-kv-value">{value || '—'}</span></div>
  );
}

export default function EssProfile() {
  const { fmt } = useDateFormat();
  const [p, setP] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/ess/profile').then(r => r.json()).then(j => { if (j.success) setP(j.data); else setError(j.message || 'Failed.'); }).catch(() => setError('Failed to load.'));
  }, []);

  const money = (v: any) => v != null ? `RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '—';

  return (
    <>
      <Head><title>My Profile | ATLINE Self-Service</title></Head>
      <EssLayout breadcrumb={['My Profile']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4"><h1 className="page-title">My Profile</h1><p className="page-subtitle">Manage your login account, and view your employee information.</p></div>

            {/* Editable login account (name / email / phone / password) */}
            <AccountSettings />

            {/* Read-only employee record */}
            <div className="mb-3" style={{ marginTop: 8 }}>
              <h2 className="page-title" style={{ fontSize: 18 }}>Employee Information</h2>
              <p className="page-subtitle">These details are managed by HR. Contact HR to update them.</p>
            </div>
            {error ? <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div> : !p ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
            ) : (
              <>
                <div className="cr-panel">
                  <div className="cr-panel-head"><i className="bi bi-person-fill"></i> Personal</div>
                  <div className="cr-panel-body">
                    <KV label="Employee ID" value={p.employee_id} />
                    <KV label="Full Name" value={p.full_name} />
                    <KV label="NRIC / Passport" value={p.nric_passport} />
                    <KV label="Gender" value={p.gender} />
                    <KV label="Date of Birth" value={p.date_of_birth ? fmt(p.date_of_birth) : '—'} />
                    <KV label="Email" value={p.email} />
                    <KV label="Phone" value={p.phone} />
                  </div>
                </div>
                <div className="cr-panel">
                  <div className="cr-panel-head"><i className="bi bi-briefcase-fill"></i> Employment</div>
                  <div className="cr-panel-body">
                    <KV label="Department" value={p.department_name} />
                    <KV label="Position" value={p.position_name} />
                    <KV label="Employment Type" value={p.employment_type_name} />
                    <KV label="Join Date" value={p.join_date ? fmt(p.join_date) : '—'} />
                  </div>
                </div>
                <div className="cr-panel">
                  <div className="cr-panel-head"><i className="bi bi-cash-stack"></i> Salary &amp; Statutory</div>
                  <div className="cr-panel-body">
                    <KV label="Basic Salary" value={money(p.basic_salary)} />
                    <KV label="Bank" value={p.bank_name} />
                    <KV label="Bank Account" value={p.bank_account_no} />
                    <KV label="EPF No." value={p.epf_no} />
                    <KV label="SOCSO No." value={p.socso_no} />
                    <KV label="Income Tax No." value={p.income_tax_no} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </EssLayout>
    </>
  );
}
