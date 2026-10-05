'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import { useDateFormat } from '../../../lib/useDateFormat';
import PostingViewModal from '../../../components/career/PostingViewModal';
import type { Posting } from './postings';

function reasonOf(p: Posting): { label: string; cls: string } {
  if (p.status === 'Closed') return { label: 'Closed manually', cls: 'badge-rejected' };
  return { label: 'Expired', cls: 'badge-pending' };
}

export default function CareerArchivePage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canUpdate = can('hr.career.archive', 'Update');
  const canDelete = can('hr.career.archive', 'Delete');
  const [items, setItems]   = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState<Posting | null>(null);
  const [reopenItem, setReopenItem] = useState<Posting | null>(null);
  const [newClosing, setNewClosing] = useState('');
  const [busy, setBusy] = useState(false);
  const [delItem, setDelItem] = useState<Posting | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/career/postings?scope=archived');
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(p => {
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.department || '').toLowerCase().includes(q);
  });

  const salaryText = (p: Posting) =>
    (p.min_salary != null || p.max_salary != null)
      ? `RM ${p.min_salary != null ? Number(p.min_salary).toLocaleString() : '?'} - ${p.max_salary != null ? Number(p.max_salary).toLocaleString() : '?'}`
      : '—';

  const openReopen = (p: Posting) => {
    setReopenItem(p);
    // default new closing date: 30 days from today
    const d = new Date(); d.setDate(d.getDate() + 30);
    setNewClosing(d.toISOString().slice(0, 10));
  };

  const handleReopen = async () => {
    if (!reopenItem) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/hr/career/postings/${reopenItem.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reopenItem, status: 'Published', closing_date: newClosing || null }),
      });
      const json = await res.json();
      if (json.success) { setReopenItem(null); fetchItems(); }
      else alert(json.message || 'Failed to re-open.');
    } catch { alert('Network error.'); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!delItem) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/hr/career/postings/${delItem.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setDelItem(null); fetchItems(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <Head><title>Career Archive | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Career', 'Archive']}>
        <PermissionGate moduleKey="hr.career.archive">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Career Archive</h1>
              <p className="page-subtitle">Closed and expired job postings. These are hidden from the public website.</p>
            </div>

            <div className="int-info-note mb-4">
              <i className="bi bi-info-circle-fill"></i>
              Postings move here automatically when their closing date passes, or when set to <strong>Closed</strong>. Re-open a posting to publish it again with a new closing date.
            </div>

            {/* Toolbar */}
            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search title or department…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {/* Table */}
            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead>
                  <tr>
                    <th className="rm-th-module" style={{ width: 40 }}>#</th>
                    <th className="rm-th-module">Job Title</th>
                    <th className="rm-th-module">Department</th>
                    <th className="rm-th-perm">Salary (RM)</th>
                    <th className="rm-th-perm">Applicants</th>
                    <th className="rm-th-perm">Closing Date</th>
                    <th className="rm-th-perm">Reason</th>
                    <th className="rm-th-perm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                      <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                      <i className="bi bi-archive" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No archived postings.
                    </td></tr>
                  ) : filtered.map((p, i) => {
                    const r = reasonOf(p);
                    return (
                      <tr key={p.id} className="rm-data-row">
                        <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                        <td className="rm-td-module" style={{ color: '#1f2937' }}>{p.title}</td>
                        <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{p.department || '—'}</td>
                        <td className="rm-td-perm" style={{ fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>{salaryText(p)}</td>
                        <td className="rm-td-perm"><span className="usr-role-badge">{p.applicant_count ?? 0}</span></td>
                        <td className="rm-td-perm" style={{ fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>{p.closing_date ? fmt(p.closing_date) : '—'}</td>
                        <td className="rm-td-perm"><span className={`badge-status ${r.cls}`}>{r.label}</span></td>
                        <td className="rm-td-perm">
                          <div className="d-flex gap-2 justify-content-center">
                            <button className="rm-action-btn rm-action-view" title="View details" onClick={() => setViewItem(p)}><i className="bi bi-eye-fill"></i></button>
                            {canUpdate && <button className="rm-action-btn rm-action-edit" title="Re-open posting" onClick={() => openReopen(p)}><i className="bi bi-arrow-counterclockwise"></i></button>}
                            {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete" onClick={() => setDelItem(p)}><i className="bi bi-trash-fill"></i></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>
              {filtered.length} archived posting{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {viewItem && <PostingViewModal posting={viewItem} fmt={fmt} onClose={() => setViewItem(null)} />}

        {/* Re-open modal */}
        {reopenItem && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" style={{ maxWidth: 460 }}>
              <div className="usr-modal-header">
                <div>
                  <p className="usr-modal-title">Re-open Posting</p>
                  <p className="usr-modal-sub">{reopenItem.title}</p>
                </div>
                <button className="usr-modal-close" onClick={() => setReopenItem(null)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="usr-modal-body">
                <div className="int-info-note mb-3">
                  <i className="bi bi-info-circle-fill"></i>
                  This will set the posting to <strong>Published</strong> and show it on the website again.
                </div>
                <div className="usr-form-row usr-form-row-last">
                  <label className="usr-form-label" style={{ paddingTop: 8 }}>New Closing Date</label>
                  <div className="usr-form-field">
                    <input type="date" className="rm-input" value={newClosing} onChange={e => setNewClosing(e.target.value)} />
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Leave blank for &quot;Open until filled&quot;.</div>
                  </div>
                </div>
              </div>
              <div className="usr-modal-footer">
                <button className="rm-btn-outline" onClick={() => setReopenItem(null)} disabled={busy}>Cancel</button>
                <button className="rm-btn-primary" onClick={handleReopen} disabled={busy}>
                  {busy ? <><span className="spinner-border spinner-border-sm me-1"></span> Re-opening...</> : <><i className="bi bi-arrow-counterclockwise"></i> Re-open &amp; Publish</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete modal */}
        {delItem && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Posting?</h3>
              <p>This will permanently remove <strong>{delItem.title}</strong> from the archive.</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setDelItem(null)} disabled={busy}>Cancel</button>
                <button className="rm-btn-danger" onClick={handleDelete} disabled={busy}>
                  {busy ? <><span className="spinner-border spinner-border-sm me-1"></span> Deleting...</> : <><i className="bi bi-trash-fill"></i> Delete</>}
                </button>
              </div>
            </div>
          </div>
        )}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
