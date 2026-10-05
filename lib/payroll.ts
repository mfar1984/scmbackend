// ============================================================
// Payroll calculation helpers (Malaysia statutory: EPF / SOCSO / EIS)
// Pure JS — no external deps. Used by the period "process" endpoint.
// ============================================================
import db from '@/lib/db';

export type PayrollRates = {
  epf_employee: number;   // %
  epf_employer: number;   // %
  socso_employee: number; // %
  socso_employer: number; // %
  eis_rate: number;       // % (both employee & employer share same default)
};

const monthIndex: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

export function monthName(m: any): string {
  const n = parseInt(String(m));
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  if (!isNaN(n) && n >= 1 && n <= 12) return names[n - 1];
  return String(m || '');
}

// Resolve period start/end dates from {month(name|num), year}
export function periodRange(month: any, year: any): { start: string | null; end: string | null } {
  const y = parseInt(String(year));
  let mi = monthIndex[String(month).toLowerCase()];
  if (mi == null) { const n = parseInt(String(month)); if (!isNaN(n)) mi = n - 1; }
  if (isNaN(y) || mi == null || mi < 0 || mi > 11) return { start: null, end: null };
  const start = new Date(Date.UTC(y, mi, 1));
  const end = new Date(Date.UTC(y, mi + 1, 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

export async function getRates(): Promise<PayrollRates> {
  const rows = await db('hr_payroll_settings').select('key', 'value');
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value || '';
  const num = (v: any, d: number) => { const n = parseFloat(v); return isNaN(n) ? d : n; };
  return {
    epf_employee: num(m.epf_employee_rate, 11),
    epf_employer: num(m.epf_employer_rate, 13),
    socso_employee: num(m.socso_employee_rate, 0.5),
    socso_employer: num(m.socso_employer_rate, 1.75),
    eis_rate: num(m.eis_rate, 0.2),
  };
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type PayslipCalc = {
  basic_salary: number; allowances: number; bonus: number; commission: number;
  overtime: number; claims: number; gross_salary: number;
  epf_employee: number; socso_employee: number; eis_employee: number;
  loan_deduction: number; advance_deduction: number; total_deductions: number;
  epf_employer: number; socso_employer: number; eis_employer: number;
  net_salary: number; earnings_json: string;
};

// Compute one employee's payslip for a period range.
export async function computePayslip(emp: any, range: { start: string | null; end: string | null }, rates: PayrollRates, periodId: number): Promise<PayslipCalc> {
  const empId = emp.id;
  const basic = parseFloat(emp.basic_salary) || 0;

  // Fixed allowance on the employee record
  const fixedAllow = parseFloat(emp.fixed_allowance) || 0;

  // Recurring active allowances (Housing + Transport + Meal + Other)
  const allowRows = await db('hr_allowances')
    .where({ employee_id: empId, status: 'Active' })
    .select(
      db.raw('COALESCE(SUM(housing),0) as housing'),
      db.raw('COALESCE(SUM(transport),0) as transport'),
      db.raw('COALESCE(SUM(meal),0) as meal'),
      db.raw('COALESCE(SUM(other_allowance),0) as other_allowance'),
    ).first();
  const recurringAllow = (parseFloat(allowRows?.housing) || 0) + (parseFloat(allowRows?.transport) || 0)
    + (parseFloat(allowRows?.meal) || 0) + (parseFloat(allowRows?.other_allowance) || 0);
  const allowances = r2(fixedAllow + recurringAllow);

  // Bonus tied to THIS period (preferred) OR approved within range
  let bonus = 0;
  {
    const byPeriod = await db('hr_bonuses').where({ employee_id: empId, period_id: periodId })
      .whereIn('status', ['Approved', 'Paid', 'Pending'])
      .sum({ total: 'amount' }).first();
    bonus = parseFloat(byPeriod?.total) || 0;
    if (bonus === 0 && range.start && range.end) {
      const b = await db('hr_bonuses').where({ employee_id: empId })
        .whereNull('period_id')
        .whereIn('status', ['Approved', 'Paid'])
        .whereBetween('bonus_date', [range.start, range.end])
        .sum({ total: 'amount' }).first();
      bonus = parseFloat(b?.total) || 0;
    }
  }

  // Commission tied to THIS period OR approved within range
  let commission = 0;
  {
    const byPeriod = await db('hr_commissions').where({ employee_id: empId, period_id: periodId })
      .whereIn('status', ['Approved', 'Paid', 'Pending'])
      .sum({ total: 'amount' }).first();
    commission = parseFloat(byPeriod?.total) || 0;
    if (commission === 0 && range.start && range.end) {
      const c = await db('hr_commissions').where({ employee_id: empId })
        .whereNull('period_id')
        .whereIn('status', ['Approved', 'Paid'])
        .whereBetween('commission_date', [range.start, range.end])
        .sum({ total: 'amount' }).first();
      commission = parseFloat(c?.total) || 0;
    }
  }

  // Approved overtime within the period: hours * (basic/26/8) * multiplier
  let overtime = 0;
  if (range.start && range.end) {
    const otRows = await db('hr_overtime_applications as o')
      .leftJoin('hr_overtime_rates as r', 'r.id', 'o.ot_rate_id')
      .where('o.employee_id', empId)
      .where('o.status', 'Approved')
      .whereBetween('o.ot_date', [range.start, range.end])
      .select('o.hours', 'r.multiplier');
    const hourlyRate = basic > 0 ? basic / 26 / 8 : 0;
    for (const o of otRows) {
      const h = parseFloat(o.hours) || 0;
      const mult = parseFloat(o.multiplier) || 1.5;
      overtime += h * hourlyRate * mult;
    }
    overtime = r2(overtime);
  }

  // Approved claims within the period (reimbursement, added to net via earnings)
  let claims = 0;
  if (range.start && range.end) {
    const cl = await db('hr_claim_applications').where({ employee_id: empId })
      .whereIn('status', ['Approved', 'Paid'])
      .whereBetween('claim_date', [range.start, range.end])
      .sum({ total: 'amount' }).first();
    claims = parseFloat(cl?.total) || 0;
  }

  const gross = r2(basic + allowances + bonus + commission + overtime + claims);

  // ── Statutory deductions (based on basic + allowances + bonus, excluding claims reimbursement) ──
  const contribBase = r2(basic + allowances + bonus + commission + overtime);
  const epfEmp = r2(contribBase * rates.epf_employee / 100);
  const epfEmployer = r2(contribBase * rates.epf_employer / 100);
  const socsoEmp = r2(contribBase * rates.socso_employee / 100);
  const socsoEmployer = r2(contribBase * rates.socso_employer / 100);
  const eisEmp = r2(contribBase * rates.eis_rate / 100);
  const eisEmployer = r2(contribBase * rates.eis_rate / 100);

  // Active loans — deduct monthly only while installments remain (self-running)
  const loanRows = await db('hr_loans')
    .where({ employee_id: empId, status: 'Active' })
    .whereRaw('paid_installments < total_installments')
    .select('monthly_deduction');
  let loanDed = 0;
  for (const l of loanRows) loanDed += parseFloat(l.monthly_deduction) || 0;
  loanDed = r2(loanDed);

  // Active salary advances — deduct monthly only while months remain (self-running)
  const advRows = await db('hr_advances')
    .where({ employee_id: empId, status: 'Approved' })
    .whereRaw('paid_months < repayment_months')
    .select('monthly_deduction');
  let advanceDed = 0;
  for (const a of advRows) advanceDed += parseFloat(a.monthly_deduction) || 0;
  advanceDed = r2(advanceDed);

  const totalDed = r2(epfEmp + socsoEmp + eisEmp + loanDed + advanceDed);
  const net = r2(gross - totalDed);

  const earnings_json = JSON.stringify({
    lines: [
      { label: 'Basic Salary', amount: basic },
      { label: 'Allowances', amount: allowances },
      { label: 'Bonus', amount: bonus },
      { label: 'Commission', amount: commission },
      { label: 'Overtime', amount: overtime },
      { label: 'Claims Reimbursement', amount: claims },
    ],
  });

  return {
    basic_salary: r2(basic), allowances, bonus: r2(bonus), commission: r2(commission),
    overtime, claims: r2(claims), gross_salary: gross,
    epf_employee: epfEmp, socso_employee: socsoEmp, eis_employee: eisEmp,
    loan_deduction: r2(loanDed), advance_deduction: r2(advanceDed), total_deductions: totalDed,
    epf_employer: epfEmployer, socso_employer: socsoEmployer, eis_employer: eisEmployer,
    net_salary: net, earnings_json,
  };
}
