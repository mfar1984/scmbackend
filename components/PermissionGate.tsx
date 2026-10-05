import { usePermissions } from '../lib/usePermissions';

/**
 * Page-level access guard. Renders children only if the current role can read
 * the given module key. Otherwise shows an "Access Denied" card.
 * Super Admin always passes. While permissions load, shows a spinner.
 */
export default function PermissionGate({ moduleKey, children }: { moduleKey: string; children: React.ReactNode }) {
  const perms = usePermissions();

  if (!perms.loaded) {
    return (
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body" style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…
        </div>
      </div>
    );
  }

  const allowed = perms.isSuperAdmin || !moduleKey || perms.canRead(moduleKey);

  if (!allowed) {
    return (
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body" style={{ padding: 48, textAlign: 'center' }}>
          <i className="bi bi-shield-lock" style={{ fontSize: 42, color: '#ef4444', display: 'block', marginBottom: 14 }}></i>
          <h2 style={{ fontSize: 18, color: '#1f2937', marginBottom: 8 }}>Access Denied</h2>
          <p style={{ fontSize: 13.5, color: '#6b7280', margin: 0 }}>
            You don&apos;t have permission to view this page. Contact your administrator if you believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
