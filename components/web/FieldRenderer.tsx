'use client';
import RichTextEditor from './RichTextEditor';
import ImageField from './ImageField';
import type { FieldDef } from '@/lib/webContentSchema';

function ListEditor({ field, value, onChange, onError, disabled }: { field: FieldDef; value: any[]; onChange: (v: any[]) => void; onError?: (m: string) => void; disabled?: boolean }) {
  const items: any[] = Array.isArray(value) ? value : [];
  const update = (i: number, key: string, v: any) => onChange(items.map((it, idx) => idx === i ? { ...it, [key]: v } : it));
  const add = () => {
    const blank: any = {};
    (field.itemFields || []).forEach(f => { blank[f.key] = ''; });
    onChange([...items, blank]);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };

  return (
    <div className="wcms-list">
      {items.length === 0 && <div className="wcms-list-empty">No {field.itemLabel || 'items'} yet.</div>}
      {items.map((item, i) => (
        <div key={i} className="wcms-list-item">
          <div className="wcms-list-item-head">
            <span className="wcms-list-item-title">{field.itemLabel || 'Item'} {i + 1}</span>
            <div className="wcms-list-item-actions">
              <button type="button" className="wcms-mini-btn" title="Move up" disabled={i === 0} onClick={() => move(i, -1)}><i className="bi bi-arrow-up"></i></button>
              <button type="button" className="wcms-mini-btn" title="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}><i className="bi bi-arrow-down"></i></button>
              <button type="button" className="wcms-mini-btn wcms-mini-danger" title="Remove" onClick={() => remove(i)}><i className="bi bi-trash"></i></button>
            </div>
          </div>
          <div className="wcms-list-item-body">
            {(field.itemFields || []).map(f => (
              <FieldRenderer key={f.key} field={f} value={item[f.key]} onChange={v => update(i, f.key, v)} onError={onError} compact disabled={disabled} />
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="rm-btn-outline" style={{ padding: '6px 14px', fontSize: 12.5 }} onClick={add}><i className="bi bi-plus-lg"></i> Add {field.itemLabel || 'Item'}</button>
    </div>
  );
}

export default function FieldRenderer({ field, value, onChange, onError, compact, disabled }: {
  field: FieldDef; value: any; onChange: (v: any) => void; onError?: (m: string) => void; compact?: boolean; disabled?: boolean;
}) {
  return (
    <div className={`wcms-field${compact ? ' wcms-field-compact' : ''}`}>
      <label className="wcms-field-label">{field.label}</label>
      {field.hint && <div className="wcms-field-hint">{field.hint}</div>}

      {field.type === 'text' && (
        <input className="rm-input" value={value || ''} onChange={e => onChange(e.target.value)} />
      )}
      {field.type === 'textarea' && (
        <textarea className="rm-input" rows={3} value={value || ''} onChange={e => onChange(e.target.value)} />
      )}
      {field.type === 'richtext' && (
        <RichTextEditor value={value || ''} onChange={onChange} disabled={disabled} />
      )}
      {field.type === 'image' && (
        <ImageField value={value || ''} onChange={onChange} onError={onError} />
      )}
      {field.type === 'select' && (
        <select className="rm-input" value={value || ''} onChange={e => onChange(e.target.value)}>
          <option value="">—</option>
          {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {field.type === 'list' && (
        <ListEditor field={field} value={value} onChange={onChange} onError={onError} disabled={disabled} />
      )}
    </div>
  );
}
