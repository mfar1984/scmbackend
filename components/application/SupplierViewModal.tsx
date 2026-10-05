'use client';

type Supplier = any;

const STATUS_BADGE: Record<string, string> = {
  Pending: 'badge-pending', 'On Progress': 'badge-review',
  Approved: 'badge-approved', Active: 'badge-approved', Rejected: 'badge-rejected',
};

function Panel({ title, icon, blue, children }: { title: string; icon: string; blue?: boolean; children: React.ReactNode }) {
  return (
    <div className="cr-panel">
      <div className={`cr-panel-head${blue ? ' is-blue' : ''}`}><i className={`bi ${icon}`}></i> {title}</div>
      <div className="cr-panel-body">{children}</div>
    </div>
  );
}
function KV({ label, value }: { label: string; value: any }) {
  return (
    <div className="cr-kv">
      <span className="cr-kv-label">{label}</span>
      <span className="cr-kv-value">{value || value === 0 ? value : '—'}</span>
    </div>
  );
}

function DocBtn({ id, type, label, has, name }: { id: number; type: string; label: string; has: any; name?: string | null }) {
  const hasFile = has === 1 || has === true;
  const isImg = name && /\.(png|jpe?g|gif|webp)$/i.test(name);
  const icon = isImg ? 'bi-image' : 'bi-file-earmark-pdf';
  if (!hasFile) {
    return <button className="rm-btn-outline" style={{ justifyContent: 'flex-start', opacity: .5 }} disabled><i className={`bi ${icon}`}></i> {label} (none)</button>;
  }
  return (
    <a href={`/api/application/suppliers/document?id=${id}&type=${type}`} target="_blank" rel="noreferrer"
       className="rm-btn-outline" style={{ justifyContent: 'flex-start', textDecoration: 'none' }} title={name || undefined}>
      <i className={`bi ${icon}`}></i> View {label}
    </a>
  );
}

type Props = { supplier: Supplier; fmt: (d: any, t?: boolean) => string; onClose: () => void };

export default function SupplierViewModal({ supplier: s, fmt, onClose }: Props) {
  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 980 }}>
        <div className="usr-modal-header">
          <div>
            <p className="usr-modal-title">Supplier Registration</p>
            <p className="usr-modal-sub">Reference: {s.reference_no}</p>
          </div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>

        <div className="usr-modal-body">
          <div className="d-flex flex-wrap gap-3">
            <div style={{ flex: '1 1 460px', minWidth: 0 }}>
              <Panel title="Company Information" icon="bi-building-fill">
                <KV label="Company Name" value={s.company_name} />
                <KV label="SSM No." value={s.ssm} />
                <KV label="Company Type" value={s.company_type} />
                <KV label="Incorporation" value={s.incorporation ? fmt(s.incorporation) : '—'} />
                <KV label="Address" value={s.address} />
                <KV label="City" value={s.city} />
                <KV label="State" value={s.state} />
                <KV label="Postcode" value={s.postcode} />
                <KV label="Office Phone" value={s.office_phone} />
                <KV label="Fax" value={s.fax} />
                <KV label="Mobile" value={s.mobile} />
                <KV label="Email" value={s.email} />
                <KV label="Website" value={s.website} />
              </Panel>

              <Panel title="Services & Profile" icon="bi-briefcase-fill">
                <KV label="Services" value={s.services} />
                <div className="cr-kv"><span className="cr-kv-label">Nature of Business</span>
                  <span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{s.nature_of_biz || '—'}</span></div>
                <div className="cr-kv"><span className="cr-kv-label">Products / Services</span>
                  <span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{s.prod_desc || '—'}</span></div>
                <div className="cr-kv"><span className="cr-kv-label">Approvals / Accreditations</span>
                  <span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{s.accreditations || '—'}</span></div>
              </Panel>

              <Panel title="Director / Key Personnel" icon="bi-person-badge-fill">
                <KV label="Director Name" value={s.director_name} />
                <KV label="IC Number" value={s.director_ic} />
                <KV label="Position" value={s.director_position} />
                <KV label="Contact" value={s.director_contact} />
              </Panel>
            </div>

            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <Panel title="Application" icon="bi-clipboard-check-fill" blue>
                <div className="cr-kv"><span className="cr-kv-label">Status</span>
                  <span className="cr-kv-value"><span className={`badge-status ${STATUS_BADGE[s.status] || 'badge-pending'}`}>{s.status}</span></span></div>
                <KV label="Submitted" value={s.submitted_at ? fmt(s.submitted_at, true) : '—'} />
              </Panel>

              <Panel title="Registration & Compliance" icon="bi-file-earmark-check-fill">
                <KV label="MOF No." value={s.mof} />
                <KV label="CIDB No." value={s.cidb} />
                <KV label="CIDB Grade" value={s.cidb_grade} />
                <KV label="Bumiputera" value={s.bumiputera} />
                <KV label="Paid-up Capital" value={s.paid_capital ? `RM ${s.paid_capital}` : '—'} />
                <KV label="Employees" value={s.num_employees} />
                <KV label="Annual Turnover" value={s.turnover} />
                <KV label="Years in Business" value={s.years_in_biz} />
              </Panel>

              <Panel title="Banking Information" icon="bi-bank">
                <KV label="Bank Name" value={s.bank_name} />
                <KV label="Account No." value={s.bank_acc} />
                <KV label="Account Name" value={s.bank_acc_name} />
              </Panel>

              <Panel title="Documents" icon="bi-folder2-open">
                <div className="d-flex flex-column gap-2">
                  <DocBtn id={s.id} type="ssm"       label="SSM Certificate"   has={s.has_ssm} name={s.doc_ssm_name} />
                  <DocBtn id={s.id} type="profile"   label="Company Profile"   has={s.has_profile} name={s.doc_profile_name} />
                  <DocBtn id={s.id} type="mof"       label="MOF Certificate"   has={s.has_mof} name={s.doc_mof_name} />
                  <DocBtn id={s.id} type="cidb"      label="CIDB Certificate"  has={s.has_cidb} name={s.doc_cidb_name} />
                  <DocBtn id={s.id} type="financial" label="Financial Statement" has={s.has_financial} name={s.doc_financial_name} />
                  <DocBtn id={s.id} type="bank"      label="Bank Statement"    has={s.has_bank} name={s.doc_bank_name} />
                  {Array.isArray(s.other_names) && s.other_names.map((n: string, i: number) => (
                    <a key={i} href={`/api/application/suppliers/document?id=${s.id}&type=other&index=${i}`} target="_blank" rel="noreferrer"
                       className="rm-btn-outline" style={{ justifyContent: 'flex-start', textDecoration: 'none' }} title={n}>
                      <i className="bi bi-file-earmark"></i> View {n}
                    </a>
                  ))}
                </div>
              </Panel>
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
