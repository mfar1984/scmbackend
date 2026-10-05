'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../../lib/usePermissions';

type Rule = { id: number; module: string; level: number; approver_user_id: number | null; approver_name: string | null; approver_role: string; status: string };
type Admin = { id: number; name: string; role: string | null };

/** Module-scoped approval chain manager (reuses /api/hr/approval). */
export default function ApprovalChain({ module, label, moduleKey }: { module: string; label: string; moduleKey?: string }) {
  const { can } = usePermissions();
  const canManage = moduleKey ? can(moduleKey, 'Update') : true;
  const [rules, setRules] = useState<Rule[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Rule | null>(null);
  const [level, setLevel] = useState('1');
  const [approverUserId, setApproverUserId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([
        fetch(`/api/hr/approval?module=${module}`).then(x => x.json()),
        fetch('/api/users/admins').then(x => x.json()),
      ]);
      if (r.success) setRules(r.data);
      if (a.success) setAdmins(a.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [module]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const sorted = [...rules].sort((a, b) => a.level - b.level);

  const openCreate = () => { setLevel(String(sorted.length + 1)); setApproverUserId(admins[0]?.id ? String(admins[0].id) : ''); setError(''); setModal('create'); };
  const openEdit = (r: Rule) => { setSelected(r); setLevel(String(r.level)); setApproverUserId(r.approver_user_id ? String(r.approver_user_id) : ''); setError(''); setModal('edit'); };

  const handleSave = async () => {
    if (!approverUserId) { setError('Please select an approver account.'); return; }
    setSaving(true); setError('');
    try {
      const url = modal === 'edit' ? `/api/hr/approval?id=${selected!.id}` : '/api/hr/approval';
      const method = modal === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ module, level: parseInt(level), approver_user_id: parseInt(approverUserId), status: 'Active' }) });
      const json = await res.json();
      if (json.success) { setModal(null); fetchAll(); }
      else setError(json.message || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/approval?id=${selected.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setModal(null); fetchAll(); }
      else alert(json.message || 'Delete failed.');
    } catch { alert('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="int-info-note mb-4">
        <i className="bi bi-info-circle-fill"></i>
        Define the approval chain for {label.toLowerCase()} applications. Level 1 approves first, then Level 2, and so on. Approvers are administrator accounts.
      </div>

      <div className="d-flex justify-content-end mb-3">
        {canManage && (
          <button className="rm-btn-primary" onClick={openCreate} disabled={admins.length === 0}>
            <i className="bi bi-plus-lg"></i> Add Approval Level
          </button>
        )}
      </div>

      <div className="rm-table-wrap">
        <table className="rm-table">
          <thead>
            <tr>
              <th className="rm-th-module" style={{ width: 80 }}>Level</th>
              <th className="rm-th-module">Approver (Administrator)</th>
              <th className="rm-th-perm">Status</th>
              <th className="rm-th-perm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                <div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading...
              </td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
                <i className="bi bi-diagram-3" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No approval levels defined.
              </td></tr>
            ) : sorted.map(r => (
              <tr key={r.id} className="rm-data-row">
                <td className="rm-td-module">
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', fontSize: 13 }}>{r.level}</span>
                </td>
                <td className="rm-td-module" style={{ color: '#1f2937' }}>
                  {r.approver_name || '—'}
                  {r.approver_role && <span style={{ fontSize: 11.5, color: '#9ca3af', marginLeft: 6 }}>({r.approver_role})</span>}
                </td>
                <td className="rm-td-perm"><span className={`badge-status ${r.status === 'Active' ? 'badge-approved' : 'badge-rejected'}`}>{r.status}</span></td>
                <td className="rm-td-perm">
                  <div className="d-flex gap-2 justify-content-center">
                    {canManage && <button className="rm-action-btn rm-action-edit" onClick={() => openEdit(r)}><i className="bi bi-pencil-fill"></i></button>}
                    {canManage && <button className="rm-action-btn rm-action-delete" onClick={() => { setSelected(r); setModal('delete'); }}><i className="bi bi-trash-fill"></i></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {admins.length === 0 && !loading && (
        <div className="int-warn-note mt-3">
          <i className="bi bi-exclamation-triangle-fill"></i>
          No active administrator accounts found. Add administrators under <strong>Users Management</strong> first.
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <div className="usr-modal-overlay">
          <div className="usr-modal">
            <div className="usr-modal-header">
              <div>
                <p className="usr-modal-title">{modal === 'edit' ? 'Edit Approval Level' : `Add ${label} Approval`}</p>
                <p className="usr-modal-sub">Define who approves at this level</p>
              </div>
              <button className="usr-modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="usr-modal-body">
              {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
              <div className="usr-form-row">
                <label className="usr-form-label">Level <span>*</span></label>
                <div className="usr-form-field"><input type="number" className="rm-input" style={{ maxWidth: 100 }} value={level} onChange={e => setLevel(e.target.value)} min={1} /></div>
              </div>
              <div className="usr-form-row usr-form-row-last">
                <label className="usr-form-label">Approver Account <span>*</span></label>
                <div className="usr-form-field">
                  <select className="rm-input" value={approverUserId} onChange={e => setApproverUserId(e.target.value)}>
                    <option value="">— Select Administrator —</option>
                    {admins.map(a => <option key={a.id} value={a.id}>{a.name}{a.role ? ` (${a.role})` : ''}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="usr-modal-footer">
              <button className="rm-btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="rm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-floppy-fill"></i> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && selected && (
        <div className="rm-modal-overlay">
          <div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Approval Level?</h3>
            <p>This will remove <strong>Level {selected.level} — {selected.approver_name || selected.approver_role}</strong>.</p>
            <div className="rm-modal-actions">
              <button className="rm-btn-outline" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
              <button className="rm-btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Deleting...</> : <><i className="bi bi-trash-fill"></i> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
