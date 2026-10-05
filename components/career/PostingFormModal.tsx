'use client';
import { useState, useEffect } from 'react';
import type { Posting } from '../../pages/hr/career/postings';

const ICON_THEMES = [
  { key: 'it',          label: 'Laptop (IT/Tech)',       icon: 'bi-laptop' },
  { key: 'sales',       label: 'Graph Up (Sales)',       icon: 'bi-graph-up-arrow' },
  { key: 'hr',          label: 'People (HR)',            icon: 'bi-people-fill' },
  { key: 'engineering', label: 'Tools (Engineering)',    icon: 'bi-tools' },
  { key: 'technical',   label: 'Gear (Technical)',       icon: 'bi-gear-fill' },
  { key: 'general',     label: 'Briefcase (General)',    icon: 'bi-briefcase-fill' },
];

type Opt = { id: number; name: string };
type PosOpt = Opt & { department_id: number | null };
type DropOpt = { id: number; category: string; value: string };

type Props = {
  mode: 'create' | 'edit';
  data?: Posting;
  onClose: () => void;
  onSaved: () => void;
};

function Field({ label, req, children, full }: { label: string; req?: boolean; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={{ flex: full ? '1 1 100%' : '1 1 240px', minWidth: 0 }}>
      <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>{label} {req && <span style={{ color: '#ef4444' }}>*</span>}</label>
      {children}
    </div>
  );
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function PostingFormModal({ mode, data, onClose, onSaved }: Props) {
  const [f, setF] = useState({
    position_id: (data as any)?.position_id != null ? String((data as any).position_id) : '',
    title: data?.title || '',
    department_id: (data as any)?.department_id != null ? String((data as any).department_id) : '',
    department: data?.department || '',
    location: data?.location || '',
    job_type: data?.job_type || 'Full Time',
    employment_type_id: (data as any)?.employment_type_id != null ? String((data as any).employment_type_id) : '',
    employment_type: data?.employment_type || 'Permanent',
    min_salary: data?.min_salary != null ? String(data.min_salary) : '',
    max_salary: data?.max_salary != null ? String(data.max_salary) : '',
    salary_notes: data?.salary_notes || '',
    min_experience: data?.min_experience != null ? String(data.min_experience) : '',
    max_experience: data?.max_experience != null ? String(data.max_experience) : '',
    experience_level: data?.experience_level || '',
    icon_theme: data?.icon_theme || 'general',
    overview: data?.overview || '',
    responsibilities: data?.responsibilities || '',
    requirements: data?.requirements || '',
    benefits: data?.benefits || '',
    skills: data?.skills || '',
    is_featured: data?.is_featured ? true : false,
    status: data?.status || 'Draft',
    posted_date: data?.posted_date ? String(data.posted_date).slice(0, 10) : todayISO(),
    closing_date: data?.closing_date ? String(data.closing_date).slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // master data
  const [departments, setDepartments] = useState<Opt[]>([]);
  const [positions, setPositions]     = useState<PosOpt[]>([]);
  const [empTypes, setEmpTypes]        = useState<Opt[]>([]);
  const [jobTypes, setJobTypes]        = useState<DropOpt[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/hr/departments').then(r => r.json()),
      fetch('/api/hr/positions').then(r => r.json()),
      fetch('/api/hr/employment-types').then(r => r.json()),
      fetch('/api/hr/dropdowns?category=job_type').then(r => r.json()),
    ]).then(([d, p, t, jt]) => {
      if (d.success) setDepartments(d.data.filter((x: any) => x.status === 'Active'));
      if (p.success) setPositions(p.data.filter((x: any) => x.status === 'Active'));
      if (t.success) setEmpTypes(t.data.filter((x: any) => x.status === 'Active'));
      if (jt.success) setJobTypes(jt.data.filter((x: any) => x.status === 'Active'));
    }).catch(() => { /* silent */ });
  }, []);

  const set = (k: keyof typeof f, v: any) => setF(p => ({ ...p, [k]: v }));

  // positions filtered by selected department
  const availablePositions = f.department_id
    ? positions.filter(p => String(p.department_id) === f.department_id)
    : positions;

  const handleSave = async () => {
    if (!f.position_id) { setError('Job title is required.'); return; }
    setSaving(true); setError('');
    try {
      // resolve names from selected IDs so stored text + IDs stay in sync
      const pos  = positions.find(p => String(p.id) === f.position_id);
      const dep  = departments.find(d => String(d.id) === f.department_id);
      const etyp = empTypes.find(t => String(t.id) === f.employment_type_id);

      const payload = {
        ...f,
        title: pos?.name || f.title,
        department: dep?.name || '',
        employment_type: etyp?.name || '',
      };

      const url    = mode === 'edit' ? `/api/hr/career/postings/${data!.id}` : '/api/hr/career/postings';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) onSaved();
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const lineHint = 'One item per line — each line becomes a bullet point on the website.';

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 860 }}>
        <div className="usr-modal-header">
          <div>
            <p className="usr-modal-title">{mode === 'edit' ? 'Edit Career Posting' : 'Create Career Posting'}</p>
            <p className="usr-modal-sub">{mode === 'edit' ? data?.title : 'Add a new job vacancy'}</p>
          </div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>

        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

          <div className="int-info-note mb-3">
            <i className="bi bi-info-circle-fill"></i>
            Department, Job Title, Job Type and Employment Type are managed in <strong>Employee Settings</strong> so hired candidates map cleanly to employee records.
          </div>

          {/* Basic Information */}
          <div className="cr-form-section-title">Basic Information</div>
          <div className="d-flex flex-wrap gap-3 mb-3">
            <Field label="Department" req full>
              <select className="rm-input" value={f.department_id} onChange={e => { set('department_id', e.target.value); set('position_id', ''); }}>
                <option value="">— Select Department —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Job Title (Position)" req full>
              <select className="rm-input" value={f.position_id} onChange={e => set('position_id', e.target.value)}>
                <option value="">{f.department_id ? '— Select Position —' : '— Select a department first —'}</option>
                {availablePositions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Location">
              <input className="rm-input" value={f.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Selangor" />
            </Field>
            <Field label="Job Type">
              <select className="rm-input" value={f.job_type} onChange={e => set('job_type', e.target.value)}>
                {jobTypes.length === 0 && <option>Full Time</option>}
                {jobTypes.map(j => <option key={j.id} value={j.value}>{j.value}</option>)}
              </select>
            </Field>
            <Field label="Employment Type">
              <select className="rm-input" value={f.employment_type_id} onChange={e => set('employment_type_id', e.target.value)}>
                <option value="">— Select Type —</option>
                {empTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          </div>

          {/* Salary & Experience */}
          <div className="cr-form-section-title">Salary &amp; Experience</div>
          <div className="d-flex flex-wrap gap-3 mb-3">
            <Field label="Min Salary (RM)">
              <input type="number" className="rm-input" value={f.min_salary} onChange={e => set('min_salary', e.target.value)} placeholder="4500" />
            </Field>
            <Field label="Max Salary (RM)">
              <input type="number" className="rm-input" value={f.max_salary} onChange={e => set('max_salary', e.target.value)} placeholder="7000" />
            </Field>
            <Field label="Salary Notes">
              <input className="rm-input" value={f.salary_notes} onChange={e => set('salary_notes', e.target.value)} placeholder="e.g. + Commission" />
            </Field>
            <Field label="Min Experience (Years)">
              <input type="number" className="rm-input" value={f.min_experience} onChange={e => set('min_experience', e.target.value)} placeholder="2" />
            </Field>
            <Field label="Max Experience (Years)">
              <input type="number" className="rm-input" value={f.max_experience} onChange={e => set('max_experience', e.target.value)} placeholder="5" />
            </Field>
            <Field label="Experience Level">
              <input className="rm-input" value={f.experience_level} onChange={e => set('experience_level', e.target.value)} placeholder="e.g. Mid Level (2-5 years)" />
            </Field>
          </div>

          {/* Icon & Styling */}
          <div className="cr-form-section-title">Icon &amp; Styling</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Sets the icon and accent colour shown on the website card.</div>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {ICON_THEMES.map(t => (
              <button key={t.key} type="button"
                className={`cr-icon-pick${f.icon_theme === t.key ? ' active' : ''}`}
                onClick={() => set('icon_theme', t.key)}>
                <i className={`bi ${t.icon}`}></i> {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="cr-form-section-title">Content</div>
          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Job Overview <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea className="rm-input" rows={3} value={f.overview} onChange={e => set('overview', e.target.value)} placeholder="Brief summary of the role…" />
          </div>
          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Key Responsibilities</label>
            <textarea className="rm-input" rows={5} value={f.responsibilities} onChange={e => set('responsibilities', e.target.value)} placeholder="Manage recruitment process&#10;Administer payroll&#10;…" />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{lineHint}</div>
          </div>
          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Requirements</label>
            <textarea className="rm-input" rows={5} value={f.requirements} onChange={e => set('requirements', e.target.value)} placeholder="Bachelor's Degree in…&#10;Minimum 2-4 years experience&#10;…" />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{lineHint}</div>
          </div>
          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>What We Offer (Benefits)</label>
            <textarea className="rm-input" rows={5} value={f.benefits} onChange={e => set('benefits', e.target.value)} placeholder="Competitive salary package&#10;Medical coverage&#10;…" />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{lineHint}</div>
          </div>
          <div className="mb-3">
            <label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Skill Tags</label>
            <input className="rm-input" value={f.skills} onChange={e => set('skills', e.target.value)} placeholder="Cisco CCNA, Structured Cabling, Firewall Configuration" />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Separate each skill with a comma.</div>
          </div>

          {/* Status & Dates */}
          <div className="cr-form-section-title">Status &amp; Dates</div>
          <div className="d-flex flex-wrap gap-3 mb-2">
            <Field label="Status">
              <select className="rm-input" value={f.status} onChange={e => set('status', e.target.value)}>
                <option>Draft</option><option>Published</option><option>Closed</option>
              </select>
            </Field>
            <Field label="Posted Date">
              <input type="date" className="rm-input" value={f.posted_date} onChange={e => set('posted_date', e.target.value)} />
            </Field>
            <Field label="Closing Date (Optional)">
              <input type="date" className="rm-input" value={f.closing_date} onChange={e => set('closing_date', e.target.value)} />
            </Field>
          </div>
          <label className="d-flex align-items-center gap-2" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>
            <input type="checkbox" checked={f.is_featured} onChange={e => set('is_featured', e.target.checked)} />
            Mark as Featured (highlighted on the website)
          </label>
        </div>

        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-floppy-fill"></i> {mode === 'edit' ? 'Save Changes' : 'Create Posting'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
