'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

/* ── Types ── */
export type EmployeeFormData = {
  full_name: string; nric_passport: string; gender: string; marital_status: string;
  race: string; religion: string; nationality: string; date_of_birth: string;
  email: string; phone: string;
  address: string; city: string; state: string; postcode: string; country: string;
  emergency_name: string; emergency_relationship: string; emergency_phone: string;
  department_id: string; position_id: string; employment_type_id: string;
  join_date: string; confirm_date: string; work_location: string; reporting_to: string;
  employee_status: string;
  basic_salary: string; bank_id: string; bank_account_no: string;
  epf_no: string; socso_no: string; income_tax_no: string;
  fixed_allowance: string;
};

type Option = { id: number; name: string };
type DropOption = { id: number; category: string; value: string };

const EMPTY: EmployeeFormData = {
  full_name: '', nric_passport: '', gender: '', marital_status: '',
  race: '', religion: '', nationality: '', date_of_birth: '',
  email: '', phone: '',
  address: '', city: '', state: '', postcode: '', country: '',
  emergency_name: '', emergency_relationship: '', emergency_phone: '',
  department_id: '', position_id: '', employment_type_id: '',
  join_date: '', confirm_date: '', work_location: '', reporting_to: '',
  employee_status: 'Active',
  basic_salary: '', bank_id: '', bank_account_no: '',
  epf_no: '', socso_no: '', income_tax_no: '',
  fixed_allowance: '',
};

/* ── Row helper (label left / full-width field right) ── */
function Row({ label, req, hint, last, children }: {
  label: string; req?: boolean; hint?: string; last?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`usr-form-row${last ? ' usr-form-row-last' : ''}`}>
      <label className="usr-form-label" style={{ paddingTop: 8 }}>
        {label} {req && <span>*</span>}
        {hint && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 2 }}>{hint}</div>}
      </label>
      <div className="usr-form-field">{children}</div>
    </div>
  );
}

const STEPS = [
  { key: 1, label: 'Personal Info',  icon: 'bi-person-fill' },
  { key: 2, label: 'Employment',     icon: 'bi-briefcase-fill' },
  { key: 3, label: 'Salary & Bank',  icon: 'bi-cash-stack' },
];

type Props = {
  mode: 'create' | 'edit';
  employeeId?: number;
  initial?: Partial<EmployeeFormData>;
  employeeCode?: string;
};

