import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  user_type?: string;
};

type Props = {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: string[];
};

export default function AdminLayout({ children, title = 'Dashboard', breadcrumb = [] }: Props) {
  const router = useRouter();
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);

  // Global keyboard shortcut: Ctrl/Cmd + K opens the search palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(s => !s);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          // Staff accounts belong in the Employee Self-Service portal
          if (json.user.user_type === 'staff') {
            router.replace('/ess/dashboard');
            return;
          }
          setUser(json.user);
        } else {
          // Not authenticated — redirect to login
          router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* silent */ }
    router.replace('/login');
  };

  // Avatar initial — first letter of name
  const initial = user?.name?.charAt(0).toUpperCase() ?? 'A';

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">

        {/* Topbar */}
        <header className="admin-topbar">
          <div className="topbar-breadcrumb">
            <span>ATLINE Admin</span>
            {breadcrumb.map((b, i) => (
              <span key={i}>
                <i className="bi bi-chevron-right" style={{ fontSize: 10, margin: '0 2px' }}></i>
                <span>{b}</span>
              </span>
            ))}
          </div>

          <div className="topbar-actions">
            <button className="topbar-btn" title="Search (Ctrl+K)" onClick={() => setSearchOpen(true)}>
              <i className="bi bi-search"></i>
            </button>
            <NotificationBell />
            <button className="topbar-btn" title="My Profile" onClick={() => router.push('/profile')}>
              <i className="bi bi-gear"></i>
            </button>

            <div className="topbar-user-divider"></div>

            <div className="topbar-user">
              <div className="topbar-avatar">{initial}</div>
              <div className="topbar-user-info">
                <strong>{user?.name ?? '—'}</strong>
                <span>{user?.role ?? '—'}</span>
              </div>
              <button
                className="topbar-logout"
                title="Sign out"
                onClick={() => setShowConfirm(true)}
                disabled={signingOut}
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>

      {/* Sign out confirm modal */}
      {showConfirm && (
        <div className="rm-modal-overlay">
          <div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal-icon" style={{ background: '#fef3c7' }}>
              <i className="bi bi-box-arrow-right" style={{ color: '#d97706' }}></i>
            </div>
            <h3>Sign Out?</h3>
            <p>You will be redirected to the login page.</p>
            <div className="rm-modal-actions">
              <button
                className="rm-btn-outline"
                onClick={() => setShowConfirm(false)}
                disabled={signingOut}
              >
                Cancel
              </button>
              <button
                className="rm-btn-primary"
                onClick={handleSignOut}
                disabled={signingOut}
                style={{ background: '#d97706', borderColor: '#d97706' }}
              >
                {signingOut
                  ? <><span className="spinner-border spinner-border-sm me-1"></span> Signing out...</>
                  : <><i className="bi bi-box-arrow-right"></i> Sign Out</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global search palette (Ctrl/Cmd+K) */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
