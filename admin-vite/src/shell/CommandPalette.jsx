import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, Plus, Moon, Sun, CornerDownLeft } from 'lucide-react';
import { ALL_ITEMS } from './nav';
import { cn } from '@/lib/utils';

/** Ctrl/⌘+K quick jump: every screen plus "Add …" shortcuts. */
export default function CommandPalette({ open, onOpenChange, onToggleTheme, dark }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const listRef = useRef(null);

  const entries = useMemo(() => {
    const go = ALL_ITEMS.map((it) => ({ id: it.to, label: it.label, hint: it.group, icon: it.icon, run: () => navigate(it.to) }));
    const add = ALL_ITEMS.filter((it) => it.create).map((it) => ({ id: it.create, label: `Add ${it.label.toLowerCase().replace(/s$/, '')}`, hint: 'Create', icon: Plus, run: () => navigate(it.create) }));
    const theme = { id: 'theme', label: dark ? 'Switch to light mode' : 'Switch to dark mode', hint: 'Appearance', icon: dark ? Sun : Moon, run: onToggleTheme };
    const all = [...go, ...add, theme];
    const needle = q.trim().toLowerCase();
    return needle ? all.filter((e) => `${e.label} ${e.hint}`.toLowerCase().includes(needle)) : all;
  }, [q, navigate, onToggleTheme, dark]);

  useEffect(() => setI(0), [q, open]);
  useEffect(() => {
    if (!open) setQ('');
  }, [open]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [i]);

  const run = (e) => {
    onOpenChange(false);
    e?.run();
  };

  const onKey = (ev) => {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); setI((n) => Math.min(n + 1, entries.length - 1)); }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); setI((n) => Math.max(n - 1, 0)); }
    if (ev.key === 'Enter') { ev.preventDefault(); run(entries[i]); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-fade-in" />
        <Dialog.Content className="fixed inset-x-3 top-[12vh] z-50 mx-auto max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-slide-up focus:outline-none" onKeyDown={onKey}>
          <Dialog.Title className="sr-only">Go to</Dialog.Title>
          <Dialog.Description className="sr-only">Search screens and actions</Dialog.Description>
          <div className="flex items-center gap-2 border-b border-line px-4">
            <Search className="size-4 text-faint" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Go to… or add…"
              className="h-12 flex-1 bg-transparent text-[0.95rem] text-ink placeholder:text-faint focus:outline-none"
              aria-label="Search screens and actions"
              role="combobox"
              aria-expanded="true"
              aria-controls="ew-palette-list"
              aria-activedescendant={entries[i] ? `ew-p-${i}` : undefined}
            />
            <kbd className="hidden rounded border border-line px-1.5 text-xs text-faint sm:block">Esc</kbd>
          </div>
          <ul ref={listRef} id="ew-palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {entries.length === 0 && <li className="px-3 py-6 text-center text-sm text-faint">No matches</li>}
            {entries.map((e, n) => (
              <li key={e.id} id={`ew-p-${n}`} data-i={n} role="option" aria-selected={n === i}>
                <button
                  type="button"
                  onMouseEnter={() => setI(n)}
                  onClick={() => run(e)}
                  className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm', n === i ? 'bg-subtle text-ink' : 'text-muted')}
                >
                  <e.icon className="size-4 shrink-0" />
                  <span className="flex-1 font-medium text-ink">{e.label}</span>
                  <span className="text-xs text-faint">{e.hint}</span>
                  {n === i && <CornerDownLeft className="size-3.5 text-faint" />}
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
