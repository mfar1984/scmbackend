'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import { useDateFormat } from '../../../lib/useDateFormat';
import ClientModal from '../../../components/operations/ClientModal';
import ClientViewModal from '../../../components/operations/ClientViewModal';
import LeadModal from '../../../components/operations/LeadModal';
import ProposalModal from '../../../components/operations/ProposalModal';
import ProposalViewModal from '../../../components/operations/ProposalViewModal';
import ProposalSendModal from '../../../components/operations/ProposalSendModal';

const CLIENT_BADGE: Record<string, string> = { 'Active': 'badge-status badge-approved', 'Prospect': 'badge-status badge-review', 'Inactive': 'badge-status badge-rejected' };
const STAGE_BADGE: Record<string, string> = { 'New': 'badge-status', 'Contacted': 'badge-status badge-review', 'Qualified': 'badge-status badge-pending', 'Proposal': 'badge-status badge-review', 'Negotiation': 'badge-status badge-pending', 'Won': 'badge-status badge-approved', 'Lost': 'badge-status badge-rejected' };
const PROP_BADGE: Record<string, string> = { 'Draft': 'badge-status', 'Sent': 'badge-status badge-review', 'Accepted': 'badge-status badge-approved', 'Rejected': 'badge-status badge-rejected', 'Expired': 'badge-status badge-pending' };

const TABS = ['Client Database', 'Leads & Prospects', 'Proposals'] as const;
type Tab = typeof TABS[number];

