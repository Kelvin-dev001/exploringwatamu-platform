import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Check, X, Pencil } from 'lucide-react';
import { cn, kes } from '@/lib/utils';

/** Accessible on/off switch. */
export function Toggle({ checked, onChange, label, disabled, size = 'md' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onChange(!checked); }}
      className={cn('relative inline-flex shrink-0 items-center rounded-full transition-colors disabled:opacity-50', size === 'sm' ? 'h-5 w-9' : 'h-6 w-11', checked ? 'bg-ok' : 'bg-line')}
    >
      <span className={cn('inline-block rounded-full bg-white shadow transition-transform', size === 'sm' ? 'size-4' : 'size-5', checked ? (size === 'sm' ? 'translate-x-[1.1rem]' : 'translate-x-[1.3rem]') : 'translate-x-0.5')} />
    </button>
  );
}

/** Click-to-edit KES amount. Enter saves, Esc cancels. */
export function InlinePrice({ value, onSave, label = 'Price', suffix }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (editing) ref.current?.select(); }, [editing]);

  const save = async () => {
    const n = Number(String(draft).replace(/[^\d.]/g, ''));
    if (!draft || Number.isNaN(n) || n === Number(value)) return setEditing(false);
    setSaving(true);
    const ok = await onSave(n);
    setSaving(false);
    if (ok !== false) setEditing(false);
  };

  if (!editing) {
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDraft(value ?? ''); setEditing(true); }}
        className="group inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left font-semibold tabular-nums text-ink hover:bg-subtle" aria-label={`Edit ${label}`}>
        {value === null || value === undefined ? <span className="text-faint">Set price</span> : kes(value)}
        {suffix && <span className="text-xs font-normal text-faint">{suffix}</span>}
        <Pencil className="size-3 text-faint opacity-60 group-hover:opacity-100" />
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        inputMode="decimal"
        aria-label={label}
        className="h-8 w-28 rounded-md border border-brand bg-surface px-2 text-right text-sm tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-brand/20"
        disabled={saving}
      />
      <button type="button" onClick={save} disabled={saving} className="rounded-md p-1.5 text-ok hover:bg-ok-soft" aria-label="Save price"><Check className="size-4" /></button>
      <button type="button" onClick={() => setEditing(false)} className="rounded-md p-1.5 text-faint hover:bg-subtle" aria-label="Cancel"><X className="size-4" /></button>
    </span>
  );
}

/** Small "…" menu for row actions. items: [{ label, icon, to, onClick, tone, hidden }] */
export function RowMenu({ items, label = 'More actions' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  const visible = items.filter((i) => i && !i.hidden);
  if (!visible.length) return null;
  return (
    <div className="relative" ref={ref} onClick={(e) => { e.stopPropagation(); }}>
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }} className="rounded-lg p-2 text-faint hover:bg-subtle hover:text-ink">
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 min-w-44 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop animate-fade-in">
          {visible.map((it) => {
            const cls = cn('flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-subtle [&_svg]:size-4', it.tone === 'danger' ? 'text-danger' : 'text-ink');
            const body = <>{it.icon && <it.icon />}{it.label}</>;
            return it.to ? (
              <Link key={it.label} role="menuitem" to={it.to} className={cls} onClick={() => setOpen(false)}>{body}</Link>
            ) : it.href ? (
              <a key={it.label} role="menuitem" href={it.href} target="_blank" rel="noopener noreferrer" className={cls} onClick={() => setOpen(false)}>{body}</a>
            ) : (
              <button key={it.label} role="menuitem" type="button" className={cls} onClick={(e) => { e.preventDefault(); setOpen(false); it.onClick(); }}>{body}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Thumbnail with a neutral fallback. */
export function Thumb({ src, alt = '', icon: Icon, className }) {
  const [broken, setBroken] = useState(false);
  return src && !broken ? (
    <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} className={cn('size-11 shrink-0 rounded-lg object-cover', className)} />
  ) : (
    <span className={cn('grid size-11 shrink-0 place-items-center rounded-lg bg-subtle text-faint', className)}>{Icon && <Icon className="size-5" />}</span>
  );
}
