import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useBranding } from '@/lib/useBranding';
import { usePermissions } from '@/lib/usePermissions';

type NavChild = {
  label: string;
  href?: string;
  permKey?: string;
  children?: NavChild[];
};

type NavItem = {
  label: string;
  icon: string;
  href?: string;
  permKey?: string;
  badge?: number;
  children?: NavChild[];
};

type NavSection = {
  section?: string;
  divider?: boolean;
  items?: NavItem[];
};

export const NAV: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', icon: 'bi-grid-fill', href: '/dashboard', permKey: 'dashboard' },
    ],
  },
  { divider: true },
  {
    section: 'Application',
    items: [
      {
        label: 'Application', icon: 'bi-clipboard-fill',
        children: [
          { label: 'Procurement',       href: '/application/procurement',       permKey: 'app.procurement' },
          { label: 'Strategic Partner', href: '/application/strategic-partner', permKey: 'app.strategic_partner' },
        ],
      },
    ],
  },
  {
    section: 'Human Resources',
    items: [
      {
        label: 'Career', icon: 'bi-person-vcard-fill',
        children: [
          { label: 'Career Postings', href: '/hr/career/postings',  permKey: 'hr.career.postings' },
          { label: 'Applicants',      href: '/hr/career/applicants', permKey: 'hr.career.applicants' },
          { label: 'Archive',         href: '/hr/career/archive',    permKey: 'hr.career.archive' },
        ],
      },
      {
        label: 'Employee Management', icon: 'bi-people-fill',
        children: [
          { label: 'Employee List',     href: '/hr/employee',          permKey: 'hr.employee.list' },
          { label: 'Settings Employee', href: '/hr/employee/settings', permKey: 'hr.employee.settings' },
        ],
      },
      {
        label: 'Leave Management', icon: 'bi-calendar-check-fill',
        children: [
          { label: 'Leave Application', href: '/hr/leave',          permKey: 'hr.leave.application' },
          { label: 'Settings Leave',    href: '/hr/leave/settings', permKey: 'hr.leave.settings' },
        ],
      },
      {
        label: 'Claim Management', icon: 'bi-receipt',
        children: [
          { label: 'Claim Application', href: '/hr/claim',          permKey: 'hr.claim.application' },
          { label: 'Settings Claim',    href: '/hr/claim/settings', permKey: 'hr.claim.settings' },
        ],
      },
      {
        label: 'Overtime Management', icon: 'bi-clock-history',
        children: [
          { label: 'Overtime Application', href: '/hr/overtime',          permKey: 'hr.overtime.application' },
          { label: 'Settings Overtime',    href: '/hr/overtime/settings', permKey: 'hr.overtime.settings' },
        ],
      },
      {
        label: 'Expenses Management', icon: 'bi-wallet2',
        children: [
          { label: 'Expenses Application', href: '/hr/expenses',          permKey: 'hr.expenses.application' },
          { label: 'Settings Expenses',    href: '/hr/expenses/settings', permKey: 'hr.expenses.settings' },
        ],
      },
      {
        label: 'KPI', icon: 'bi-graph-up-arrow',
        children: [
          { label: 'KPI Templates',     href: '/hr/kpi/templates',    permKey: 'hr.kpi.templates' },
          { label: 'KPI Periods',       href: '/hr/kpi/periods',      permKey: 'hr.kpi.periods' },
          { label: 'KPI Assignments',   href: '/hr/kpi/assignments',  permKey: 'hr.kpi.assignments' },
          { label: 'KPI Reviews',       href: '/hr/kpi/reviews',      permKey: 'hr.kpi.reviews' },
          { label: 'KPI Results',       href: '/hr/kpi/results',      permKey: 'hr.kpi.results' },
          { label: 'KPI Competencies',  href: '/hr/kpi/competencies', permKey: 'hr.kpi.competencies' },
          { label: 'KPI Grade Bands',   href: '/hr/kpi/grade-bands',  permKey: 'hr.kpi.grade_bands' },
        ],
      },
      {
        label: 'Payroll & Compensation', icon: 'bi-cash-stack',
        children: [
          { label: 'Payroll Periods',       href: '/hr/payroll/periods',    permKey: 'hr.payroll.periods' },
          { label: 'Allowance Management',  href: '/hr/payroll/allowance',  permKey: 'hr.payroll.allowance' },
          { label: 'Bonus Management',      href: '/hr/payroll/bonus',      permKey: 'hr.payroll.bonus' },
          { label: 'Commission Management', href: '/hr/payroll/commission', permKey: 'hr.payroll.commission' },
          { label: 'Loan Management',       href: '/hr/payroll/loan',       permKey: 'hr.payroll.loan' },
          { label: 'Advances Management',   href: '/hr/payroll/advances',   permKey: 'hr.payroll.advances' },
          { label: 'Settings Payroll',      href: '/hr/payroll/settings',   permKey: 'hr.payroll.settings' },
        ],
      },
    ],
  },
  {
    section: 'Web Tools',
    items: [
      { label: 'Home', icon: 'bi-house-fill', href: '/web/home', permKey: 'web.home' },
      {
        label: 'About', icon: 'bi-building',
        children: [
          { label: 'About Us',         href: '/web/about/about-us',       permKey: 'web.about.about_us' },
          { label: 'Vision & Mission', href: '/web/about/vision-mission', permKey: 'web.about.vision_mission' },
          { label: 'Certifications',   href: '/web/about/certifications', permKey: 'web.about.certifications' },
        ],
      },
      {
        label: 'Solutions', icon: 'bi-grid-3x3-gap-fill',
        children: [
          { label: 'Structured Cabling System',  href: '/web/solutions/structured-cabling', permKey: 'web.solutions.structured_cabling' },
          { label: 'Active Network Devices',     href: '/web/solutions/active-network',     permKey: 'web.solutions.active_network' },
          { label: 'Network Peripherals',        href: '/web/solutions/network-peripherals', permKey: 'web.solutions.network_peripherals' },
          { label: 'ICT Products & Peripherals', href: '/web/solutions/ict-products',       permKey: 'web.solutions.ict_products' },
        ],
      },
      {
        label: 'Services', icon: 'bi-gear-fill',
        children: [
          { label: 'Consulting Services',  href: '/web/services/consulting',          permKey: 'web.services.consulting' },
          { label: 'Network Engineering',  href: '/web/services/network-engineering', permKey: 'web.services.network_engineering' },
          { label: 'Project Management',   href: '/web/services/project-management',  permKey: 'web.services.project_management' },
          { label: 'Training & Workshop',  href: '/web/services/training',            permKey: 'web.services.training' },
        ],
      },
      {
        label: 'Business', icon: 'bi-briefcase-fill',
        children: [
          { label: 'Tender',             href: '/web/business/tender',              permKey: 'web.business.tender' },
          { label: 'Procurement',        href: '/web/business/procurement',         permKey: 'web.business.procurement' },
          { label: 'Strategic Partners', href: '/web/business/strategic-partners',  permKey: 'web.business.strategic_partners' },
        ],
      },
      {
        label: 'Resources', icon: 'bi-collection-fill',
        children: [
          { label: 'Projects',    href: '/web/projects',              permKey: 'web.resources.projects' },
          { label: 'Products',    href: '/web/resources/products',    permKey: 'web.resources.products' },
          { label: 'Achievement', href: '/web/resources/achievement', permKey: 'web.resources.achievement' },
          { label: 'Gallery',     href: '/web/resources/gallery',     permKey: 'web.resources.gallery' },
          { label: 'Forms & Documents', href: '/web/downloads',        permKey: 'web.resources.download' },
          { label: 'FAQ',         href: '/web/resources/faq',         permKey: 'web.resources.faq' },
          { label: 'Circulars',   href: '/web/resources/circulars',   permKey: 'web.resources.circulars' },
        ],
      },
      { label: 'News', icon: 'bi-newspaper', href: '/web/news', permKey: 'web.news' },
      {
        label: 'Legal', icon: 'bi-shield-lock-fill',
        children: [
          { label: 'Privacy Policy',   href: '/web/legal?tab=privacy-policy',   permKey: 'web.legal.privacy' },
          { label: 'Terms of Service', href: '/web/legal?tab=terms-of-service', permKey: 'web.legal.terms' },
          { label: 'Disclaimer',       href: '/web/legal?tab=disclaimer',       permKey: 'web.legal.disclaimer' },
          { label: 'Sitemap',          href: '/web/legal?tab=sitemap',          permKey: 'web.legal.sitemap' },
        ],
      },
    ],
  },
  {
    section: 'Operations',
    items: [
      { label: 'Tender Management',      icon: 'bi-file-earmark-text-fill', href: '/operations/tender',       permKey: 'ops.tender' },
      { label: 'Procurement',            icon: 'bi-box-seam-fill',          href: '/operations/procurement',  permKey: 'ops.procurement' },
      { label: 'Business Development',   icon: 'bi-briefcase-fill',         href: '/operations/business-dev', permKey: 'ops.business_dev' },
    ],
  },
  { divider: true },
  {
    items: [
      {
        label: 'Settings', icon: 'bi-gear-fill',
        children: [
          { label: 'Global Config',    href: '/config',      permKey: 'settings.config' },
          { label: 'Integration',      href: '/integration', permKey: 'settings.integration' },
          { label: 'Roles Management', href: '/roles',       permKey: 'settings.roles' },
          { label: 'Users Management', href: '/users',       permKey: 'settings.users' },
          { label: 'Activity Logs',    href: '/logs',        permKey: 'settings.logs' },
        ],
      },
    ],
  },
];

