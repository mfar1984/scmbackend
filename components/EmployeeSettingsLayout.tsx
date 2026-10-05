import Link from 'next/link';
import AdminLayout from './AdminLayout';
import PermissionGate from './PermissionGate';
import { usePermissions } from '../lib/usePermissions';

export type EmpSettingsTab =
  | 'departments' | 'positions' | 'employment-types'
  | 'banks' | 'dropdowns' | 'general';

const TABS: { key: EmpSettingsTab; label: string; icon: string; href: string; permKey: string }[] = [
  { key: 'departments',      label: 'Departments',       icon: 'bi-building-fill',        href: '/hr/employee/settings/departments',      permKey: 'hr.employee.settings.departments' },
  { key: 'positions',        label: 'Positions',         icon: 'bi-person-badge-fill',    href: '/hr/employee/settings/positions',        permKey: 'hr.employee.settings.positions' },
  { key: 'employment-types', label: 'Employment Types',  icon: 'bi-briefcase-fill',       href: '/hr/employee/settings/employment-types', permKey: 'hr.employee.settings.employment_types' },
  { key: 'banks',            label: 'Banks',             icon: 'bi-bank',                 href: '/hr/employee/settings/banks',            permKey: 'hr.employee.settings.banks' },
  { key: 'dropdowns',        label: 'Dropdown Options',  icon: 'bi-list-ul',              href: '/hr/employee/settings/dropdowns',        permKey: 'hr.employee.settings.dropdowns' },
  { key: 'general',          label: 'General',           icon: 'bi-sliders',              href: '/hr/employee/settings/general',          permKey: 'hr.employee.settings.general' },
];

type Props = { activeTab: EmpSettingsTab; children: React.ReactNode; };

export default function EmployeeSettingsLayout({ activeTab, children }: Props) {
  const { canRead, loaded } = usePermissions();
  const current = TABS.find(t => t.key === activeTab);
  const visibleTabs = loaded ? TABS.filter(t => canRead(t.permKey)) : TABS;
  return (
    <AdminLayout breadcrumb={['Human Resources', 'Employee', 'Settings', current?.label ?? '']}>
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body" style={{ padding: 24 }}>
          <div className="mb-4">
            <h1 className="page-title">Employee Settings</h1>
            <p className="page-subtitle">Manage master data used across employee records and HR modules.</p>
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
