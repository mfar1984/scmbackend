'use client';

type Partner = any;

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

type Props = { partner: Partner; fmt: (d: any, t?: boolean) => string; onClose: () => void };

export default function PartnerViewModal({ partner: p, fmt, onClose }: Props) {
  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 980 }}>
        <div className="usr-modal-header">
          <div>
            <p className="usr-modal-title">Strategic Partnership Application</p>
            <p className="usr-modal-sub">Reference: {p.reference_no}</p>
          </div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>

        <div className="usr-modal-body">
          <div className="d-flex flex-wrap gap-3">
            <div style={{ flex: '1 1 460px', minWidth: 0 }}>
              <Panel title="Company Information" icon="bi-building-fill">
                <KV label="Company Name" value={p.company} />
                <KV label="SSM No." value={p.ssm} />
                <KV label="Industry" value={p.industry} />
                <KV label="Website" value={p.website} />
                <KV label="Country" value={p.country} />
                <KV label="State" value={p.state} />
              </Panel>

              <Panel title="Contact Person" icon="bi-person-lines-fill">
                <KV label="Full Name" value={p.contact_name} />
                <KV label="Position" value={p.position} />
                <KV label="Email" value={p.email} />
                <KV label="Phone" value={p.phone} />
              </Panel>

              <Panel title="Partnership Proposal" icon="bi-file-earmark-text-fill">
                <div className="cr-kv"><span className="cr-kv-label">Value Proposition</span>
                  <span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{p.value_proposition || '—'}</span></div>
                <div className="cr-kv"><span className="cr-kv-label">Target Market</span>
                  <span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{p.target_market || '—'}</span></div>
                <KV label="Expected Revenue" value={p.expected_revenue} />
              </Panel>
            </div>

            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <Panel title="Application" icon="bi-clipboard-check-fill" blue>
                <div className="cr-kv"><span className="cr-kv-label">Status</span>
                  <span className="cr-kv-value"><span className={`badge-status ${STATUS_BADGE[p.status] || 'badge-pending'}`}>{p.status}</span></span></div>
                <KV label="Submitted" value={p.submitted_at ? fmt(p.submitted_at, true) : '—'} />
              </Panel>

              <Panel title="Partnership Details" icon="bi-diagram-3-fill">
                <KV label="Partner Type" value={p.partner_type} />
                <KV label="Desired Tier" value={p.partner_tier} />
                <KV label="Technology Stack" value={p.tech_stack} />
                <KV label="Years in Operation" value={p.years_op} />
                <div className="cr-kv"><span className="cr-kv-label">Previous Experience</span>
                  <span className="cr-kv-value" style={{ whiteSpace: 'pre-wrap' }}>{p.prev_partner || '—'}</span></div>
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
