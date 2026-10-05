'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../../lib/usePermissions';

const CATS = ['Projects', 'Team', 'Events', 'Office'];

type Album = {
  id: number; title: string; subtitle: string | null; category: string; year: string | null;
  description: string | null; status: string; sort_order: number; has_cover: number | boolean; photo_count: number;
};

export default function GalleryManager() {
  const { can } = usePermissions();
  const canCreate = can('web.resources.gallery.albums', 'Create');
  const canUpdate = can('web.resources.gallery.albums', 'Update');
  const canDelete = can('web.resources.gallery.albums', 'Delete');

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; id?: number } | null>(null);
  const [manage, setManage] = useState<Album | null>(null);
  const [del, setDel] = useState<Album | null>(null);

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch('/api/web/gallery')).json(); if (j.success) setAlbums(j.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const doDelete = async () => {
    if (!del) return;
    const j = await (await fetch(`/api/web/gallery/${del.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDel(null); fetchAlbums(); } else alert(j.message || 'Delete failed.');
  };

  if (manage) {
    return <AlbumPhotos album={manage} canUpdate={canUpdate} canDelete={canDelete} onBack={() => { setManage(null); fetchAlbums(); }} />;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <span style={{ fontSize: 12.5, color: '#6b7280' }}>{albums.length} album{albums.length !== 1 ? 's' : ''} · click an album to manage its photos</span>
        {canCreate && <button className="rm-btn-primary" onClick={() => setModal({ mode: 'create' })}><i className="bi bi-plus-lg"></i> Add Album</button>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
      ) : albums.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, color: '#9ca3af', fontSize: 13 }}><i className="bi bi-images" style={{ fontSize: 30, display: 'block', marginBottom: 10 }}></i>No albums yet. Create one to start uploading photos.</div>
      ) : (
        <div className="gm-grid">
          {albums.map(a => (
            <div key={a.id} className="gm-card">
              <div className="gm-card-cover" onClick={() => setManage(a)} role="button" tabIndex={0}>
                {a.has_cover
                  ? <img src={`/api/web/gallery/${a.id}?cover=1`} alt={a.title} />
                  : <div className="gm-card-cover-empty"><i className="bi bi-images"></i></div>}
                <span className="gm-card-count"><i className="bi bi-camera-fill"></i> {a.photo_count}</span>
                {a.status !== 'Active' && <span className="gm-card-hidden">Hidden</span>}
                <div className="gm-card-hover"><i className="bi bi-collection-fill"></i> Manage Photos</div>
              </div>
              <div className="gm-card-body">
                <div className="gm-card-meta">
                  <span className="gm-cat-pill">{a.category}</span>
                  {a.year && <span className="gm-year">{a.year}</span>}
                </div>
                <h3 className="gm-card-title">{a.title}</h3>
                {a.subtitle && <p className="gm-card-sub">{a.subtitle}</p>}
                <div className="gm-card-actions">
                  <button className="rm-action-btn rm-action-view" title="Manage photos" onClick={() => setManage(a)}><i className="bi bi-images"></i></button>
                  {canUpdate && <button className="rm-action-btn rm-action-edit" title="Edit album" onClick={() => setModal({ mode: 'edit', id: a.id })}><i className="bi bi-pencil-fill"></i></button>}
                  {canDelete && <button className="rm-action-btn rm-action-delete" title="Delete album" onClick={() => setDel(a)}><i className="bi bi-trash-fill"></i></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <AlbumModal mode={modal.mode} albumId={modal.id} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAlbums(); }} />}
      {del && (
        <div className="rm-modal-overlay">
          <div className="rm-modal">
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Album?</h3>
            <p>This permanently removes <strong>{del.title}</strong> and all its photos.</p>
            <div className="rm-modal-actions">
              <button className="rm-btn-outline" onClick={() => setDel(null)}>Cancel</button>
              <button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AlbumModal({ mode, albumId, onClose, onSaved }: { mode: 'create' | 'edit'; albumId?: number; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>({ title: '', subtitle: '', category: 'Projects', year: '', description: '', status: 'Active', sort_order: 0 });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [hasCover, setHasCover] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !albumId) return;
    fetch(`/api/web/gallery/${albumId}`).then(r => r.json()).then(j => {
      if (j.success) {
        const d = j.data;
        setF({ title: d.title || '', subtitle: d.subtitle || '', category: d.category || 'Projects', year: d.year || '', description: d.description || '', status: d.status || 'Active', sort_order: d.sort_order || 0 });
        setHasCover(!!d.has_cover);
        if (d.has_cover) setPreview(`/api/web/gallery/${albumId}?cover=1&t=${Date.now()}`);
      }
    }).finally(() => setLoading(false));
  }, [mode, albumId]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files?.[0];
    if (!fl) return;
    setError(''); setFile(fl); setPreview(URL.createObjectURL(fl));
  };

  const save = async () => {
    if (!f.title?.trim()) { setError('Album title is required.'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.keys(f).forEach(k => fd.append(k, String(f[k] ?? '')));
      if (file) fd.append('file', file);
      const url = mode === 'create' ? '/api/web/gallery' : `/api/web/gallery/${albumId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const j = await (await fetch(url, { method, body: fd })).json();
      if (!j.success) { setError(j.message || 'Failed to save.'); setSaving(false); return; }
      onSaved();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 640 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-collection-fill" style={{ marginRight: 8 }}></i>{mode === 'create' ? 'Add Album' : 'Edit Album'}</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading…</div>
          ) : (
            <>
              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-card-text"></i> Album Details</div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Title <span style={{ color: '#ef4444' }}>*</span></label><input className="rm-input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Campus Network Deployment" /></div>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Subtitle</label><input className="rm-input" value={f.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="e.g. Politeknik Malaysia" /></div>
                </div>
                <div className="d-flex flex-wrap gap-3 mb-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 160px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Category</label><select className="rm-input" value={f.category} onChange={e => set('category', e.target.value)}>{CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div style={{ flex: '1 1 120px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Year</label><input className="rm-input" value={f.year} onChange={e => set('year', e.target.value)} placeholder="2025" /></div>
                  <div style={{ flex: '0 0 110px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Order</label><input type="number" className="rm-input" value={f.sort_order} onChange={e => set('sort_order', e.target.value)} /></div>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ padding: '0 2px' }}>
                  <div style={{ flex: '1 1 100%' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Description</label><textarea className="rm-input" rows={3} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Short description of this album" /></div>
                </div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-image-fill"></i> Cover Image</div>
                <div className="d-flex gap-3 align-items-center flex-wrap" style={{ padding: '0 2px' }}>
                  <div style={{ width: 120, height: 80, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="bi bi-image" style={{ color: '#cbd5e1', fontSize: 24 }}></i>}
                  </div>
                  <label className="srm-file-btn" style={{ justifyContent: 'flex-start' }}><i className="bi bi-upload"></i><span>{file ? file.name : (hasCover ? 'Replace cover' : 'Choose cover')}</span><input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={pickImage} /></label>
                </div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', padding: '6px 2px 0' }}>Shown as the album thumbnail. You can also add more photos after saving.</div>
              </div>

              <div className="int-card">
                <div className="int-card-title"><i className="bi bi-toggles"></i> Visibility</div>
                <div style={{ flex: '0 0 180px', padding: '0 2px' }}><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Status</label><select className="rm-input" value={f.status} onChange={e => set('status', e.target.value)} style={{ maxWidth: 200 }}><option>Active</option><option>Hidden</option></select></div>
              </div>
            </>
          )}
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-check-circle-fill"></i> {mode === 'create' ? 'Create Album' : 'Save Changes'}</>}</button>
        </div>
      </div>
    </div>
  );
}

type Photo = { id: number; caption: string | null; detail: string | null; file_name: string };

function AlbumPhotos({ album, canUpdate, canDelete, onBack }: { album: Album; canUpdate: boolean; canDelete: boolean; onBack: () => void }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<Photo | null>(null);
  const [del, setDel] = useState<Photo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const j = await (await fetch(`/api/web/gallery/${album.id}`)).json(); if (j.success) setPhotos(j.data.photos || []); }
    catch { /* silent */ } finally { setLoading(false); }
  }, [album.id]);
  useEffect(() => { load(); }, [load]);

  const uploadFiles = async (files: FileList) => {
    setUploading(true); setError('');
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const j = await (await fetch(`/api/web/gallery/${album.id}/photos`, { method: 'POST', body: fd })).json();
        if (!j.success) { setError(j.message || 'Upload failed.'); break; }
      }
      await load();
    } catch { setError('Network error during upload.'); }
    finally { setUploading(false); }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = '';
  };

  const doDelete = async () => {
    if (!del) return;
    const j = await (await fetch(`/api/web/gallery/photo/${del.id}`, { method: 'DELETE' })).json();
    if (j.success) { setDel(null); load(); } else alert(j.message || 'Delete failed.');
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <button className="rm-btn-outline" onClick={onBack}><i className="bi bi-arrow-left"></i> Back to Albums</button>
        {canUpdate && (
          <label className="rm-btn-primary" style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
            {uploading ? <><span className="spinner-border spinner-border-sm me-1"></span> Uploading…</> : <><i className="bi bi-upload"></i> Upload Photos</>}
            <input type="file" accept=".png,.jpg,.jpeg,.webp" multiple style={{ display: 'none' }} disabled={uploading} onChange={onPick} />
          </label>
        )}
      </div>

      <div className="gm-album-head">
        <div className="gm-album-cover">
          {album.has_cover ? <img src={`/api/web/gallery/${album.id}?cover=1`} alt={album.title} /> : <div className="gm-card-cover-empty"><i className="bi bi-images"></i></div>}
        </div>
        <div>
          <span className="gm-cat-pill">{album.category}{album.year ? ` · ${album.year}` : ''}</span>
          <h2 className="gm-album-title">{album.title}</h2>
          {album.subtitle && <p className="gm-album-sub">{album.subtitle}</p>}
        </div>
      </div>

      {error && <div className="alert alert-danger mb-3" style={{ fontSize: 13 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}><div className="spinner-border spinner-border-sm text-secondary me-2"></div> Loading photos…</div>
      ) : photos.length === 0 ? (
        <div className="gm-drop">
          <i className="bi bi-cloud-arrow-up"></i>
          <p>No photos in this album yet.</p>
          {canUpdate && <label className="rm-btn-primary" style={{ cursor: 'pointer' }}><i className="bi bi-upload"></i> Upload Photos<input type="file" accept=".png,.jpg,.jpeg,.webp" multiple style={{ display: 'none' }} onChange={onPick} /></label>}
        </div>
      ) : (
        <div className="gm-photo-grid">
          {photos.map(p => (
            <div key={p.id} className="gm-photo">
              <img src={`/api/web/gallery/photo/${p.id}?image=1`} alt={p.caption || ''} loading="lazy" />
              <div className="gm-photo-overlay">
                {p.caption && <span className="gm-photo-cap">{p.caption}</span>}
                <div className="gm-photo-actions">
                  {canUpdate && <button className="gm-photo-btn" title="Edit caption" onClick={() => setEdit(p)}><i className="bi bi-pencil-fill"></i></button>}
                  {canDelete && <button className="gm-photo-btn gm-photo-btn-danger" title="Delete photo" onClick={() => setDel(p)}><i className="bi bi-trash-fill"></i></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && photos.length > 0 && <div style={{ marginTop: 12, fontSize: 12.5, color: '#6b7280' }}>{photos.length} photo{photos.length !== 1 ? 's' : ''}</div>}

      {edit && <PhotoEditModal photo={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
      {del && (
        <div className="rm-modal-overlay">
          <div className="rm-modal">
            <div className="rm-modal-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
            <h3>Delete Photo?</h3>
            <p>This permanently removes the photo from this album.</p>
            <div className="rm-modal-actions">
              <button className="rm-btn-outline" onClick={() => setDel(null)}>Cancel</button>
              <button className="rm-btn-danger" onClick={doDelete}><i className="bi bi-trash-fill"></i> Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PhotoEditModal({ photo, onClose, onSaved }: { photo: Photo; onClose: () => void; onSaved: () => void }) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [detail, setDetail] = useState(photo.detail || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const j = await (await fetch(`/api/web/gallery/photo/${photo.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caption, detail }) })).json();
      if (j.success) onSaved(); else alert(j.message || 'Failed to save.');
    } catch { alert('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="usr-modal-overlay">
      <div className="usr-modal" style={{ maxWidth: 560 }}>
        <div className="usr-modal-header">
          <div><p className="usr-modal-title"><i className="bi bi-pencil-square" style={{ marginRight: 8 }}></i>Photo Caption</p></div>
          <button className="usr-modal-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="usr-modal-body">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src={`/api/web/gallery/photo/${photo.id}?image=1`} alt="" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8 }} />
          </div>
          <div className="mb-3"><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Caption</label><input className="rm-input" value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Main Distribution Frame" /></div>
          <div><label className="rm-label" style={{ display: 'block', marginBottom: 6 }}>Detail</label><textarea className="rm-input" rows={2} value={detail} onChange={e => setDetail(e.target.value)} placeholder="Longer description shown in the lightbox" /></div>
        </div>
        <div className="usr-modal-footer">
          <button className="rm-btn-outline" onClick={onClose}>Cancel</button>
          <button className="rm-btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</> : <><i className="bi bi-check-circle-fill"></i> Save</>}</button>
        </div>
      </div>
    </div>
  );
}
