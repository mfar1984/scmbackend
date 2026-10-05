import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from './AdminLayout';
import PermissionGate from './PermissionGate';
import { usePermissions } from '../lib/usePermissions';

type TabKey = 'administrator' | 'staff' | 'client';

const TABS: { key: TabKey; label: string; href: string; permKey: string }[] = [
  { key: 'administrator', label: 'Administrator', href: '/users/administrator', permKey: 'settings.users.administrator' },
  { key: 'staff',         label: 'Staff',         href: '/users/staff',         permKey: 'settings.users.staff' },
  { key: 'client',        label: 'Client',        href: '/users/client',        permKey: 'settings.users.client' },
];

type Props = {
  activeTab: TabKey;
  children: React.ReactNode;
  breadcrumb?: string[];
  // Allow child pages to trigger a count refresh after create/delete
  refreshKey?: number;
};

export default function UserLayout({ activeTab, children, breadcrumb = ['Settings', 'Users Management'], refreshKey }: Props) {
  const { canRead, loaded } = usePermissions();
  const [counts, setCounts] = useState<Record<TabKey, number>>({
    administrator: 0,
    staff: 0,
    client: 0,
  });

  useEffect(() => {
    fetch('/api/users/counts')
      .then(r => r.json())
      .then(json => {
        if (json.success) setCounts(json.data);
      })
      .catch(() => { /* silent — badges just won't show */ });
  }, [refreshKey]);

  const visibleTabs = loaded ? TABS.filter(t => canRead(t.permKey)) : TABS;
  const current = TABS.find(t => t.key === activeTab);

  return (
    <AdminLayout breadcrumb={breadcrumb}>
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body" style={{ padding: 24 }}>
          <div className="mb-4">
            <h1 className="page-title">Users Management</h1>
            <p className="page-subtitle">Manage system users and their assigned roles.</p>
          </div>

          {/* Tab nav — URL based */}
          <div className="usr-tabs mb-4">
            {visibleTabs.map(tab => (
              <Link key={tab.key} href={tab.href} style={{ textDecoration: 'none' }}>
                <button className={`usr-tab-btn${activeTab === tab.key ? ' active' : ''}`}>
                  {tab.label}
                  {counts[tab.key] > 0 && (
                    <span className="usr-tab-count">{counts[tab.key]}</span>
                  )}
                </button>
              </Link>
            ))}
          </div>

          {/* Tab content */}
          <PermissionGate moduleKey={current?.permKey ?? ''}>
            {children}
          </PermissionGate>
        </div>
      </div>
    </AdminLayout>
  );
}
