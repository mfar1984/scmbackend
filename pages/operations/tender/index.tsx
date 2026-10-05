'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import { useDateFormat } from '../../../lib/useDateFormat';
import TenderModal from '../../../components/operations/TenderModal';
import TenderViewModal from '../../../components/operations/TenderViewModal';

type Tender = any;

const STAGE_BADGE: Record<string, string> = {
  'Draft': 'badge-status', 'In Progress': 'badge-status badge-review', 'Submitted': 'badge-status badge-pending',
  'Evaluation': 'badge-status badge-review', 'Awarded': 'badge-status badge-approved',
  'Unsuccessful': 'badge-status badge-rejected', 'Closed': 'badge-status',
};
const EVAL_BADGE: Record<string, string> = { 'Pending': 'badge-status badge-pending', 'In Progress': 'badge-status badge-review', 'Completed': 'badge-status badge-approved' };

const TABS = ['List of Tenders', 'Evaluation', 'Awards', 'Tender Archives'] as const;
type Tab = typeof TABS[number];

export default function TenderManagementPage() {
  const { fmt } = useDateFormat();
  const { can, canRead } = usePermissions();
  const canCreate = can('ops.tender.list', 'Create');
  const canUpdateList = can('ops.tender.list', 'Update');
  const canDeleteList = can('ops.tender.list', 'Delete');
  const canUpdateEval = can('ops.tender.evaluation', 'Update');
  const canUpdateAward = can('ops.tender.awards', 'Update');
  const TAB_PERM: Record<string, string> = {
    'List of Tenders': 'ops.tender.list', 'Evaluation': 'ops.tender.evaluation',
    'Awards': 'ops.tender.awards', 'Tender Archives': 'ops.tender.archives',
  };
  const [activeTab, setActiveTab] = useState<Tab>('List of Tenders');
  const [items, setItems] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit' | 'view'; id?: number } | null>(null);
  const [delItem, setDelItem] = useState<Tender | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/operations/tenders')).json(); if (j.success) setItems(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const money = (v: any) => v != null ? Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 }) : '—';
  const q = search.toLowerCase();
  const match = (t: Tender) => [t.name, t.agency, t.ref_no].some(v => String(v ?? '').toLowerCase().includes(q));

  const listTenders = items.filter(match);
  const evalTenders = items.filter(t => ['Submitted', 'Evaluation'].includes(t.stage) && match(t));
  const awards = items.filter(t => t.stage === 'Awarded' && match(t));
  const archives = items.filter(t => ['Unsuccessful', 'Closed'].includes(t.stage) && t.outcome && match(t));

  const handleDelete = async () => {
    if (!delItem) return;
    const j = await (await fetch(`/api/operations/tenders/${delItem.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDelItem(null); fetchItems(); } else alert(j.message || 'Delete failed.');
  };

  const docBadge = (t: Tender) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
      <i className="bi bi-paperclip"></i>{t.doc_count}{(t.has_compiled === 1 || t.has_compiled === true) ? <i className="bi bi-file-earmark-pdf-fill" title="Compiled PDF ready" style={{ color: '#dc2626', marginLeft: 3 }}></i> : null}
    </span>
  );

  return (
    <>
      <Head><title>Tender Management — ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Operations', 'Tender Management']}>
        <PermissionGate moduleKey={TAB_PERM[activeTab]}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Tender Management</h1>
              <p className="page-subtitle">Manage tender submissions, evaluations, awards and archives with document attachments.</p>
            </div>

            <div className="int-tabs mb-4">
              {TABS.filter(tab => canRead(TAB_PERM[tab])).map(tab => (
                <button key={tab} className={`int-tab-btn${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
              ))}
            </div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search tender, agency or reference…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {activeTab === 'List of Tenders' && canCreate && <button className="rm-btn-primary" onClick={() => setModal({ mode: 'create' })}><i className="bi bi-plus-lg"></i> Add Tender</button>}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</div>
            ) : (
              <div className="rm-table-wrap">

                {/* TAB 1 */}
                {activeTab === 'List of Tenders' && (
                  <table className="rm-table" style={{ minWidth: 900 }}>
                    <thead><tr>
                      <th className="rm-th-module">Reference</th><th className="rm-th-module">Tender Name</th>
                      <th className="rm-th-module">Agency</th><th className="rm-th-module">Closing</th>
                      <th className="rm-th-perm">Est. Value</th><th className="rm-th-perm">Docs</th>
                      <th className="rm-th-perm">Stage</th><th className="rm-th-perm">Actions</th>
                    </tr></thead>
                    <tbody>
                      {listTenders.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-file-earmark-text" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No tenders found.</td></tr>
                      ) : listTenders.map(t => (
                        <tr key={t.id} className="rm-data-row">
                          <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{t.ref_no}</td>
                          <td className="rm-td-module" style={{ color: '#1f2937' }}>{t.name}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{t.agency || '—'}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{t.closing_date ? fmt(t.closing_date) : '—'}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13 }}>{money(t.estimated_value)}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}>{docBadge(t)}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={STAGE_BADGE[t.stage] || 'badge-status'}>{t.stage}</span></td>
                          <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                            <button className="rm-action-btn rm-action-view" title="View" onClick={() => setModal({ mode: 'view', id: t.id })}><i className="bi bi-eye-fill"></i></button>
                            {canUpdateList && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => setModal({ mode: 'edit', id: t.id })}><i className="bi bi-pencil-fill"></i></button>}
                            {canDeleteList && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDelItem(t)}><i className="bi bi-trash-fill"></i></button>}
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* TAB 2 — Evaluation */}
                {activeTab === 'Evaluation' && (
                  <table className="rm-table" style={{ minWidth: 900 }}>
                    <thead><tr>
                      <th className="rm-th-module">Tender Name</th><th className="rm-th-module">Client</th>
                      <th className="rm-th-module">Submitted</th><th className="rm-th-perm">Est. Value</th>
                      <th className="rm-th-perm">Eval Type</th><th className="rm-th-module">Officer</th>
                      <th className="rm-th-perm">Eval Status</th><th className="rm-th-perm">Actions</th>
                    </tr></thead>
                    <tbody>
                      {evalTenders.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-clipboard-data" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No tenders under evaluation.</td></tr>
                      ) : evalTenders.map(t => (
                        <tr key={t.id} className="rm-data-row">
                          <td className="rm-td-module" style={{ color: '#1f2937' }}>{t.name}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{t.agency || '—'}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{t.submitted_date ? fmt(t.submitted_date) : '—'}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13 }}>{money(t.estimated_value)}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}>{t.eval_type ? <span className="usr-role-badge">{t.eval_type}</span> : '—'}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{t.eval_officer || '—'}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}>{t.eval_status ? <span className={EVAL_BADGE[t.eval_status] || 'badge-status'}>{t.eval_status}</span> : '—'}</td>
                          <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                            <button className="rm-action-btn rm-action-view" title="View" onClick={() => setModal({ mode: 'view', id: t.id })}><i className="bi bi-eye-fill"></i></button>
                            {canUpdateEval && <button className="rm-action-btn rm-action-edit" title="Update" onClick={() => setModal({ mode: 'edit', id: t.id })}><i className="bi bi-pencil-fill"></i></button>}
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* TAB 3 — Awards */}
                {activeTab === 'Awards' && (
                  <table className="rm-table" style={{ minWidth: 900 }}>
                    <thead><tr>
                      <th className="rm-th-module">Tender Name</th><th className="rm-th-module">Client</th>
                      <th className="rm-th-module">Contract No</th><th className="rm-th-perm">Actual Value</th>
                      <th className="rm-th-module">Award Date</th><th className="rm-th-module">Project Period</th>
                      <th className="rm-th-perm">Status</th><th className="rm-th-perm">Actions</th>
                    </tr></thead>
                    <tbody>
                      {awards.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-trophy" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No awarded tenders.</td></tr>
                      ) : awards.map(t => (
                        <tr key={t.id} className="rm-data-row">
                          <td className="rm-td-module" style={{ color: '#1f2937' }}>{t.name}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{t.agency || '—'}</td>
                          <td className="rm-td-module" style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{t.contract_no || '—'}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13, color: '#16a34a' }}>{money(t.actual_value)}</td>
                          <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{t.award_date ? fmt(t.award_date) : '—'}</td>
                          <td className="rm-td-module" style={{ fontSize: 12.5, color: '#6b7280' }}>{t.project_start ? fmt(t.project_start) : '—'} → {t.project_end ? fmt(t.project_end) : '—'}</td>
                          <td className="rm-td-perm" style={{ textAlign: 'center' }}>{t.award_status ? <span className={`badge-status ${t.award_status === 'Active' ? 'badge-approved' : 'badge-status'}`}>{t.award_status}</span> : '—'}</td>
                          <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                            <button className="rm-action-btn rm-action-view" title="View" onClick={() => setModal({ mode: 'view', id: t.id })}><i className="bi bi-eye-fill"></i></button>
                            {canUpdateAward && <button className="rm-action-btn rm-action-edit" title="Edit" onClick={() => setModal({ mode: 'edit', id: t.id })}><i className="bi bi-pencil-fill"></i></button>}
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* TAB 4 — Archives */}
                {activeTab === 'Tender Archives' && (
                  <>
                    <div className="d-flex align-items-center gap-2 mb-3 p-3" style={{ background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                      <i className="bi bi-info-circle-fill" style={{ color: '#d97706', fontSize: 14 }}></i>
                      <span style={{ fontSize: 13, color: '#92400e' }}>Archives are for reference only. Use historical pricing for future tender preparation.</span>
                    </div>
                    <table className="rm-table" style={{ minWidth: 800 }}>
                      <thead><tr>
                        <th className="rm-th-module">Tender Name</th><th className="rm-th-module">Client</th>
                        <th className="rm-th-module">Closing</th><th className="rm-th-perm">Outcome</th>
                        <th className="rm-th-module">Reason</th><th className="rm-th-perm">Ref Price (RM)</th><th className="rm-th-perm">Actions</th>
                      </tr></thead>
                      <tbody>
                        {archives.length === 0 ? (
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-archive" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No archived tenders.</td></tr>
                        ) : archives.map(t => (
                          <tr key={t.id} className="rm-data-row">
                            <td className="rm-td-module" style={{ color: '#1f2937' }}>{t.name}</td>
                            <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{t.agency || '—'}</td>
                            <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{t.closing_date ? fmt(t.closing_date) : '—'}</td>
                            <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${t.outcome === 'Unsuccessful' ? 'badge-rejected' : t.outcome === 'Cancelled' ? 'badge-pending' : 'badge-status'}`}>{t.outcome}</span></td>
                            <td className="rm-td-module" style={{ fontSize: 12, color: '#6b7280' }}>{t.outcome_reason || '—'}</td>
                            <td className="rm-td-perm" style={{ textAlign: 'right', fontSize: 13 }}>{money(t.reference_price)}</td>
                            <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                              <button className="rm-action-btn rm-action-view" title="View" onClick={() => setModal({ mode: 'view', id: t.id })}><i className="bi bi-eye-fill"></i></button>
                            </div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {modal && modal.mode === 'view' && modal.id != null && (
          <TenderViewModal id={modal.id} fmt={fmt} onClose={() => setModal(null)} onEdit={() => setModal({ mode: 'edit', id: modal.id })} />
        )}
        {modal && modal.mode !== 'view' && <TenderModal mode={modal.mode} tenderId={modal.id} fmt={fmt} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchItems(); }} />}

        {delItem && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Tender?</h3>
              <p>This permanently removes <strong>{delItem.name}</strong> and all its documents.</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setDelItem(null)}>Cancel</button>
                <button className="rm-btn-danger" onClick={handleDelete}><i className="bi bi-trash-fill"></i> Delete</button>
              </div>
            </div>
          </div>
        )}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
