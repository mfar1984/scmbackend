'use client';
import { useState, useEffect } from 'react';

type Account = {
  id: number; name: string; email: string; phone: string | null;
  user_type: string; role: string | null; department: string | null;
  position: string | null; join_date: string | null; last_login: string | null;
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="usr-form-row">
      <div className="usr-form-label" style={{ paddingTop: 8 }}>
        <div>{label}</div>
        {hint && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 2 }}>{hint}</div>}
      </div>
      <div className="usr-form-field">{children}</div>
    </div>
  );
}

/**
 * Self-service account editor — used by both the admin Profile page and the
 * ESS My Account page. Reads/writes the current user's own record via
 * /api/auth/account (no role permission needed).
 */
export default function AccountSettings() {
  const [acc, setAcc] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confPw, setConfPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const load = () => {
    fetch('/api/auth/account')
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setAcc(j.data);
          setName(j.data.name || '');
          setEmail(j.data.email || '');
          setPhone(j.data.phone || '');
        } else setError(j.message || 'Failed to load.');
      })
      .catch(() => setError('Failed to load your account.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true); setMsg(''); setError('');
    try {
      const r = await fetch('/api/auth/account', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      });
      const j = await r.json();
      if (j.success) { setMsg('Profile updated.'); setTimeout(() => setMsg(''), 3000); }
      else setError(j.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSavingInfo(false); }
  };

  const savePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(''); setPwError('');
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw !== confPw) { setPwError('New password and confirmation do not match.'); return; }
    setSavingPw(true);
    try {
      const r = await fetch('/api/auth/account', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: curPw, new_password: newPw }),
      });
      const j = await r.json();
      if (j.success) {
        setPwMsg('Password changed successfully.');
        setCurPw(''); setNewPw(''); setConfPw('');
        setTimeout(() => setPwMsg(''), 3000);
      } else setPwError(j.message || 'Failed to change password.');
    } catch { setPwError('Network error.'); }
    finally { setSavingPw(false); }
  };

  const initial = (name || acc?.name || 'A').charAt(0).toUpperCase();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>;
  }
  if (!acc) {
    return <div className="alert alert-danger" style={{ fontSize: 13 }}>{error || 'Could not load your account.'}</div>;
  }

  return (
    <>
      {/* Identity header */}
      <div className="int-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, color: '#1e293b' }}>{acc.name}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            {acc.role || acc.user_type}{acc.department ? ` · ${acc.department}` : ''}
          </div>
        </div>
      </div>

      {/* Personal info */}
      <form onSubmit={saveInfo}>
        <div className="int-card">
          <div className="int-card-title"><i className="bi bi-person-fill"></i> Personal Information</div>
          {msg && <div className="rm-saved-banner mb-3"><i className="bi bi-check-circle-fill"></i> {msg}</div>}
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          <Field label="Full Name"><input className="rm-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></Field>
          <Field label="Email Address" hint="Used to sign in"><input className="rm-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@atline.com.my" /></Field>
          <Field label="Phone"><input className="rm-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="012-345 6789" /></Field>
        </div>
        <div className="int-footer">
          <button type="submit" className="rm-btn-primary" disabled={savingInfo}>
            {savingInfo ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-floppy-fill"></i> Save Profile</>}
          </button>
        </div>
      </form>

      {/* Change password */}
      <form onSubmit={savePw}>
        <div className="int-card">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <div className="int-card-title" style={{ margin: 0 }}><i className="bi bi-shield-lock-fill"></i> Change Password</div>
            <button type="button" onClick={() => setShowPw(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13 }}>
              <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`}></i> {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          {pwMsg && <div className="rm-saved-banner mb-3"><i className="bi bi-check-circle-fill"></i> {pwMsg}</div>}
          {pwError && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{pwError}</div>}
          <Field label="Current Password"><input className="rm-input" type={showPw ? 'text' : 'password'} value={curPw} onChange={e => setCurPw(e.target.value)} autoComplete="current-password" /></Field>
          <Field label="New Password" hint="Minimum 6 characters"><input className="rm-input" type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" /></Field>
          <Field label="Confirm New Password"><input className="rm-input" type={showPw ? 'text' : 'password'} value={confPw} onChange={e => setConfPw(e.target.value)} autoComplete="new-password" /></Field>
        </div>
        <div className="int-footer">
          <button type="submit" className="rm-btn-primary" disabled={savingPw || !curPw || !newPw || !confPw}>
            {savingPw ? <><span className="spinner-border spinner-border-sm me-1"></span> Updating...</> : <><i className="bi bi-key-fill"></i> Change Password</>}
          </button>
        </div>
      </form>
    </>
  );
}