export default function EmployeeForm({ mode, employeeId, initial, employeeCode }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<EmployeeFormData>({ ...EMPTY, ...initial });

  const [departments, setDepartments]   = useState<Option[]>([]);
  const [positions, setPositions]       = useState<(Option & { department_id: number | null })[]>([]);
  const [empTypes, setEmpTypes]         = useState<Option[]>([]);
  const [banks, setBanks]               = useState<Option[]>([]);
  const [genders, setGenders]           = useState<DropOption[]>([]);
  const [maritals, setMaritals]         = useState<DropOption[]>([]);
  const [races, setRaces]               = useState<DropOption[]>([]);
  const [religions, setReligions]       = useState<DropOption[]>([]);
  const [nationalities, setNationalities] = useState<DropOption[]>([]);
  const [empStatuses, setEmpStatuses]   = useState<DropOption[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k: keyof EmployeeFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Load master data
  useEffect(() => {
    Promise.all([
      fetch('/api/hr/departments').then(r => r.json()),
      fetch('/api/hr/positions').then(r => r.json()),
      fetch('/api/hr/employment-types').then(r => r.json()),
      fetch('/api/hr/banks').then(r => r.json()),
      fetch('/api/hr/dropdowns').then(r => r.json()),
    ]).then(([d, p, t, b, dd]) => {
      if (d.success)  setDepartments(d.data.filter((x: any) => x.status === 'Active'));
      if (p.success)  setPositions(p.data.filter((x: any) => x.status === 'Active'));
      if (t.success)  setEmpTypes(t.data.filter((x: any) => x.status === 'Active'));
      if (b.success)  setBanks(b.data.filter((x: any) => x.status === 'Active'));
      if (dd.success) {
        const act = dd.data.filter((x: any) => x.status === 'Active');
        setGenders(act.filter((x: DropOption) => x.category === 'gender'));
        setMaritals(act.filter((x: DropOption) => x.category === 'marital_status'));
        setRaces(act.filter((x: DropOption) => x.category === 'race'));
        setReligions(act.filter((x: DropOption) => x.category === 'religion'));
        setNationalities(act.filter((x: DropOption) => x.category === 'nationality'));
        setEmpStatuses(act.filter((x: DropOption) => x.category === 'employee_status'));
      }
    }).catch(() => { /* silent */ });
  }, []);

  // positions filtered by selected department
  const availablePositions = form.department_id
    ? positions.filter(p => String(p.department_id) === form.department_id)
    : positions;

  const validateStep1 = () => {
    if (!form.full_name.trim()) { setError('Full name is required.'); setStep(1); return false; }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validateStep1()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        department_id:      form.department_id || null,
        position_id:        form.position_id || null,
        employment_type_id: form.employment_type_id || null,
        bank_id:            form.bank_id || null,
      };
      const url    = mode === 'edit' ? `/api/hr/employees/${employeeId}` : '/api/hr/employees';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) router.push('/hr/employee');
      else setError(json.message || 'Failed to save employee.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      {/* Step indicator */}
      <div className="emp-steps mb-4">
        {STEPS.map((s, i) => (
          <div key={s.key} className="emp-step-wrap">
            <button
              type="button"
              className={`emp-step${step === s.key ? ' active' : ''}${step > s.key ? ' done' : ''}`}
              onClick={() => setStep(s.key)}
            >
              <span className="emp-step-num">
                {step > s.key ? <i className="bi bi-check-lg"></i> : <i className={`bi ${s.icon}`}></i>}
              </span>
              <span className="emp-step-label">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`emp-step-line${step > s.key ? ' done' : ''}`}></div>}
          </div>
        ))}
      </div>

      {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

      {/* ── Step 1: Personal ── */}
      {step === 1 && (
        <>
          <div className="int-card">
            <div className="int-card-title"><i className="bi bi-person-fill"></i> Personal Information</div>
            {mode === 'edit' && employeeCode && (
              <Row label="Employee ID">
                <input className="rm-input" style={{ fontFamily: 'monospace' }} value={employeeCode} disabled />
              </Row>
            )}
            <Row label="Full Name" req>
              <input className="rm-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="As per NRIC / Passport" />
            </Row>
            <Row label="NRIC / Passport No.">
              <input className="rm-input" value={form.nric_passport} onChange={e => set('nric_passport', e.target.value)} placeholder="e.g. 900101-01-1234" />
            </Row>
            <Row label="Gender">
              <select className="rm-input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">— Select —</option>
                {genders.map(g => <option key={g.id} value={g.value}>{g.value}</option>)}
              </select>
            </Row>
            <Row label="Marital Status">
              <select className="rm-input" value={form.marital_status} onChange={e => set('marital_status', e.target.value)}>
                <option value="">— Select —</option>
                {maritals.map(m => <option key={m.id} value={m.value}>{m.value}</option>)}
              </select>
            </Row>
            <Row label="Race">
              <select className="rm-input" value={form.race} onChange={e => set('race', e.target.value)}>
                <option value="">— Select —</option>
                {races.map(r => <option key={r.id} value={r.value}>{r.value}</option>)}
              </select>
            </Row>
            <Row label="Religion">
              <select className="rm-input" value={form.religion} onChange={e => set('religion', e.target.value)}>
                <option value="">— Select —</option>
                {religions.map(r => <option key={r.id} value={r.value}>{r.value}</option>)}
              </select>
            </Row>
            <Row label="Nationality">
              <select className="rm-input" value={form.nationality} onChange={e => set('nationality', e.target.value)}>
                <option value="">— Select —</option>
                {nationalities.map(n => <option key={n.id} value={n.value}>{n.value}</option>)}
              </select>
            </Row>
            <Row label="Date of Birth">
              <input type="date" className="rm-input" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
            </Row>
            <Row label="Email Address">
              <input type="email" className="rm-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </Row>
            <Row label="Phone Number" last>
              <input className="rm-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="01X-XXX XXXX" />
            </Row>
          </div>

          <div className="int-card">
            <div className="int-card-title"><i className="bi bi-geo-alt-fill"></i> Address</div>
            <Row label="Address">
              <textarea className="rm-input" rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" />
            </Row>
            <Row label="City">
              <input className="rm-input" value={form.city} onChange={e => set('city', e.target.value)} />
            </Row>
            <Row label="State">
              <input className="rm-input" value={form.state} onChange={e => set('state', e.target.value)} />
            </Row>
            <Row label="Postcode">
              <input className="rm-input" value={form.postcode} onChange={e => set('postcode', e.target.value)} />
            </Row>
            <Row label="Country" last>
              <input className="rm-input" value={form.country} onChange={e => set('country', e.target.value)} />
            </Row>
          </div>

          <div className="int-card">
            <div className="int-card-title"><i className="bi bi-telephone-fill"></i> Emergency Contact</div>
            <Row label="Contact Name">
              <input className="rm-input" value={form.emergency_name} onChange={e => set('emergency_name', e.target.value)} placeholder="Full name" />
            </Row>
            <Row label="Relationship">
              <input className="rm-input" value={form.emergency_relationship} onChange={e => set('emergency_relationship', e.target.value)} placeholder="e.g. Spouse, Parent" />
            </Row>
            <Row label="Contact Phone" last>
              <input className="rm-input" value={form.emergency_phone} onChange={e => set('emergency_phone', e.target.value)} placeholder="01X-XXX XXXX" />
            </Row>
          </div>
        </>
      )}

      {/* ── Step 2: Employment ── */}
      {step === 2 && (
        <div className="int-card">
          <div className="int-card-title"><i className="bi bi-briefcase-fill"></i> Employment Information</div>
          <Row label="Department">
            <select className="rm-input" value={form.department_id} onChange={e => { set('department_id', e.target.value); set('position_id', ''); }}>
              <option value="">— Select Department —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Row>
          <Row label="Position" hint={form.department_id ? undefined : 'Select a department first to filter positions'}>
            <select className="rm-input" value={form.position_id} onChange={e => set('position_id', e.target.value)}>
              <option value="">— Select Position —</option>
              {availablePositions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Row>
          <Row label="Employment Type">
            <select className="rm-input" value={form.employment_type_id} onChange={e => set('employment_type_id', e.target.value)}>
              <option value="">— Select Type —</option>
              {empTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Row>
          <Row label="Work Location">
            <input className="rm-input" value={form.work_location} onChange={e => set('work_location', e.target.value)} placeholder="e.g. HQ Petaling Jaya" />
          </Row>
          <Row label="Reporting To">
            <input className="rm-input" value={form.reporting_to} onChange={e => set('reporting_to', e.target.value)} placeholder="e.g. Manager name" />
          </Row>
          <Row label="Join Date">
            <input type="date" className="rm-input" value={form.join_date} onChange={e => set('join_date', e.target.value)} />
          </Row>
          <Row label="Confirmation Date">
            <input type="date" className="rm-input" value={form.confirm_date} onChange={e => set('confirm_date', e.target.value)} />
          </Row>
          <Row label="Employee Status" last>
            <select className="rm-input" value={form.employee_status} onChange={e => set('employee_status', e.target.value)}>
              {empStatuses.length === 0 && <option value="Active">Active</option>}
              {empStatuses.map(s => <option key={s.id} value={s.value}>{s.value}</option>)}
            </select>
          </Row>
        </div>
      )}

      {/* ── Step 3: Salary & Bank ── */}
      {step === 3 && (
        <div className="int-card">
          <div className="int-card-title"><i className="bi bi-cash-stack"></i> Salary &amp; Bank Information</div>
          <Row label="Basic Salary (RM)">
            <input type="number" step="0.01" className="rm-input" value={form.basic_salary} onChange={e => set('basic_salary', e.target.value)} placeholder="0.00" />
          </Row>
          <Row label="Fixed Allowances (RM)" hint="Recurring monthly allowance added to gross salary">
            <input type="number" step="0.01" className="rm-input" value={form.fixed_allowance} onChange={e => set('fixed_allowance', e.target.value)} placeholder="0.00" />
          </Row>
          <Row label="Bank">
            <select className="rm-input" value={form.bank_id} onChange={e => set('bank_id', e.target.value)}>
              <option value="">— Select Bank —</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Row>
          <Row label="Bank Account No.">
            <input className="rm-input" value={form.bank_account_no} onChange={e => set('bank_account_no', e.target.value)} />
          </Row>
          <Row label="EPF No.">
            <input className="rm-input" value={form.epf_no} onChange={e => set('epf_no', e.target.value)} />
          </Row>
          <Row label="SOCSO No.">
            <input className="rm-input" value={form.socso_no} onChange={e => set('socso_no', e.target.value)} />
          </Row>
          <Row label="Income Tax No." last>
            <input className="rm-input" value={form.income_tax_no} onChange={e => set('income_tax_no', e.target.value)} />
          </Row>
        </div>
      )}

      {/* Footer navigation */}
      <div className="int-footer d-flex justify-content-between">
        <div>
          {step > 1 && (
            <button type="button" className="rm-btn-outline" onClick={() => setStep(step - 1)}>
              <i className="bi bi-arrow-left"></i> Previous
            </button>
          )}
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="rm-btn-outline" onClick={() => router.push('/hr/employee')}>Cancel</button>
          {step < 3 ? (
            <button type="button" className="rm-btn-primary" onClick={() => { if (step === 1 && !validateStep1()) return; setError(''); setStep(step + 1); }}>
              Next <i className="bi bi-arrow-right"></i>
            </button>
          ) : (
            <button type="button" className="rm-btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-floppy-fill"></i> {mode === 'edit' ? 'Save Changes' : 'Create Employee'}</>}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
