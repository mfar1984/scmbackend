'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';
import { useDateFormat } from '../../../lib/useDateFormat';
import PostingFormModal from '../../../components/career/PostingFormModal';
import PostingViewModal from '../../../components/career/PostingViewModal';

export type Posting = {
  id: number; title: string; department: string | null; location: string | null;
  job_type: string; employment_type: string;
  min_salary: number | null; max_salary: number | null; salary_notes: string | null;
  min_experience: number | null; max_experience: number | null; experience_level: string | null;
  icon_theme: string; overview: string | null; responsibilities: string | null;
  requirements: string | null; benefits: string | null; skills: string | null;
  is_featured: number; status: string; posted_date: string | null; closing_date: string | null;
  applicant_count?: number;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Published: 'badge-approved', Draft: 'badge-pending', Closed: 'badge-rejected',
  };
  return <span className={`badge-status ${map[status] || 'badge-pending'}`}>{status}</span>;
}

export default function CareerPostingsPage() {
  const { fmt } = useDateFormat();
  const { can } = usePermissions();
  const canCreate = can('hr.career.postings', 'Create');
  const canUpdate = can('hr.career.postings', 'Update');
  const canDelete = can('hr.career.postings', 'Delete');
  const [items, setItems]   = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formModal, setFormModal] = useState<{ mode: 'create' | 'edit'; data?: Posting } | null>(null);
  const [viewItem, setViewItem] = useState<Posting | null>(null);
  const [delItem, setDelItem]   = useState<Posting | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/career/postings?scope=active');
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.title.toLowerCase().includes(q) || (p.department || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const salaryText = (p: Posting) =>
    (p.min_salary != null || p.max_salary != null)
      ? `RM ${p.min_salary != null ? Number(p.min_salary).toLocaleString() : '?'} - ${p.max_salary != null ? Number(p.max_salary).toLocaleString() : '?'}`
      : '—';

  const handleDelete = async () => {
    if (!delItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/career/postings/${delItem.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setDelItem(null); fetchItems(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
    finally { setDeleting(false); }
  };

  return (
    <>
      <Head><title>Career Postings | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'Career', 'Career Postings']}>
        <PermissionGate moduleKey="hr.career.postings">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Career Postings</h1>
              <p className="page-subtitle">Create and manage job vacancies published on the ATLINE website.</p>
            </div>

            <div className="int-info-note mb-4">
              <i className="bi bi-info-circle-fill"></i>
              Postings with status <strong>Published</strong> appear on the public career page. Draft and Closed postings are hidden from the website.
            </div>

            {/* Toolbar */}
            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search title or department…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="rm-input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option>Published</option><option>Draft</option><option>Closed</option>
              </select>
              {canCreate && (
                <button className="rm-btn-primary" onClick={() => setFormModal({ mode: 'create' })}>
                  <i className="bi bi-plus-lg"></i> Create Posting
                </button>
              )}
            </div>

            {/* Table */}
            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead>
                  <tr>
                    <th className="rm-th-module" style={{ width: 40 }}>#</th>
                    <th className="rm-th-module">Job Title</th>
                    <th className="rm-th-module">Department</th>
                    <th className="rm-th-perm">Type</th>
                    <th className="rm-th-perm">Salary (RM)</th>
                    <th className="rm-th-perm">Applicants</th>
                    <th className="rm-th-perm">Status</th>
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
                      <i className="bi bi-megaphone" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No postings found.
                    </td></tr>
                  ) : filtered.map((p, i) => (
                    <tr key={p.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                      <td className="rm-td-module" style={{ color: '#1f2937' }}>
                        {p.is_featured ? <i className="bi bi-star-fill" style={{ color: '#f59e0b', fontSize: 11, marginRight: 5 }}></i> : null}
                        {p.title}
                      </td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{p.department || '—'}</td>
                      <td className="rm-td-perm" style={{ fontSize: 12.5, color: '#6b7280' }}>{p.job_type}</td>
                      <td className="rm-td-perm" style={{ fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>{salaryText(p)}</td>
                      <td className="rm-td-perm">
                        <span className="usr-role-badge">{p.applicant_count ?? 0}</span>
                      </td>
                      <td className="rm-td-perm"><StatusBadge status={p.status} /></td>
                      <td className="rm-td-perm">
                        <div className="d-flex gap-2 justify-content-center">
                          <button className="rm-action-btn rm-action-view" onClick={() => setViewItem(p)}><i className="bi bi-eye-fill"></i></button>
                          {canUpdate && <button className="rm-action-btn rm-action-edit" onClick={() => setFormModal({ mode: 'edit', data: p })}><i className="bi bi-pencil-fill"></i></button>}
                          {canDelete && <button className="rm-action-btn rm-action-delete" onClick={() => setDelItem(p)}><i className="bi bi-trash-fill"></i></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>
              Showing {filtered.length} of {items.length} posting{items.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {formModal && (
          <PostingFormModal
            mode={formModal.mode}
            data={formModal.data}
            onClose={() => setFormModal(null)}
            onSaved={() => { setFormModal(null); fetchItems(); }}
          />
        )}
        {viewItem && <PostingViewModal posting={viewItem} fmt={fmt} onClose={() => setViewItem(null)} />}

        {delItem && (
          <div className="rm-modal-overlay">
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
              <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h3>Delete Posting?</h3>
              <p>This will permanently remove <strong>{delItem.title}</strong>.</p>
              <div className="rm-modal-actions">
                <button className="rm-btn-outline" onClick={() => setDelItem(null)} disabled={deleting}>Cancel</button>
                <button className="rm-btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <><span className="spinner-border spinner-border-sm me-1"></span> Deleting...</> : <><i className="bi bi-trash-fill"></i> Delete</>}
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
