'use client';
import { useState, useEffect, useCallback } from 'react';
import FieldRenderer from './FieldRenderer';
import { usePermissions } from '@/lib/usePermissions';
import type { PageSchema } from '@/lib/webContentSchema';

const WEBSITE_BASE = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';

export default function WebPageEditor({ slug, moduleKey }: { slug: string; moduleKey?: string }) {
  const { can } = usePermissions();
  const canUpdate = moduleKey ? can(moduleKey, 'Update') : true;
  const [schema, setSchema] = useState<PageSchema | null>(null);
  const [data, setData] = useState<any>({});
  const [status, setStatus] = useState('Published');
  const [activeGroup, setActiveGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/web/content/${slug}`).then(r => r.json()).then(j => {
      if (j.success) {
        setSchema(j.schema); setData(j.data || {}); setStatus(j.status || 'Published');
        if (j.schema?.groups?.length) setActiveGroup(j.schema.groups[0].key);
      } else setError(j.message || 'Failed to load.');
    }).catch(() => setError('Failed to load.')).finally(() => setLoading(false));
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  const setGroupField = (groupKey: string, fieldKey: string, value: any) => {
    setData((d: any) => ({ ...d, [groupKey]: { ...(d[groupKey] || {}), [fieldKey]: value } }));
  };

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const j = await (await fetch(`/api/web/content/${slug}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: data, status }) })).json();
      if (j.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(j.message || 'Failed to save.');
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const restore = async () => {
    if (!confirm('Restore the original default content? Your current edits for this page will be replaced.')) return;
    const j = await (await fetch(`/api/web/content/${slug}`, { method: 'DELETE' })).json();
    if (j.success) load();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>;
  if (!schema) return <div className="alert alert-danger" style={{ fontSize: 13 }}>{error || 'No schema for this page.'}</div>;

  const group = schema.groups.find(g => g.key === activeGroup) || schema.groups[0];

  return (
    <>
      {!canUpdate && (
        <div className="rd-readonly-note">
          <i className="bi bi-eye-fill"></i>
          You have read-only access to this page. Editing is disabled.
        </div>
      )}
      <div className="mb-4">
        <h1 className="page-title">{schema.title} — Page Content</h1>
        <p className="page-subtitle">Edit the content shown on the public page. Changes publish to the website.</p>
      </div>

      {saved && <div className="rm-saved-banner mb-3"><i className="bi bi-check-circle-fill"></i> Saved.</div>}
      {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <select className="rm-input" style={{ width: 150 }} value={status} onChange={e => setStatus(e.target.value)} disabled={!canUpdate}>
            <option>Published</option>
            <option>Draft</option>
          </select>
          <a className="rm-btn-outline" href={`${WEBSITE_BASE}${schema.livePath}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><i className="bi bi-box-arrow-up-right"></i> View Live</a>
        </div>
        <div className="d-flex gap-2">
          {canUpdate && <button className="rm-btn-outline" onClick={restore}><i className="bi bi-arrow-counterclockwise"></i> Restore Defaults</button>}
          {canUpdate && <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-floppy-fill"></i> Save Page</>}</button>}
        </div>
      </div>

      {/* Section (group) tabs — always clickable, even in read-only mode */}
      <div className="int-tabs mb-4">
        {schema.groups.map(g => (
          <button key={g.key} className={`int-tab-btn${activeGroup === g.key ? ' active' : ''}`} onClick={() => setActiveGroup(g.key)}>
            <i className={`bi ${g.icon} me-1`}></i>{g.label}
          </button>
        ))}
      </div>

      {/* Only the editable fields are locked when read-only */}
      <fieldset disabled={!canUpdate} className={canUpdate ? undefined : 'rd-locked'} style={{ border: 0, margin: 0, padding: 0, minInlineSize: 'auto' }}>
        <div className="int-card">
          <div className="int-card-title"><i className={`bi ${group.icon}`}></i> {group.label}</div>
          {group.fields.map(f => (
            <FieldRenderer
              key={f.key}
              field={f}
              value={(data[group.key] || {})[f.key]}
              onChange={v => setGroupField(group.key, f.key, v)}
              onError={setError}
              disabled={!canUpdate}
            />
          ))}
        </div>
      </fieldset>
    </>
  );
}
