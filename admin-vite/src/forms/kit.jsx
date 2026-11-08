import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, Button, Card, Confirm, Input, Skeleton } from '@/ui';

/* ---------- State ---------- */

/** Form state with nested set('a.b.c', v) and a dirty flag. */
export function useForm(initial) {
  const [form, setFormRaw] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const set = useCallback((path, value) => {
    setDirty(true);
    setFormRaw((f) => {
      const keys = path.split('.');
      const next = { ...f };
      let cur = next;
      keys.slice(0, -1).forEach((k) => { cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] || {}) }; cur = cur[k]; });
      cur[keys[keys.length - 1]] = typeof value === 'function' ? value(cur[keys[keys.length - 1]]) : value;
      return next;
    });
  }, []);
  const reset = useCallback((value) => { setFormRaw(value); setDirty(false); }, []);
  const touch = useCallback(() => setDirty(true), []);
  return { form, set, reset, dirty, touch, setClean: () => setDirty(false) };
}

/** Field-level errors from an API error: zod issues ({ path, message }) or an upload error naming a field. */
export function apiFieldErrors(err) {
  const d = err?.response?.data || {};
  const out = {};
  (d.issues || []).forEach((i) => { if (i.path && !out[i.path]) out[i.path] = i.message; });
  if (d.field) out[d.field] = d.error;
  return out;
}

/* ---------- Layout ---------- */

/** Page frame for add/edit forms with a save bar that sticks to the bottom. */
export function FormPage({ title, subtitle, back, backLabel, loading, error, children, onSubmit, saving, dirty, submitLabel = 'Save', side, aside }) {
  const navigate = useNavigate();
  // Warn before leaving with unsaved changes (in-app navigation and tab close).
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saving && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} noValidate className="pb-32 lg:pb-24">
      <Link to={back} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"><ArrowLeft className="size-4" />{backLabel}</Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.7rem]">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {side}
      </div>
      {loading ? (
        <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-64" /></div>
      ) : (
        <div className={cn('grid gap-6', aside && 'lg:grid-cols-[1fr_20rem]')}>
          <div className="min-w-0 space-y-6">{children}</div>
          {aside && <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">{aside}</div>}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          {error ? <p className="min-w-0 flex-1 truncate text-sm font-medium text-danger" role="alert">{error}</p> : <p className="hidden flex-1 text-sm text-faint sm:block">{dirty ? 'Unsaved changes' : 'All changes saved'}</p>}
          <Button variant="secondary" onClick={() => navigate(back)} className="ml-auto">Cancel</Button>
          <Button type="submit" loading={saving} className="min-w-28">{submitLabel}</Button>
        </div>
      </div>

      <Confirm open={blocker.state === 'blocked'} onOpenChange={(o) => !o && blocker.reset?.()} title="Leave without saving?" confirmLabel="Leave" tone="danger" onConfirm={() => blocker.proceed?.()}>
        Your changes on this page will be lost.
      </Confirm>
    </form>
  );
}

export function Section({ title, description, children, className, action }) {
  return (
    <Card className={cn('p-4 sm:p-6', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export const Grid = ({ cols = 2, children }) => <div className={cn('grid gap-4', cols === 2 && 'sm:grid-cols-2', cols === 3 && 'sm:grid-cols-3', cols === 4 && 'grid-cols-2 sm:grid-cols-4')}>{children}</div>;

/** Text input with a KES prefix for money. */
export function MoneyInput({ value, onChange, ...p }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint">KES</span>
      <Input inputMode="decimal" value={value ?? ''} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))} className="pl-12 tabular-nums" {...p} />
    </div>
  );
}

/* ---------- Lists of strings (chips) ---------- */

export function ListInput({ value = [], onChange, placeholder = 'Type and press Enter', suggestions = [] }) {
  const [draft, setDraft] = useState('');
  const add = (v) => {
    const t = (v ?? draft).trim();
    if (!t || value.includes(t)) return setDraft('');
    onChange([...value, t]);
    setDraft('');
  };
  const unused = suggestions.filter((s) => !value.includes(s));
  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {value.map((v, i) => (
            <li key={`${v}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-subtle py-1 pl-3 pr-1 text-sm text-ink">
              {v}
              <button type="button" onClick={() => onChange(value.filter((_, n) => n !== i))} className="rounded-full p-0.5 text-faint hover:bg-line hover:text-ink" aria-label={`Remove ${v}`}><X className="size-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <Button variant="secondary" size="icon" onClick={() => add()} aria-label="Add" disabled={!draft.trim()}><Plus /></Button>
      </div>
      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unused.slice(0, 8).map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-dashed border-line px-2.5 py-0.5 text-xs text-muted hover:border-brand hover:text-brand">+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Repeating groups of fields (room types, FAQs, itinerary days). */
export function Repeater({ items, onChange, render, empty, addLabel, make, numbered }) {
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.length === 0 && empty && <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-faint">{empty}</p>}
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-line bg-canvas/60 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-faint">{numbered ? `${numbered} ${i + 1}` : `#${i + 1}`}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ChevronUp /></Button>
              <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><ChevronDown /></Button>
              <Button variant="danger-ghost" size="icon-sm" onClick={() => onChange(items.filter((_, n) => n !== i))} aria-label="Remove"><Trash2 /></Button>
            </div>
          </div>
          {render(item, (patch) => onChange(items.map((x, n) => (n === i ? { ...x, ...patch } : x))), i)}
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={() => onChange([...items, make()])}><Plus />{addLabel}</Button>
    </div>
  );
}

/* ---------- Chips (single / multi select) ---------- */

export function ChipGroup({ options, value, onChange, multiple, max, label }) {
  const selected = multiple ? value || [] : [value];
  const toggle = (id) => {
    if (!multiple) return onChange(value === id ? '' : id);
    if (selected.includes(id)) return onChange(selected.filter((x) => x !== id));
    if (max && selected.length >= max) return undefined;
    return onChange([...selected, id]);
  };
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button key={o.id} type="button" aria-pressed={on} onClick={() => toggle(o.id)}
            className={cn('rounded-full border px-3 py-1.5 text-sm font-medium transition-colors', on ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted hover:text-ink', !on && multiple && max && selected.length >= max && 'opacity-50')}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Summary of client-side problems shown above the form. */
export function Problems({ errors }) {
  const list = Object.values(errors || {}).filter(Boolean);
  if (!list.length) return null;
  return <Alert title="Please fix these before saving">{list.length === 1 ? list[0] : <ul className="list-disc pl-4">{list.map((m) => <li key={m}>{m}</li>)}</ul>}</Alert>;
}

export function useFocusFirstError(errors) {
  const ref = useRef(null);
  useEffect(() => {
    if (Object.keys(errors || {}).length) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [errors]);
  return ref;
}
