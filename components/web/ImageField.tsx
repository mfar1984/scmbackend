'use client';
import { useState } from 'react';

/**
 * Image field — accepts either an uploaded image (base64 data URL)
 * or an existing path (e.g. /assets/img/heroimage.png). Shows preview.
 */
export default function ImageField({ value, onChange, onError }: {
  value: string; onChange: (v: string) => void; onError?: (m: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { onError?.(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 2MB.`); e.target.value = ''; return; }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = ev => { onChange(String(ev.target?.result || '')); setBusy(false); };
    reader.onerror = () => { onError?.('Failed to read image.'); setBusy(false); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="wcms-image">
      <div className="wcms-image-preview">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="preview" />
        ) : (
          <div className="wcms-image-empty"><i className="bi bi-image"></i><span>No image</span></div>
        )}
      </div>
      <div className="wcms-image-actions">
        <label className="rm-btn-outline" style={{ cursor: 'pointer', marginBottom: 0 }}>
          <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" style={{ display: 'none' }} onChange={pick} />
          {busy ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-upload"></i> Upload</>}
        </label>
        {value && <button type="button" className="rm-action-btn rm-action-delete" title="Remove" onClick={() => onChange('')}><i className="bi bi-trash-fill"></i></button>}
      </div>
      <input className="rm-input" style={{ marginTop: 8, fontSize: 12 }} value={value.startsWith('data:') ? '' : value} placeholder="or /assets/img/path.png" onChange={e => onChange(e.target.value)} disabled={value.startsWith('data:')} />
      {value.startsWith('data:') && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Uploaded image attached. Remove to type a path instead.</div>}
    </div>
  );
}
