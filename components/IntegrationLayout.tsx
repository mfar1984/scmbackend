import Link from 'next/link';
import AdminLayout from './AdminLayout';
import PermissionGate from './PermissionGate';
import ReadOnlyGuard from './ReadOnlyGuard';
import { usePermissions } from '../lib/usePermissions';

export type IntegrationTab = 'email' | 'api' | 'weather' | 'holidays' | 'payments' | 'sms' | 'telegram' | 'recycle-bin';

const TABS: { key: IntegrationTab; label: string; icon: string; href: string; permKey: string }[] = [
  { key: 'email',    label: 'Email',             icon: 'bi-envelope-fill',      href: '/integration/email',    permKey: 'settings.integration.email' },
  { key: 'api',      label: 'API & Webhook',      icon: 'bi-plug-fill',          href: '/integration/api',      permKey: 'settings.integration.api' },
  { key: 'weather',  label: 'Weather & Tides',    icon: 'bi-cloud-sun-fill',     href: '/integration/weather',  permKey: 'settings.integration.weather' },
  { key: 'holidays', label: 'Public Holidays',    icon: 'bi-calendar-event-fill',href: '/integration/holidays', permKey: 'settings.integration.holidays' },
  { key: 'payments', label: 'Payments',           icon: 'bi-credit-card-fill',   href: '/integration/payments', permKey: 'settings.integration.payments' },
  { key: 'sms',      label: 'SMS',                icon: 'bi-chat-dots-fill',     href: '/integration/sms',      permKey: 'settings.integration.sms' },
  { key: 'telegram', label: 'Telegram',           icon: 'bi-telegram',           href: '/integration/telegram', permKey: 'settings.integration.telegram' },
  { key: 'recycle-bin', label: 'Recycle Bin',     icon: 'bi-trash3-fill',        href: '/integration/recycle-bin', permKey: 'settings.integration.recycle_bin' },
];

// Pure settings-form tabs — disable inputs when the role lacks Update.
// 'api', 'holidays', 'telegram' and 'recycle-bin' manage their own per-button gating.
const FORM_TABS: IntegrationTab[] = ['email', 'weather', 'payments', 'sms'];

type Props = { activeTab: IntegrationTab; children: React.ReactNode; };

export default function IntegrationLayout({ activeTab, children }: Props) {
  const { canRead, loaded } = usePermissions();
  const current = TABS.find(t => t.key === activeTab);
  const visibleTabs = loaded ? TABS.filter(t => canRead(t.permKey)) : TABS;
  const isFormTab = FORM_TABS.includes(activeTab);
  return (
    <AdminLayout breadcrumb={['Settings', 'Integration', current?.label ?? '']}>
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body" style={{ padding: 24 }}>
          <div className="mb-4">
            <h1 className="page-title">Integration</h1>
            <p className="page-subtitle">Configure third-party service integrations for the ATLINE system.</p>
          </div>
          {/* Tab nav */}
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
            {isFormTab
              ? <ReadOnlyGuard moduleKey={current?.permKey ?? ''}>{children}</ReadOnlyGuard>
              : children}
          </PermissionGate>
        </div>
      </div>
    </AdminLayout>
  );
}