export default function BusinessDevPage() {
  const { fmt } = useDateFormat();
  const { can, canRead } = usePermissions();
  const TAB_PERM: Record<Tab, string> = {
    'Client Database': 'ops.business_dev.clients',
    'Leads & Prospects': 'ops.business_dev.leads',
    'Proposals': 'ops.business_dev.proposals',
  };
  const canCreateClient = can('ops.business_dev.clients', 'Create');
  const canUpdateClient = can('ops.business_dev.clients', 'Update');
  const canDeleteClient = can('ops.business_dev.clients', 'Delete');
  const canCreateLead = can('ops.business_dev.leads', 'Create');
  const canUpdateLead = can('ops.business_dev.leads', 'Update');
  const canDeleteLead = can('ops.business_dev.leads', 'Delete');
  const canCreateProp = can('ops.business_dev.proposals', 'Create');
  const canUpdateProp = can('ops.business_dev.proposals', 'Update');
  const canDeleteProp = can('ops.business_dev.proposals', 'Delete');
  const [activeTab, setActiveTab] = useState<Tab>('Client Database');
  const [search, setSearch] = useState('');

  const [clients, setClients] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // modal states
  const [clientModal, setClientModal] = useState<{ mode: 'create' | 'edit' | 'view'; id?: number } | null>(null);
  const [leadModal, setLeadModal] = useState<{ mode: 'create' | 'edit'; id?: number } | null>(null);
  const [proposalModal, setProposalModal] = useState<{ mode: 'create' | 'edit' | 'view'; id?: number } | null>(null);
  const [sendId, setSendId] = useState<number | null>(null);
  const [del, setDel] = useState<{ type: 'client' | 'lead' | 'proposal'; id: number; name: string } | null>(null);

  const money = (v: any) => v != null && v !== '' ? Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 }) : '—';

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, l, p] = await Promise.all([
        fetch('/api/operations/clients').then(r => r.json()),
        fetch('/api/operations/leads').then(r => r.json()),
        fetch('/api/operations/proposals').then(r => r.json()),
      ]);
      if (c.success) setClients(c.data);
      if (l.success) setLeads(l.data);
      if (p.success) setProposals(p.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const q = search.toLowerCase();
  const fClients = clients.filter(c => [c.company, c.contact_person, c.email, c.industry].some(v => String(v ?? '').toLowerCase().includes(q)));
  const fLeads = leads.filter(l => [l.title, l.company, l.client_company, l.assigned_to].some(v => String(v ?? '').toLowerCase().includes(q)));
  const fProposals = proposals.filter(p => [p.title, p.client_name, p.client_company, p.ref_no].some(v => String(v ?? '').toLowerCase().includes(q)));

  const doDelete = async () => {
    if (!del) return;
    const ep = del.type === 'client' ? 'clients' : del.type === 'lead' ? 'leads' : 'proposals';
    const j = await (await fetch(`/api/operations/${ep}/${del.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDel(null); fetchAll(); } else alert(j.message || 'Delete failed.');
  };

  return (
    <>
      <Head><title>Business Development — ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Operations', 'Business Development']}>
        <PermissionGate moduleKey={TAB_PERM[activeTab]}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Business Development</h1>
              <p className="page-subtitle">Manage client relationships, sales leads, and proposals — send proposals directly to clients.</p>
            </div>

            <div className="int-tabs mb-4">
              {TABS.filter(tab => canRead(TAB_PERM[tab])).map(tab => (
                <button key={tab} className={`int-tab-btn${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
              ))}
            </div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {activeTab === 'Client Database' && canCreateClient && <button className="rm-btn-primary" onClick={() => setClientModal({ mode: 'create' })}><i className="bi bi-plus-lg"></i> Add Client</button>}
              {activeTab === 'Leads & Prospects' && canCreateLead && <button className="rm-btn-primary" onClick={() => setLeadModal({ mode: 'create' })}><i className="bi bi-plus-lg"></i> Add Lead</button>}
              {activeTab === 'Proposals' && canCreateProp && <button className="rm-btn-primary" onClick={() => setProposalModal({ mode: 'create' })}><i className="bi bi-plus-lg"></i> New Proposal</button>}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
            ) : (
              <div className="rm-table-wrap">

                {/* TAB 1 — Clients */}
                {activeTab === 'Client Database' && (
                  <table className="rm-table" style={{ minWidth: 1000 }}>
                    <thead><tr>
                      <th className="rm-th-module">Company</th><th className="rm-th-perm">Sector</th>
                      <th className="rm-th-module">Contact</th><th className="rm-th-perm">Phone</th>
                      <th className="rm-th-perm">Potential (RM)</th><th className="rm-th-perm">Leads</th>
                      <th className="rm-th-perm">Status</th><th className="rm-th-perm">Actions</th>
                    </tr></thead>
                    <tbody>
                      {fClients.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-building" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No clients found.</td></tr>
                      ) : fClients.map(c => (
                        <tr key={c.id} className="rm-data-row">
                          <td className="rm-td-module" style={{ color: '#1f2937' }}>{c.company}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}>{c.sector ? <span className="usr-role-badge">{c.sector}</span> : '—'}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{c.contact_person || '—'}{c.email ? <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{c.email}</div> : null}</td>
                          <td className="rm-td-perm" style={{ fontSize: 13, color: '#6b7280' }}>{c.phone || '—'}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13 }}>{money(c.potential_value)}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280' }}>{c.lead_count || 0}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={CLIENT_BADGE[c.status] || 'badge-status'}>{c.status}</span></td>
                          <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                            <button className="rm-action-btn rm-action-view" title="View" onClick={() => setClientModal({ mode: 'view', id: c.id })}><i className="bi bi-eye-fill"></i></button>
                            {canUpdateClient && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => setClientModal({ mode: 'edit', id: c.id })}><i className="bi bi-pencil-fill"></i></button>}
                            {canDeleteClient && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDel({ type: 'client', id: c.id, name: c.company })}><i className="bi bi-trash-fill"></i></button>}
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* TAB 2 — Leads */}
                {activeTab === 'Leads & Prospects' && (
                  <table className="rm-table" style={{ minWidth: 1000 }}>
                    <thead><tr>
                      <th className="rm-th-module">Lead</th><th className="rm-th-module">Company</th>
                      <th className="rm-th-perm">Source</th><th className="rm-th-perm">Est. Value (RM)</th>
                      <th className="rm-th-perm">Stage</th><th className="rm-th-module">Assigned</th>
                      <th className="rm-th-perm">Follow-up</th><th className="rm-th-perm">Actions</th>
                    </tr></thead>
                    <tbody>
                      {fLeads.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-megaphone" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No leads found.</td></tr>
                      ) : fLeads.map(l => (
                        <tr key={l.id} className="rm-data-row">
                          <td className="rm-td-module" style={{ color: '#1f2937' }}>{l.title}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{l.client_company || l.company || '—'}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}><span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>{l.source}</span></td>
                          <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13 }}>{money(l.estimated_value)}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={STAGE_BADGE[l.stage] || 'badge-status'}>{l.stage}</span></td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{l.assigned_to || '—'}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280' }}>{l.next_follow_up ? fmt(l.next_follow_up) : '—'}</td>
                          <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                            {canUpdateLead && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => setLeadModal({ mode: 'edit', id: l.id })}><i className="bi bi-pencil-fill"></i></button>}
                            {canDeleteLead && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDel({ type: 'lead', id: l.id, name: l.title })}><i className="bi bi-trash-fill"></i></button>}
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* TAB 3 — Proposals */}
                {activeTab === 'Proposals' && (
                  <table className="rm-table" style={{ minWidth: 1000 }}>
                    <thead><tr>
                      <th className="rm-th-module">Proposal</th><th className="rm-th-module">Client</th>
                      <th className="rm-th-perm">Value (RM)</th><th className="rm-th-perm">Issued</th>
                      <th className="rm-th-perm">Valid Until</th><th className="rm-th-perm">Doc</th>
                      <th className="rm-th-perm">Status</th><th className="rm-th-perm">Actions</th>
                    </tr></thead>
                    <tbody>
                      {fProposals.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-file-earmark-richtext" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No proposals found.</td></tr>
                      ) : fProposals.map(p => (
                        <tr key={p.id} className="rm-data-row">
                          <td className="rm-td-module" style={{ color: '#1f2937' }}>{p.title}{p.ref_no ? <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>{p.ref_no}</div> : null}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{p.client_name || p.client_company || '—'}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13 }}>{money(p.value)}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280' }}>{p.issued_date ? fmt(p.issued_date) : '—'}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280' }}>{p.valid_until ? fmt(p.valid_until) : '—'}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}>{(p.has_doc === 1 || p.has_doc === true) ? <i className="bi bi-paperclip" title="Document attached" style={{ color: '#16a34a' }}></i> : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={PROP_BADGE[p.status] || 'badge-status'}>{p.status}</span></td>
                          <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                            <button className="rm-action-btn rm-action-view" title="View" onClick={() => setProposalModal({ mode: 'view', id: p.id })}><i className="bi bi-eye-fill"></i></button>
                            {canUpdateProp && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => setProposalModal({ mode: 'edit', id: p.id })}><i className="bi bi-pencil-fill"></i></button>}
                            {canUpdateProp && <button className="rm-action-btn rm-action-view" title="Send to client" style={{ color: '#2563eb' }} onClick={() => setSendId(p.id)}><i className="bi bi-send-fill"></i></button>}
                            {canDeleteProp && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDel({ type: 'proposal', id: p.id, name: p.title })}><i className="bi bi-trash-fill"></i></button>}
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Client modals */}
        {clientModal?.mode === 'view' && clientModal.id != null && (
          <ClientViewModal id={clientModal.id} fmt={fmt} onClose={() => setClientModal(null)} onEdit={() => setClientModal({ mode: 'edit', id: clientModal.id })} />
        )}
        {clientModal && clientModal.mode !== 'view' && (
          <ClientModal mode={clientModal.mode} clientId={clientModal.id} onClose={() => setClientModal(null)} onSaved={() => { setClientModal(null); fetchAll(); }} />
        )}

        {/* Lead modal */}
        {leadModal && (
          <LeadModal mode={leadModal.mode} leadId={leadModal.id} onClose={() => setLeadModal(null)} onSaved={() => { setLeadModal(null); fetchAll(); }} />
        )}

        {/* Proposal modals */}
        {proposalModal?.mode === 'view' && proposalModal.id != null && (
          <ProposalViewModal id={proposalModal.id} fmt={fmt} onClose={() => setProposalModal(null)} onEdit={() => setProposalModal({ mode: 'edit', id: proposalModal.id })} onSend={() => { const pid = proposalModal.id!; setProposalModal(null); setSendId(pid); }} />
        )}
        {proposalModal && proposalModal.mode !== 'view' && (
          <ProposalModal mode={proposalModal.mode} proposalId={proposalModal.id} onClose={() => setProposalModal(null)} onSaved={() => { setProposalModal(null); fetchAll(); }} />
        )}
        {sendId != null && (
          <ProposalSendModal proposalId={sendId} onClose={() => setSendId(null)} onSent={() => { setSendId(null); fetchAll(); }} />
        )}

        {/* Delete confirm */}
        {del && (
          <div className="rm-modal-overlay">
            <div className="rm-modal">
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete {del.type === 'client' ? 'Client' : del.type === 'lead' ? 'Lead' : 'Proposal'}?</h3>
              <p>This permanently removes <strong>{del.name}</strong>.</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setDel(null)}>Cancel</button>
                <button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button>
              </div>
            </div>
          </div>
        )}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
