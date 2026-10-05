import { useRouter } from 'next/router';
import Link from 'next/link';
import { useBranding } from '@/lib/useBranding';

type Item = { label: string; icon: string; href: string };

const NAV: Item[] = [
  { label: 'Dashboard',   icon: 'bi-speedometer2',        href: '/ess/dashboard' },
  { label: 'My Leave',    icon: 'bi-calendar-check',      href: '/ess/leave' },
  { label: 'My Claims',   icon: 'bi-receipt',             href: '/ess/claims' },
  { label: 'My Overtime', icon: 'bi-clock-history',       href: '/ess/overtime' },
  { label: 'My Expenses', icon: 'bi-wallet2',             href: '/ess/expenses' },
  { label: 'My Payslips', icon: 'bi-file-earmark-text',   href: '/ess/payslips' },
  { label: 'My KPIs',     icon: 'bi-bar-chart-line',      href: '/ess/kpi' },
  { label: 'My Profile',  icon: 'bi-person-circle',       href: '/ess/profile' },
];

export default function EssSidebar() {
  const router = useRouter();
  const branding = useBranding();
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        {branding.sidebar_logo ? (
          <img src={branding.sidebar_logo} alt="ATLINE" style={{ maxHeight: 38, maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <>
            <div className="sidebar-brand-icon"><i className="bi bi-person-badge-fill"></i></div>
            <div className="sidebar-brand-text"><strong>ATLINE</strong> <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', fontWeight: 400 }}>Self-Service</span></div>
          </>
        )}
      </div>
      <nav className="sidebar-nav">
        <div>
          {NAV.map(item => {
            const active = router.pathname === item.href || router.pathname.startsWith(item.href + '/');
            return (
              <Link key={item.label} href={item.href}>
                <div className={`nav-item ${active ? 'active' : ''}`}>
                  <i className={`bi ${item.icon} nav-item-icon`}></i>
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
