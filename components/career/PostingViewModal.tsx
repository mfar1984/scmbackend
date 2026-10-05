'use client';
import type { Posting } from '../../pages/hr/career/postings';

const ICON_MAP: Record<string, string> = {
  it: 'bi-laptop', sales: 'bi-graph-up-arrow', hr: 'bi-people-fill',
  engineering: 'bi-tools', technical: 'bi-gear-fill', general: 'bi-briefcase-fill',
};

const splitLines = (v: string | null) =>
  (v || '').split('\n').map(s => s.trim()).filter(Boolean);

function BulletBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="cr-view-block-title">{title}</div>
      <ul className="cr-view-list">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}

type Props = { posting: Posting; fmt: (d: any, t?: boolean) => string; onClose: () => void };

export default function PostingViewModal({ posting: p, fmt, onClose }: Props) {
  const salaryText = (p.min_salary != null || p.max_salary != null)
    ? `RM ${p.min_salary != null ? Number(p.min_salary).toLocaleString('en-MY', { minimumFractionDigits: 2 }) : '?'} - ${p.max_salary != null ? Number(p.max_salary).toLocaleString('en-MY', { minimumFractionDigits: 2 }) : '?'}`
    : 'Not specified';
  const skills = (p.skills || '').split(',').map(s => s.trim()).filter(Boolean);

  const detailRows = [
    { label: 'Job Type',        value: p.job_type },
    { label: 'Employment Type', value: p.employment_type },
    { label: 'Salary Range',    value: salaryText, accent: true },
    { label: 'Experience Level', value: p.experience_level || '—' },
    { label: 'Location',        value: p.location || '—' },
    { label: 'Department',      value: p.department || '—' },
    { label: 'Posted',          value: p.posted_date ? fmt(p.posted_date) : '—' },
    { label: 'Closing Date',    value: p.closing_date ? fmt(p.closing_date) : 'Open until filled', accent: true },
  ];

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 920 }}>
        <div className="usr-modal-header">
          <div className="d-flex align-items-center gap-3">
            <div className="cr-view-icon"><i className={`bi ${ICON_MAP[p.icon_theme] || ICON_MAP.general}`}></i></div>
            <div>
              <p className="usr-modal-title">{p.title}</p>
              <p className="usr-modal-sub">{p.department || '—'}</p>
            </div>
          </div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>

        <div className="usr-modal-body">
          <div className="d-flex flex-wrap gap-4">
            {/* Left — content */}
            <div style={{ flex: '2 1 480px', minWidth: 0 }}>
              {p.overview && (
                <div style={{ marginBottom: 20 }}>
                  <div className="cr-view-block-title">Job Overview</div>
                  <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{p.overview}</p>
                </div>
              )}
              <BulletBlock title="Key Responsibilities" items={splitLines(p.responsibilities)} />
              <BulletBlock title="Requirements" items={splitLines(p.requirements)} />
              <BulletBlock title="What We Offer" items={splitLines(p.benefits)} />
              {skills.length > 0 && (
                <div>
                  <div className="cr-view-block-title">Skills</div>
                  <div className="d-flex flex-wrap gap-2">
                    {skills.map(s => <span key={s} className="usr-role-badge">{s}</span>)}
                  </div>
                </div>
              )}
            </div>

            {/* Right — details */}
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <div className="int-card" style={{ marginBottom: 0 }}>
                <div className="int-card-title"><i className="bi bi-info-circle-fill"></i> Job Details</div>
                {detailRows.map((r, i) => (
                  <div key={r.label} style={{ padding: '8px 0', borderBottom: i === detailRows.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 13.5, color: r.accent ? '#16a34a' : '#1f2937' }}>{r.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
