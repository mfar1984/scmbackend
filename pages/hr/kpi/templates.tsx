'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import PermissionGate from '../../../components/PermissionGate';
import { usePermissions } from '../../../lib/usePermissions';

type Tpl = { id: number; name: string; description: string | null; item_count: number; total_weight: number; status: string };
type Item = { competency_id: string; competency_name: string; weight: string };

export default function KpiTemplatesPage() {
  const { can } = usePermissions();
  const canCreate = can('hr.kpi.templates', 'Create');
  const canUpdate = can('hr.kpi.templates', 'Update');
  const canDelete = can('hr.kpi.templates', 'Delete');
  const [rows, setRows] = useState<Tpl[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selId, setSelId] = useState<number | null>(null);
  const [delRow, setDelRow] = useState<Tpl | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active');
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/hr/kpi/templates')).json(); if (j.success) setRows(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    fetchRows();
    fetch('/api/hr/kpi/lists').then(r => r.json()).then(j => { if (j.success) setCompetencies(j.data.competencies); });
  }, [fetchRows]);

  const totalWeight = items.reduce((s, it) => s + (parseFloat(it.weight) || 0), 0);

  const openCreate = () => { setName(''); setDescription(''); setStatus('Active'); setItems([]); setError(''); setSelId(null); setModal('create'); };
  const openEdit = async (r: Tpl) => {
    setError(''); setSelId(r.id); setModal('edit');
    const j = await (await fetch(`/api/hr/kpi/templates/${r.id}`)).json();
    if (j.success) {
      setName(j.data.name); setDescription(j.data.description || ''); setStatus(j.data.status);
      setItems(j.data.items.map((it: any) => ({ competency_id: String(it.competency_id || ''), competency_name: it.competency_name || '', weight: String(it.weight) })));
    }
  };

  const addItem = () => setItems(p => [...p, { competency_id: '', competency_name: '', weight: '' }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const setItem = (i: number, k: keyof Item, v: string) => setItems(p => p.map((it, idx) => {
    if (idx !== i) return it;
    if (k === 'competency_id') { const c = competencies.find(x => String(x.id) === v); return { ...it, competency_id: v, competency_name: c ? c.name : it.competency_name }; }
    return { ...it, [k]: v };
  }));

  const save = async () => {
    if (!name.trim()) { setError('Template name is required.'); return; }
    if (items.length === 0) { setError('Add at least one competency.'); return; }
    if (items.some(it => !it.competency_name.trim())) { setError('Every row must have a competency selected.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { name, description, status, items: items.map(it => ({ competency_id: it.competency_id || null, competency_name: it.competency_name, weight: it.weight })) };
      const url = modal === 'edit' ? `/api/hr/kpi/templates/${selId}` : '/api/hr/kpi/templates';
      const j = await (await fetch(url, { method: modal === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
      if (j.success) { setModal(null); fetchRows(); } else setError(j.message || 'Failed.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!delRow) return;
    const j = await (await fetch(`/api/hr/kpi/templates/${delRow.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDelRow(null); fetchRows(); } else alert(j.message || 'Delete failed.');
  };

  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Head><title>KPI Templates | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Human Resources', 'KPI', 'Templates']}>
        <PermissionGate moduleKey="hr.kpi.templates">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4"><h1 className="page-title">KPI Templates</h1><p className="page-subtitle">Group competencies with weights into a reusable appraisal form.</p></div>

            <div className="d-flex gap-2 mb-3 flex-wrap">
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input className="rm-input" style={{ paddingLeft: 34 }} placeholder="Search templates…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {canCreate && <button className="rm-btn-primary" onClick={openCreate}><i className="bi bi-plus-lg"></i> New Template</button>}
            </div>

            <div className="rm-table-wrap">
              <table className="rm-table">
                <thead><tr>
                  <th className="rm-th-module">Template</th><th className="rm-th-module">Description</th>
                  <th className="rm-th-perm">Competencies</th><th className="rm-th-perm">Total Weight</th>
                  <th className="rm-th-perm">Status</th><th className="rm-th-perm">Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-clipboard-data" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No templates yet.</td></tr>
                  ) : filtered.map(r => (
                    <tr key={r.id} className="rm-data-row">
                      <td className="rm-td-module" style={{ color: '#1f2937' }}>{r.name}</td>
                      <td className="rm-td-module" style={{ fontSize: 13, color: '#6b7280' }}>{r.description || '—'}</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className="usr-role-badge">{r.item_count}</span></td>
                      <td className="rm-td-perm" style={{ textAlign: 'center', fontSize: 13, color: Number(r.total_weight) === 100 ? '#16a34a' : '#d97706' }}>{Number(r.total_weight)}%</td>
                      <td className="rm-td-perm" style={{ textAlign: 'center' }}><span className={`badge-status ${r.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{r.status}</span></td>
                      <td className="rm-td-perm"><div className="d-flex gap-2 justify-content-center">
                        {canUpdate && <button className="rm-action-btn rm-action-edit" onClick={() => openEdit(r)}><i className="bi bi-pencil-fill"></i></button>}
                        {canDelete && <button className="rm-action-btn rm-action-delete" onClick={() => setDelRow(r)}><i className="bi bi-trash-fill"></i></button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {(modal === 'create' || modal === 'edit') && (
          <div className="usr-modal-overlay">
            <div className="usr-modal" style={{ maxWidth: 760 }}>
              <div className="usr-modal-header"><div><p className="usr-modal-title">{modal === 'edit' ? 'Edit Template' : 'New KPI Template'}</p></div><button className="usr-modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button></div>
              <div className="usr-modal-body">
                {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
                <div className="mb-3"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Template Name <span style={{ color: '#ef4444' }}>*</span></label><input className="rm-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Executive Annual Appraisal" /></div>
                <div className="mb-3"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Description</label><textarea className="rm-input" rows={2} value={description} onChange={e => setDescription(e.target.value)} /></div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="rm-label" style={{ margin: 0 }}>Competencies &amp; Weights <span style={{ color: '#ef4444' }}>*</span></label>
                  <button type="button" className="rm-btn-outline" style={{ padding: '6px 14px' }} onClick={addItem}><i className="bi bi-plus-lg"></i> Add</button>
                </div>
                {items.length === 0 ? (
                  <div style={{ border: '1px dashed #d1d5db', borderRadius: 10, padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No competencies added.</div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {items.map((it, i) => (
                      <div key={i} className="d-flex gap-2 align-items-end">
                        <div style={{ flex: '1 1 auto' }}>
                          <select className="rm-input" value={it.competency_id} onChange={e => setItem(i, 'competency_id', e.target.value)}>
                            <option value="">Select competency...</option>
                            {competencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.category})</option>)}
                          </select>
                        </div>
                        <div style={{ flex: '0 0 120px' }}>
                          <input type="number" step="0.01" className="rm-input" value={it.weight} onChange={e => setItem(i, 'weight', e.target.value)} placeholder="Weight %" />
                        </div>
                        <button type="button" className="rm-action-btn rm-action-delete" onClick={() => removeItem(i)}><i className="bi bi-trash-fill"></i></button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 10, textAlign: 'right', fontSize: 13, color: totalWeight === 100 ? '#16a34a' : '#d97706' }}>
                  Total weight: <strong>{totalWeight}%</strong>{totalWeight !== 100 && ' (recommended 100%)'}
                </div>
                <div className="mt-3"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Status</label><select className="rm-input" style={{ maxWidth: 200 }} value={status} onChange={e => setStatus(e.target.value)}><option>Active</option><option>Inactive</option></select></div>
              </div>
              <div className="usr-modal-footer"><button className="rm-btn-outline" onClick={() => setModal(null)} disabled={saving}>Cancel</button><button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-check-circle-fill"></i> {modal === 'edit' ? 'Update' : 'Create'}</>}</button></div>
            </div>
          </div>
        )}

        {delRow && (
          <div className="rm-modal-overlay"><div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Template?</h3><p>Remove <strong>{delRow.name}</strong> and its competencies.</p>
            <div className="rm-modal-actions"><button className="rm-btn-outline" onClick={() => setDelRow(null)}>Cancel</button><button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button></div>
          </div></div>
        )}
        </PermissionGate>
      </AdminLayout>
    </>
  );
}
