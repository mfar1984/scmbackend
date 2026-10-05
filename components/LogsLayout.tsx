import Link from 'next/link';
import AdminLayout from './AdminLayout';
import PermissionGate from './PermissionGate';
import { usePermissions } from '../lib/usePermissions';

export type LogsTab = 'activity' | 'audit';

const TABS: { key: LogsTab; label: string; icon: string; href: string; permKey: string }[] = [
  { key: 'activity', label: 'Activity Logging', icon: 'bi-journal-text',    href: '/logs/activity', permKey: 'settings.logs.activity' },
  { key: 'audit',    label: 'Audit Log',         icon: 'bi-shield-check',   href: '/logs/audit',    permKey: 'settings.logs.audit' },
];

type Props = { activeTab: LogsTab; children: React.ReactNode; };

export default function LogsLayout({ activeTab, children }: Props) {
  const { canRead, loaded } = usePermissions();
  const current = TABS.find(t => t.key === activeTab);
  const visibleTabs = loaded ? TABS.filter(t => canRead(t.permKey)) : TABS;
  return (
    <AdminLayout breadcrumb={['Settings', 'Activity Logs', current?.label ?? '']}>
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body" style={{ padding: 24 }}>
          <div className="mb-4">
            <h1 className="page-title">Activity Logs</h1>
            <p className="page-subtitle">Monitor system activity, user actions and security audit trail.</p>
          </div>
          <div className="int-tabs mb-4">
            {visibleTabs.map(tab => (
              <Link key={tab.key} href={tab.href} style={{ textDecoration: 'none' }}>
                <button className={`int-tab-btn${activeTab === tab.key ? ' active' : ''}`}>
                  <i className={`bi ${tab.icon}`}></i>
                  {tab.label}
                </button>
              </Link>
            ))}
          </div>
          <PermissionGate moduleKey={current?.permKey ?? ''}>
            {children}
          </PermissionGate>
        </div>
      </div>
    </AdminLayout>
  );
}
