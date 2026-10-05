import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import EssSidebar from './EssSidebar';

export type EssUser = {
  id: number; name: string; email: string; role: string;
  user_type: string; employee_id: number | null;
};

type Props = { children: React.ReactNode; breadcrumb?: string[] };

export default function EssLayout({ children, breadcrumb = [] }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<EssUser | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(json => {
        if (!json.success) { router.replace('/login'); return; }
        // Administrators belong in the admin backend, not ESS
        if (json.user.user_type === 'administrator') { router.replace('/dashboard'); return; }
        setUser(json.user);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* silent */ }
    router.replace('/login');
  };

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'S';

  return (
    <div className="admin-layout">
      <EssSidebar />
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-breadcrumb">
            <span>Employee Self-Service</span>
            {breadcrumb.map((b, i) => (
              <span key={i}>
                <i className="bi bi-chevron-right" style={{ fontSize: 10, margin: '0 2px' }}></i>
                <span>{b}</span>
              </span>
            ))}
          </div>
          <div className="topbar-actions">
            <div className="topbar-user">
              <div className="topbar-avatar">{initial}</div>
              <div className="topbar-user-info">
                <strong>{user?.name ?? '—'}</strong>
                <span>Staff</span>
              </div>
              <button className="topbar-logout" title="Sign out" onClick={() => setShowConfirm(true)} disabled={signingOut}>
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        </header>
        <main className="admin-content">
          {!user ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af', fontSize: 13 }}>
              <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…
            </div>
          ) : children}
        </main>
      </div>

      {showConfirm && (
        <div className="rm-modal-overlay">
          <div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal-icon" style={{ background: '#fef3c7' }}><i className="bi bi-box-arrow-right" style={{ color: '#d97706' }}></i></div>
            <h3>Sign Out?</h3>
            <p>You will be redirected to the login page.</p>
            <div className="rm-modal-actions">
              <button className="rm-btn-outline" onClick={() => setShowConfirm(false)} disabled={signingOut}>Cancel</button>
              <button className="rm-btn-primary" onClick={handleSignOut} disabled={signingOut} style={{ background: '#d97706', borderColor: '#d97706' }}>
                {signingOut ? <><span className="spinner-border spinner-border-sm me-1"></span> Signing out...</> : <><i className="bi bi-box-arrow-right"></i> Sign Out</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared hook for ESS pages to get the current staff user (with employee_id).
export function useEssUser() {
  const [user, setUser] = useState<EssUser | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(j => { if (j.success) setUser(j.user); }).catch(() => {});
  }, []);
  return user;
}