/* ── Active-route matching helpers ──
 * Pages live in sub-paths (e.g. /config/general under the "/config" item) and
 * some hrefs carry a query (e.g. /web/legal?tab=...). So we match by path
 * prefix and pick the single most-specific (longest) href across the whole nav.
 * This keeps sibling pairs like /hr/leave vs /hr/leave/settings from both
 * lighting up. For items that differ only by query (e.g. /web/legal?tab=...),
 * we use the query as a tie-breaker so the exact tab highlights. */
function hrefPath(href?: string): string {
  if (!href) return '';
  return href.split(/[?#]/)[0];
}

function hrefQueryTab(href?: string): string {
  if (!href) return '';
  const m = href.split('?')[1];
  if (!m) return '';
  return new URLSearchParams(m).get('tab') || '';
}

/**
 * Match the current URL against the nav and return the SINGLE best-matching
 * nav href (the original string from NAV, e.g. "/web/legal?tab=disclaimer" or
 * "/config"). Using the original href as the identity lets us tell apart items
 * that share a path but differ by query (the Legal tabs). We match on `asPath`
 * (real browser URL) since catch-all Web Tools pages share one file route.
 */
function findActive(asPath: string): { href: string | null; groupLabel: string | null } {
  const cleanPath = hrefPath(asPath);
  const currentTab = hrefQueryTab(asPath);
  let best: { href: string | null; groupLabel: string | null; score: number } = { href: null, groupLabel: null, score: -1 };
  const consider = (href: string | undefined, groupLabel: string | null) => {
    if (!href) return;
    const p = hrefPath(href);
    const pathMatch = cleanPath === p || cleanPath.startsWith(p + '/');
    if (!pathMatch) return;
    const navTab = hrefQueryTab(href);
    // If the nav href specifies a tab, it must match the current tab.
    if (navTab && navTab !== currentTab) return;
    // Score: longer path wins; a matching tab adds specificity.
    const score = p.length + (navTab ? 1000 : 0);
    if (score > best.score) best = { href, groupLabel, score };
  };
  for (const section of NAV) {
    for (const item of section.items || []) {
      consider(item.href, null); // top-level direct link → no group to open
      for (const c of item.children || []) {
        consider(c.href, item.label);
        for (const cc of c.children || []) consider(cc.href, item.label);
      }
    }
  }
  return { href: best.href, groupLabel: best.groupLabel };
}

/* ── Sub-item (level 2) ── */
function SubItem({ item, activeHref }: { item: NavChild; activeHref: string | null }) {
  const [open, setOpen] = useState(false);
  const isActive = !!activeHref && item.href === activeHref;
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <>
        <div
          className={`nav-sub-item ${open ? 'open' : ''}`}
          onClick={() => setOpen(!open)}
          style={{ justifyContent: 'space-between' }}
        >
          <span>{item.label}</span>
          <i className="bi bi-chevron-down nav-chevron" style={{
            fontSize: 10, transition: 'transform .25s',
            transform: open ? 'rotate(180deg)' : 'none',
            color: '#9ca3af', flexShrink: 0,
          }}></i>
        </div>
        {open && (
          <div className="nav-sub-sub-container">
            {item.children!.map(child => (
              <Link key={child.label} href={child.href || '#'}>
                <div className={`nav-sub-sub-item ${!!activeHref && child.href === activeHref ? 'active' : ''}`}>
                  {child.label}
                </div>
              </Link>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <Link href={item.href || '#'}>
      <div className={`nav-sub-item ${isActive ? 'active' : ''}`}>
        {item.label}
      </div>
    </Link>
  );
}

/* ── Nav item (level 1) ── */
function NavItemComp({ item, openKey, setOpenKey, activeHref }: {
  item: NavItem;
  openKey: string | null;
  setOpenKey: (k: string | null) => void;
  activeHref: string | null;
}) {
  const isOpen   = openKey === item.label;
  const isActive = !!activeHref && item.href === activeHref;
  const hasChildren = item.children && item.children.length > 0;

  if (!hasChildren && item.href) {
    return (
      <Link href={item.href}>
        <div className={`nav-item ${isActive ? 'active' : ''}`}>
          <i className={`bi ${item.icon} nav-item-icon`}></i>
          <span>{item.label}</span>
          {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
        </div>
      </Link>
    );
  }

  return (
    <>
      <div
        className={`nav-item ${isOpen ? 'open' : ''}`}
        onClick={() => setOpenKey(isOpen ? null : item.label)}
      >
        <i className={`bi ${item.icon} nav-item-icon`}></i>
        <span>{item.label}</span>
        {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
        <i className="bi bi-chevron-down nav-chevron"></i>
      </div>
      {isOpen && (
        <div className="nav-sub">
          <div className="nav-sub-container">
            {item.children?.map(child => (
              <SubItem key={child.label} item={child} activeHref={activeHref} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const branding = useBranding();
  const perms = usePermissions();
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Map notification type → HR sidebar item label that should show the badge.
  const TYPE_TO_LABEL: Record<string, string> = {
    leave: 'Leave Management',
    claim: 'Claim Management',
    overtime: 'Overtime Management',
    expense: 'Expenses Management',
  };
  const badgeFor = (label: string): number => {
    let n = 0;
    for (const [type, lbl] of Object.entries(TYPE_TO_LABEL)) {
      if (lbl === label) n += counts[type] || 0;
    }
    return n;
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setCounts(detail);
    };
    window.addEventListener('atline:notif-counts', handler as EventListener);
    // Initial fetch so badges appear without waiting for the bell's first poll.
    fetch('/api/notifications').then(r => r.json()).then(j => { if (j.success) setCounts(j.counts || {}); }).catch(() => {});
    return () => window.removeEventListener('atline:notif-counts', handler as EventListener);
  }, []);

  // Route-derived UI (open group + active highlight) must NOT differ between
  // the server render and the first client render, or React throws a hydration
  // mismatch. On statically-optimized pages `router.asPath` lacks the query
  // (and catch-all params) during prerender, so we defer all route-based state
  // until after mount.
  const [mounted, setMounted] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const activeHref = mounted ? findActive(router.asPath).href : '';
  useEffect(() => {
    setMounted(true);
    const grp = findActive(router.asPath).groupLabel;
    if (grp) setOpenKey(grp);
  }, [router.asPath]);

  // ── Permission filtering ──
  // While permissions are still loading, show everything to avoid an empty
  // sidebar flash. Once loaded, filter strictly. Super Admin sees all.
  const childVisible = (c: NavChild): boolean => {
    if (!perms.loaded) return true;
    if (c.permKey) return perms.canAccess(c.permKey);
    return true; // no permKey → always visible (safety net)
  };
  const itemVisible = (item: NavItem): boolean => {
    if (!perms.loaded) return true;
    if (item.children && item.children.length > 0) {
      return item.children.some(childVisible);
    }
    if (item.permKey) return perms.canAccess(item.permKey);
    return true;
  };

  const visibleNav: NavSection[] = NAV.map(section => {
    if (section.divider) return section;
    const items = (section.items || [])
      .filter(itemVisible)
      .map(item => item.children
        ? { ...item, children: item.children.filter(childVisible) }
        : item);
    return { ...section, items };
  }).filter(section => section.divider || (section.items && section.items.length > 0));

  // Drop redundant dividers — leading, trailing, or consecutive — so no
  // orphan separator lines show when sections are hidden by permissions.
  const cleanedNav: NavSection[] = visibleNav.filter((section, i, arr) => {
    if (!section.divider) return true;
    // find previous kept content section
    const prevHasContent = arr.slice(0, i).some(s => !s.divider && s.items && s.items.length > 0);
    const nextHasContent = arr.slice(i + 1).some(s => !s.divider && s.items && s.items.length > 0);
    if (!prevHasContent || !nextHasContent) return false; // leading / trailing
    // collapse consecutive dividers — keep only if the immediately preceding
    // kept entry is a content section
    const prevKept = arr.slice(0, i).reverse().find(s => s.divider || (s.items && s.items.length > 0));
    if (prevKept && prevKept.divider) return false;
    return true;
  });

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        {branding.sidebar_logo ? (
          <img src={branding.sidebar_logo} alt="ATLINE" style={{ maxHeight: 38, maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <>
            <div className="sidebar-brand-icon">
              <i className="bi bi-building-fill"></i>
            </div>
            <div className="sidebar-brand-text">
              <strong>ATLINE</strong>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {cleanedNav.map((section, si) => (
          <div key={si}>
            {section.divider && <div className="sidebar-divider"></div>}
            {section.section && (
              <div className="sidebar-section-label">{section.section}</div>
            )}
            {section.items?.map(item => {
              const b = badgeFor(item.label);
              return (
                <NavItemComp
                  key={item.label}
                  item={b > 0 ? { ...item, badge: b } : item}
                  openKey={openKey}
                  setOpenKey={setOpenKey}
                  activeHref={activeHref}
                />
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
