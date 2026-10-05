import Link from 'next/link';
import AdminLayout from './AdminLayout';
import PermissionGate from './PermissionGate';
import ReadOnlyGuard from './ReadOnlyGuard';
import { usePermissions } from '../lib/usePermissions';

export type ConfigTab = 'general' | 'branding' | 'social-seo' | 'backup' | 'maintenance';

const TABS: { key: ConfigTab; label: string; icon: string; href: string; permKey: string }[] = [
  { key: 'general',     label: 'General',            icon: 'bi-sliders',           href: '/config/general',     permKey: 'settings.config.general' },
  { key: 'branding',    label: 'Branding',            icon: 'bi-palette-fill',      href: '/config/branding',    permKey: 'settings.config.branding' },
  { key: 'social-seo',  label: 'Social & SEO',        icon: 'bi-share-fill',        href: '/config/social-seo',  permKey: 'settings.config.social_seo' },
  { key: 'backup',      label: 'Backup & Restore',    icon: 'bi-cloud-arrow-up-fill',href: '/config/backup',     permKey: 'settings.config.backup' },
  { key: 'maintenance', label: 'Maintenance & Cache', icon: 'bi-tools',             href: '/config/maintenance', permKey: 'settings.config.maintenance' },
];

// Pure settings-form tabs — disable all inputs when the role lacks Update.
// Action-based tabs (backup) manage their own per-button gating.
const FORM_TABS: ConfigTab[] = ['general', 'branding', 'social-seo', 'maintenance'];

type Props = { activeTab: ConfigTab; children: React.ReactNode; };

export default function ConfigLayout({ activeTab, children }: Props) {
  const { canRead, loaded } = usePermissions();
  const current = TABS.find(t => t.key === activeTab);
  const visibleTabs = loaded ? TABS.filter(t => canRead(t.permKey)) : TABS;
  const isFormTab = FORM_TABS.includes(activeTab);
  return (
    <AdminLayout breadcrumb={['Settings', 'Global Config', current?.label ?? '']}>
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body" style={{ padding: 24 }}>
          <div className="mb-4">
            <h1 className="page-title">Global Config</h1>
            <p className="page-subtitle">System-wide configuration settings for the ATLINE admin panel.</p>
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
            {isFormTab
              ? <ReadOnlyGuard moduleKey={current?.permKey ?? ''}>{children}</ReadOnlyGuard>
              : children}
          </PermissionGate>
        </div>
      </div>
    </AdminLayout>
  );
}
