/* ── Shared constants for Roles pages ───────────────────────────────
 * Single source of truth for the Permission Matrix.
 * The module tree mirrors the sidebar (components/Sidebar.tsx) exactly,
 * including the tabs inside each page as sub-rows.
 *
 * Permission columns use the CRUD vocabulary plus verified extras:
 *   Create · Read · Update · Delete · Approve · Reject · Export · Print
 * Each module only enables the permissions that actually exist on its
 * page (everything else renders as "—" / not applicable).
 * ------------------------------------------------------------------- */

export const PERMISSIONS = [
  'Create', 'Read', 'Update', 'Delete', 'Approve', 'Reject', 'Export', 'Print',
] as const;

export type Permission = typeof PERMISSIONS[number];

export type Module = {
  key: string;          // unique key — used as the matrix key + stored in DB
  label: string;        // display label
  level?: number;       // 1 = module, 2 = tab, 3 = sub-tab (for indentation)
  section?: boolean;    // true = blue section header (no checkboxes)
  group?: boolean;      // true = parent label only (has children, no checkboxes)
  perms: string[];      // applicable permissions for this row
};

const CRUD = ['Create', 'Read', 'Update', 'Delete'];

export const MODULES: Module[] = [
  /* ── Dashboard ── */
  { key: 'dashboard', label: 'Dashboard', level: 1, perms: ['Read'] },

  /* ── Application ── */
  { key: 'sec.application', label: 'Application', section: true, perms: [] },
  { key: 'app.procurement',        label: 'Procurement',        level: 1, perms: ['Read', 'Update', 'Approve', 'Reject', 'Delete'] },
  { key: 'app.strategic_partner',  label: 'Strategic Partner',  level: 1, perms: ['Read', 'Update', 'Approve', 'Reject', 'Delete'] },

  /* ── Human Resources ── */
  { key: 'sec.hr', label: 'Human Resources', section: true, perms: [] },

  { key: 'hr.career', label: 'Career', level: 1, group: true, perms: [] },
  { key: 'hr.career.postings',   label: 'Career Postings', level: 2, perms: ['Create', 'Read', 'Update', 'Delete'] },
  { key: 'hr.career.applicants', label: 'Applicants',      level: 2, perms: ['Read', 'Update', 'Approve', 'Reject'] },
  { key: 'hr.career.archive',    label: 'Archive',         level: 2, perms: ['Read', 'Update', 'Delete'] },

  { key: 'hr.employee', label: 'Employee Management', level: 1, group: true, perms: [] },
  { key: 'hr.employee.list',     label: 'Employee List', level: 2, perms: ['Create', 'Read', 'Update', 'Delete', 'Export'] },
  { key: 'hr.employee.settings', label: 'Settings',      level: 2, group: true, perms: [] },
  { key: 'hr.employee.settings.departments',      label: 'Departments',      level: 3, perms: CRUD },
  { key: 'hr.employee.settings.positions',        label: 'Positions',        level: 3, perms: CRUD },
  { key: 'hr.employee.settings.employment_types', label: 'Employment Types', level: 3, perms: CRUD },
  { key: 'hr.employee.settings.banks',            label: 'Banks',            level: 3, perms: CRUD },
  { key: 'hr.employee.settings.dropdowns',        label: 'Dropdown Options', level: 3, perms: CRUD },
  { key: 'hr.employee.settings.general',          label: 'General',          level: 3, perms: ['Read', 'Update'] },

  { key: 'hr.leave', label: 'Leave Management', level: 1, group: true, perms: [] },
  { key: 'hr.leave.application',       label: 'Leave Application', level: 2, perms: ['Create', 'Read', 'Update', 'Delete', 'Approve', 'Reject', 'Export'] },
  { key: 'hr.leave.settings',          label: 'Settings',          level: 2, group: true, perms: [] },
  { key: 'hr.leave.settings.types',    label: 'Leave Types',       level: 3, perms: CRUD },
  { key: 'hr.leave.settings.approval', label: 'Approval Workflow', level: 3, perms: ['Read', 'Update'] },

  { key: 'hr.claim', label: 'Claim Management', level: 1, group: true, perms: [] },
  { key: 'hr.claim.application',       label: 'Claim Application', level: 2, perms: ['Create', 'Read', 'Update', 'Delete', 'Approve', 'Reject', 'Export'] },
  { key: 'hr.claim.settings',          label: 'Settings',          level: 2, group: true, perms: [] },
  { key: 'hr.claim.settings.types',    label: 'Claim Types',       level: 3, perms: CRUD },
  { key: 'hr.claim.settings.approval', label: 'Approval Workflow', level: 3, perms: ['Read', 'Update'] },

  { key: 'hr.overtime', label: 'Overtime Management', level: 1, group: true, perms: [] },
  { key: 'hr.overtime.application',       label: 'Overtime Application', level: 2, perms: ['Create', 'Read', 'Update', 'Delete', 'Approve', 'Reject', 'Export'] },
  { key: 'hr.overtime.settings',          label: 'Settings',             level: 2, group: true, perms: [] },
  { key: 'hr.overtime.settings.rates',    label: 'Overtime Rates',       level: 3, perms: CRUD },
  { key: 'hr.overtime.settings.approval', label: 'Approval Workflow',    level: 3, perms: ['Read', 'Update'] },

  { key: 'hr.expenses', label: 'Expenses Management', level: 1, group: true, perms: [] },
  { key: 'hr.expenses.application',         label: 'Expenses Application', level: 2, perms: ['Create', 'Read', 'Update', 'Delete', 'Approve', 'Reject', 'Export'] },
  { key: 'hr.expenses.settings',            label: 'Settings',             level: 2, group: true, perms: [] },
  { key: 'hr.expenses.settings.categories', label: 'Expense Categories',   level: 3, perms: CRUD },
  { key: 'hr.expenses.settings.approval',   label: 'Approval Workflow',    level: 3, perms: ['Read', 'Update'] },

  { key: 'hr.kpi', label: 'KPI', level: 1, group: true, perms: [] },
  { key: 'hr.kpi.templates',    label: 'KPI Templates',    level: 2, perms: CRUD },
  { key: 'hr.kpi.periods',      label: 'KPI Periods',      level: 2, perms: CRUD },
  { key: 'hr.kpi.assignments',  label: 'KPI Assignments',  level: 2, perms: CRUD },
  { key: 'hr.kpi.reviews',      label: 'KPI Reviews',      level: 2, perms: ['Read', 'Update', 'Approve'] },
  { key: 'hr.kpi.results',      label: 'KPI Results',      level: 2, perms: ['Read', 'Update', 'Export'] },
  { key: 'hr.kpi.competencies', label: 'KPI Competencies', level: 2, perms: CRUD },
  { key: 'hr.kpi.grade_bands',  label: 'KPI Grade Bands',  level: 2, perms: CRUD },

  { key: 'hr.payroll', label: 'Payroll & Compensation', level: 1, group: true, perms: [] },
  { key: 'hr.payroll.periods',    label: 'Payroll Periods',       level: 2, perms: ['Create', 'Read', 'Update', 'Delete', 'Approve', 'Print'] },
  { key: 'hr.payroll.allowance',  label: 'Allowance Management',  level: 2, perms: CRUD },
  { key: 'hr.payroll.bonus',      label: 'Bonus Management',      level: 2, perms: CRUD },
  { key: 'hr.payroll.commission', label: 'Commission Management', level: 2, perms: CRUD },
  { key: 'hr.payroll.loan',       label: 'Loan Management',       level: 2, perms: CRUD },
  { key: 'hr.payroll.advances',   label: 'Advances Management',   level: 2, perms: CRUD },
  { key: 'hr.payroll.settings',   label: 'Settings Payroll',      level: 2, perms: ['Read', 'Update'] },

  /* ── Web Tools ── */
  { key: 'sec.web', label: 'Web Tools', section: true, perms: [] },

  { key: 'web.home', label: 'Home', level: 1, perms: ['Read', 'Update'] },

  { key: 'web.about', label: 'About', level: 1, group: true, perms: [] },
  { key: 'web.about.about_us',        label: 'About Us',         level: 2, perms: ['Read', 'Update'] },
  { key: 'web.about.vision_mission',  label: 'Vision & Mission', level: 2, perms: ['Read', 'Update'] },
  { key: 'web.about.certifications',  label: 'Certifications',   level: 2, perms: ['Read', 'Update'] },

  { key: 'web.solutions', label: 'Solutions', level: 1, group: true, perms: [] },
  { key: 'web.solutions.structured_cabling',   label: 'Structured Cabling System',  level: 2, perms: ['Read', 'Update'] },
  { key: 'web.solutions.active_network',        label: 'Active Network Devices',     level: 2, perms: ['Read', 'Update'] },
  { key: 'web.solutions.network_peripherals',   label: 'Network Peripherals',        level: 2, perms: ['Read', 'Update'] },
  { key: 'web.solutions.ict_products',          label: 'ICT Products & Peripherals', level: 2, perms: ['Read', 'Update'] },

  { key: 'web.services', label: 'Services', level: 1, group: true, perms: [] },
  { key: 'web.services.consulting',          label: 'Consulting Services', level: 2, perms: ['Read', 'Update'] },
  { key: 'web.services.network_engineering', label: 'Network Engineering', level: 2, perms: ['Read', 'Update'] },
  { key: 'web.services.project_management',  label: 'Project Management',  level: 2, perms: ['Read', 'Update'] },
  { key: 'web.services.training',            label: 'Training & Workshop', level: 2, perms: ['Read', 'Update'] },

  { key: 'web.business', label: 'Business', level: 1, group: true, perms: [] },
  { key: 'web.business.tender',          label: 'Tender',              level: 2, group: true, perms: [] },
  { key: 'web.business.tender.content',  label: 'Page Content',        level: 3, perms: ['Read', 'Update'] },
  { key: 'web.business.tender.tenders',  label: 'Active Tenders',      level: 3, perms: ['Create', 'Read', 'Update', 'Delete', 'Export'] },
  { key: 'web.business.procurement',     label: 'Procurement',         level: 2, perms: ['Read', 'Update'] },
  { key: 'web.business.strategic_partners', label: 'Strategic Partners', level: 2, perms: ['Read', 'Update'] },

  { key: 'web.resources', label: 'Resources', level: 1, group: true, perms: [] },
  { key: 'web.resources.projects',         label: 'Projects',     level: 2, perms: CRUD },
  { key: 'web.resources.products',         label: 'Products',     level: 2, group: true, perms: [] },
  { key: 'web.resources.products.content', label: 'Page Content', level: 3, perms: ['Read', 'Update'] },
  { key: 'web.resources.products.items',   label: 'Product Table',level: 3, perms: ['Create', 'Read', 'Update', 'Delete', 'Export'] },
  { key: 'web.resources.achievement',      label: 'Achievement',  level: 2, perms: CRUD },
  { key: 'web.resources.gallery',          label: 'Gallery',      level: 2, group: true, perms: [] },
  { key: 'web.resources.gallery.content',  label: 'Page Content', level: 3, perms: ['Read', 'Update'] },
  { key: 'web.resources.gallery.albums',   label: 'Gallery',      level: 3, perms: ['Create', 'Read', 'Update', 'Delete', 'Export'] },
  { key: 'web.resources.download',         label: 'Forms & Documents', level: 2, group: true, perms: [] },
  { key: 'web.resources.download.content', label: 'Page Content',      level: 3, perms: ['Read', 'Update'] },
  { key: 'web.resources.download.files',   label: 'Forms & Documents', level: 3, perms: ['Create', 'Read', 'Update', 'Delete', 'Export'] },
  { key: 'web.resources.faq',              label: 'FAQ',          level: 2, perms: CRUD },
  { key: 'web.resources.circulars',        label: 'Circulars',    level: 2, perms: CRUD },
  { key: 'web.resources.vendors',          label: 'Vendors',      level: 2, perms: CRUD },

  { key: 'web.news', label: 'News', level: 1, perms: ['Create', 'Read', 'Update', 'Delete', 'Export'] },

  { key: 'web.legal', label: 'Legal', level: 1, group: true, perms: [] },
  { key: 'web.legal.privacy',    label: 'Privacy Policy',   level: 2, perms: ['Read', 'Update'] },
  { key: 'web.legal.terms',      label: 'Terms of Service', level: 2, perms: ['Read', 'Update'] },
  { key: 'web.legal.disclaimer', label: 'Disclaimer',       level: 2, perms: ['Read', 'Update'] },
  { key: 'web.legal.sitemap',    label: 'Sitemap',          level: 2, perms: CRUD },

  /* ── Operations ── */
  { key: 'sec.operations', label: 'Operations', section: true, perms: [] },

  { key: 'ops.tender',            label: 'Tender Management', level: 1, group: true, perms: [] },
  { key: 'ops.tender.list',       label: 'List of Tenders',   level: 2, perms: ['Create', 'Read', 'Update', 'Delete'] },
  { key: 'ops.tender.evaluation', label: 'Evaluation',        level: 2, perms: ['Read', 'Update'] },
  { key: 'ops.tender.awards',     label: 'Awards',            level: 2, perms: ['Read', 'Update'] },
  { key: 'ops.tender.archives',   label: 'Tender Archives',   level: 2, perms: ['Read'] },

  { key: 'ops.procurement', label: 'Procurement', level: 1, perms: ['Create', 'Read', 'Update', 'Delete', 'Export'] },

  { key: 'ops.business_dev',           label: 'Business Development', level: 1, group: true, perms: [] },
  { key: 'ops.business_dev.clients',   label: 'Client Database',      level: 2, perms: CRUD },
  { key: 'ops.business_dev.leads',     label: 'Leads & Prospects',    level: 2, perms: CRUD },
  { key: 'ops.business_dev.proposals', label: 'Proposals',            level: 2, perms: ['Create', 'Read', 'Update', 'Delete', 'Export'] },

  /* ── Settings ── */
  { key: 'sec.settings', label: 'Settings', section: true, perms: [] },

  { key: 'settings.config',              label: 'Global Config',        level: 1, group: true, perms: [] },
  { key: 'settings.config.general',      label: 'General',              level: 2, perms: ['Read', 'Update'] },
  { key: 'settings.config.branding',     label: 'Branding',             level: 2, perms: ['Read', 'Update'] },
  { key: 'settings.config.social_seo',   label: 'Social & SEO',         level: 2, perms: ['Read', 'Update'] },
  { key: 'settings.config.backup',       label: 'Backup & Restore',     level: 2, perms: ['Create', 'Read', 'Update', 'Delete', 'Export'] },
  { key: 'settings.config.maintenance',  label: 'Maintenance & Cache',  level: 2, perms: ['Read', 'Update'] },

  { key: 'settings.integration',          label: 'Integration',     level: 1, group: true, perms: [] },
  { key: 'settings.integration.email',    label: 'Email',           level: 2, perms: ['Read', 'Update'] },
  { key: 'settings.integration.api',      label: 'API & Webhook',   level: 2, perms: CRUD },
  { key: 'settings.integration.weather',  label: 'Weather & Tides', level: 2, perms: ['Read', 'Update'] },
  { key: 'settings.integration.holidays', label: 'Public Holidays', level: 2, perms: CRUD },
  { key: 'settings.integration.payments', label: 'Payments',        level: 2, perms: ['Read', 'Update'] },
  { key: 'settings.integration.sms',      label: 'SMS',             level: 2, perms: ['Read', 'Update'] },
  { key: 'settings.integration.telegram', label: 'Telegram',        level: 2, perms: ['Read', 'Update'] },
  { key: 'settings.integration.recycle_bin', label: 'Recycle Bin',  level: 2, perms: ['Read', 'Update', 'Delete'] },

  { key: 'settings.roles', label: 'Roles Management', level: 1, perms: CRUD },

  { key: 'settings.users',               label: 'Users Management', level: 1, group: true, perms: [] },
  { key: 'settings.users.administrator', label: 'Administrator',    level: 2, perms: CRUD },
  { key: 'settings.users.staff',         label: 'Staff',            level: 2, perms: CRUD },
  { key: 'settings.users.client',        label: 'Client',           level: 2, perms: CRUD },

  { key: 'settings.logs',          label: 'Activity Logs', level: 1, group: true, perms: [] },
  { key: 'settings.logs.activity', label: 'Activity',      level: 2, perms: ['Read', 'Export'] },
  { key: 'settings.logs.audit',    label: 'Audit',         level: 2, perms: ['Read', 'Export'] },
];

export type PermMatrix = Record<string, Record<string, boolean>>;

/* Only rows that actually have permissions take part in the matrix. */
const PERM_MODULES = MODULES.filter(m => !m.section && !m.group && m.perms.length > 0);

export function initMatrix(prefill?: PermMatrix): PermMatrix {
  const m: PermMatrix = {};
  PERM_MODULES.forEach(mod => {
    m[mod.key] = {};
    PERMISSIONS.forEach(p => {
      m[mod.key][p] = mod.perms.includes(p) ? (prefill?.[mod.key]?.[p] ?? false) : false;
    });
  });
  return m;
}

export function selectAllMatrix(): PermMatrix {
  const m: PermMatrix = {};
  PERM_MODULES.forEach(mod => {
    m[mod.key] = {};
    PERMISSIONS.forEach(p => { m[mod.key][p] = mod.perms.includes(p); });
  });
  return m;
}
