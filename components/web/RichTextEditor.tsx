'use client';
import { useRef, useEffect } from 'react';

/**
 * Lightweight WYSIWYG editor (contentEditable + execCommand).
 * Stores HTML. No external dependency — works on cPanel/static hosting.
 */
export default function RichTextEditor({ value, onChange, disabled }: { value: string; onChange: (html: string) => void; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  // Set initial HTML only when it differs (avoids caret jump while typing)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const makeLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const btn = (icon: string, title: string, cmd: string, arg?: string) => (
    <button type="button" className="rte-btn" title={title} onMouseDown={e => { e.preventDefault(); exec(cmd, arg); }}>
      <i className={`bi ${icon}`}></i>
    </button>
  );

  return (
    <div className={`rte${disabled ? ' rte-disabled' : ''}`}>
      {!disabled && (
      <div className="rte-toolbar">
        {btn('bi-type-bold', 'Bold', 'bold')}
        {btn('bi-type-italic', 'Italic', 'italic')}
        {btn('bi-type-underline', 'Underline', 'underline')}
        <span className="rte-sep" />
        {btn('bi-list-ul', 'Bullet list', 'insertUnorderedList')}
        {btn('bi-list-ol', 'Numbered list', 'insertOrderedList')}
        <span className="rte-sep" />
        <button type="button" className="rte-btn" title="Heading" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h3'); }}><i className="bi bi-type-h3"></i></button>
        <button type="button" className="rte-btn" title="Paragraph" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'p'); }}><i className="bi bi-paragraph"></i></button>
        <span className="rte-sep" />
        <button type="button" className="rte-btn" title="Link" onMouseDown={e => { e.preventDefault(); makeLink(); }}><i className="bi bi-link-45deg"></i></button>
        {btn('bi-eraser', 'Clear formatting', 'removeFormat')}
      </div>
      )}
      <div
        ref={ref}
        className="rte-area"
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={() => { if (!disabled && ref.current) onChange(ref.current.innerHTML); }}
      />
    </div>
  );
}
