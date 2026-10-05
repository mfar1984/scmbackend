import AdminLayout from '../AdminLayout';
import PermissionGate from '../PermissionGate';
import { usePermissions } from '../../lib/usePermissions';

export type SettingsTab = { key: string; label: string; icon: string; permKey?: string };

type Props = {
  moduleLabel: string;       // e.g. "Leave"
  breadcrumb: string[];
  tabs: SettingsTab[];
  activeTab: string;
  onTab: (key: string) => void;
  moduleKey?: string;        // permission key gating the whole settings page
  children: React.ReactNode;
};

export default function ModuleSettingsLayout({ moduleLabel, breadcrumb, tabs, activeTab, onTab, moduleKey, children }: Props) {
  return (
    <AdminLayout breadcrumb={breadcrumb}>
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body" style={{ padding: 24 }}>
          <div className="mb-4">
            <h1 className="page-title">{moduleLabel} Settings</h1>
            <p className="page-subtitle">Manage master data used across {moduleLabel.toLowerCase()} applications.</p>
          </div>
          <div className="int-tabs mb-4">
            {tabs.map(t => (
              <button key={t.key} className={`int-tab-btn${activeTab === t.key ? ' active' : ''}`} onClick={() => onTab(t.key)}>
                <i className={`bi ${t.icon}`}></i> {t.label}
              </button>
            ))}
          </div>
          {moduleKey ? <PermissionGate moduleKey={moduleKey}>{children}</PermissionGate> : children}
        </div>
      </div>
    </AdminLayout>
  );
}
