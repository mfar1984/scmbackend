'use client';

type Applicant = any;

const STATUS_BADGE: Record<string, string> = {
  Pending: 'badge-pending', Shortlisted: 'badge-review', 'Interview Scheduled': 'badge-review',
  Offered: 'badge-approved', Rejected: 'badge-rejected', Hired: 'badge-approved',
};

function Panel({ title, icon, blue, children }: { title: string; icon: string; blue?: boolean; children: React.ReactNode }) {
  return (
    <div className="cr-panel">
      <div className={`cr-panel-head${blue ? ' is-blue' : ''}`}><i className={`bi ${icon}`}></i> {title}</div>
      <div className="cr-panel-body">{children}</div>
    </div>
  );
}
function KV({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div className="cr-kv">
      <span className="cr-kv-label">{label}</span>
      <span className={`cr-kv-value${accent ? ' accent' : ''}`}>{value || value === 0 ? value : '—'}</span>
    </div>
  );
}

type Props = { applicant: Applicant; fmt: (d: any, t?: boolean) => string; onClose: () => void };

export default function ApplicantViewModal({ applicant: a, fmt, onClose }: Props) {
  const money = (v: any) => (v == null || v === '') ? '—' : `RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 980 }}>
        <div className="usr-modal-header">
          <div>
            <p className="usr-modal-title">Applicant Details</p>
            <p className="usr-modal-sub">Application No: {a.application_no}</p>
          </div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>

        <div className="usr-modal-body">
          <div className="d-flex flex-wrap gap-3">
            {/* Left column */}
            <div style={{ flex: '1 1 460px', minWidth: 0 }}>
              <Panel title="Personal Information" icon="bi-person-fill">
                <KV label="Full Name" value={a.full_name} />
                <KV label="IC Number" value={a.ic_number} />
                <KV label="Email" value={a.email} />
                <KV label="Phone" value={a.phone} />
                <KV label="Alt Phone" value={a.alt_phone} />
                <KV label="Date of Birth" value={a.date_of_birth ? fmt(a.date_of_birth) : '—'} />
                <KV label="Gender" value={a.gender} />
                <KV label="Marital Status" value={a.marital_status} />
                <KV label="Nationality" value={a.nationality} />
                <KV label="Religion" value={a.religion} />
              </Panel>

              <Panel title="Address Information" icon="bi-geo-alt-fill">
                <div style={{ fontSize: 12, color: '#2563eb', marginBottom: 4 }}>Address as per IC</div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
                  {a.ic_address || '—'}<br />
                  {[a.ic_postcode, a.ic_city].filter(Boolean).join(' ')} {a.ic_state ? `, ${a.ic_state}` : ''} {a.ic_country ? `, ${a.ic_country}` : ''}
                </div>
                <div style={{ fontSize: 12, color: '#2563eb', marginBottom: 4 }}>Current Address</div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  {a.cur_address || '—'}<br />
                  {[a.cur_postcode, a.cur_city].filter(Boolean).join(' ')} {a.cur_state ? `, ${a.cur_state}` : ''} {a.cur_country ? `, ${a.cur_country}` : ''}
                </div>
              </Panel>

              <Panel title="Education & Experience" icon="bi-mortarboard-fill">
                <KV label="Highest Education" value={a.education} />
                <KV label="Field of Study" value={a.field_of_study} />
                <KV label="Years of Experience" value={a.years_experience ? `${a.years_experience} years` : '—'} />
                <KV label="Current Position" value={a.last_position} />
                <KV label="Current/Last Employer" value={a.last_employer} />
                <KV label="Expected Salary" value={money(a.expected_salary)} accent />
                <KV label="Notice Period" value={a.notice_period} />
              </Panel>
            </div>

            {/* Right column */}
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <Panel title="Job Application" icon="bi-briefcase-fill" blue>
                <KV label="Position Applied" value={a.position_applied} />
                <KV label="Department" value={a.department} />
                <div className="cr-kv">
                  <span className="cr-kv-label">Application Status</span>
                  <span className="cr-kv-value"><span className={`badge-status ${STATUS_BADGE[a.status] || 'badge-pending'}`}>{a.status}</span></span>
                </div>
                {a.status === 'Interview Scheduled' && (
                  <>
                    <div className="cr-kv">
                      <span className="cr-kv-label">Interview Confirmation</span>
                      <span className="cr-kv-value">
                        <span className={`badge-status ${a.interview_substatus === 'Confirmed' ? 'badge-approved' : 'badge-pending'}`}>
                          {a.interview_substatus || 'Pending'}
                        </span>
                      </span>
                    </div>
                    <KV label="Interview Date" value={a.interview_date ? fmt(a.interview_date) : '—'} />
                    {a.interview_time && <KV label="Interview Time" value={a.interview_time} />}
                    {a.interview_location && <KV label="Location" value={a.interview_location} />}
                  </>
                )}
                <KV label="Submitted" value={a.submitted_at ? fmt(a.submitted_at, true) : '—'} />
                <KV label="Available Start" value={a.available_start ? fmt(a.available_start) : '—'} />
                <KV label="How They Found Us" value={a.hear_about} />
              </Panel>

              <Panel title="Documents" icon="bi-file-earmark-text-fill">
                <div className="d-flex flex-column gap-2">
                  <DocBtn label="Passport Photo" id={a.id} type="passport"     has={a.has_passport} name={a.doc_passport_name} icon="bi-image" />
                  <DocBtn label="Resume / CV"     id={a.id} type="resume"       has={a.has_resume} name={a.doc_resume_name} icon="bi-file-earmark-pdf" />
                  <DocBtn label="Cover Letter"    id={a.id} type="cover_letter" has={a.has_cover_letter} name={a.doc_cover_letter_name} icon="bi-file-earmark-text" />
                </div>
              </Panel>

              <Panel title="Emergency Contact" icon="bi-telephone-fill">
                <KV label="Name" value={a.emg_name} />
                <KV label="Relationship" value={a.emg_relationship} />
                <KV label="Phone" value={a.emg_phone} />
                <KV label="Email" value={a.emg_email} />
                <KV label="Address" value={a.emg_address} />
              </Panel>
            </div>
          </div>

          {a.cover_message && (
            <Panel title="Cover Message" icon="bi-chat-left-text-fill">
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{a.cover_message}</p>
            </Panel>
          )}

          {a.converted_employee_id && (
            <div className="int-info-note">
              <i className="bi bi-check-circle-fill"></i>
              This applicant has been hired and added to the Employee List.
            </div>
          )}
        </div>

        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function DocBtn({ label, id, type, has, name, icon }: {
  label: string; id: number; type: string; has: any; name?: string | null; icon: string;
}) {
  const hasFile = has === 1 || has === true;
  if (!hasFile) {
    // No real file stored. Show the claimed filename (legacy) or "none".
    const note = name ? `${name} — not uploaded` : 'none';
    return (
      <button className="rm-btn-outline" style={{ justifyContent: 'flex-start', opacity: .55 }} disabled title={note}>
        <i className={`bi ${icon}`}></i> {label} ({note})
      </button>
    );
  }
  const url = `/api/hr/career/applicants/document?id=${id}&type=${type}`;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="rm-btn-outline" style={{ justifyContent: 'flex-start', textDecoration: 'none' }} title={name || undefined}>
      <i className={`bi ${icon}`}></i> View {label}
    </a>
  );
}
