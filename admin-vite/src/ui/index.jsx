import { createContext, forwardRef, useCallback, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertTriangle, CheckCircle2, Info, MessageCircle, Phone, Mail, Loader2 } from 'lucide-react';
import { cn, waNumber } from '@/lib/utils';

/* ---------------- Buttons ---------------- */

const BTN = {
  base: 'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  variant: {
    primary: 'bg-brand text-brand-ink hover:bg-brand/90',
    secondary: 'border border-line bg-surface text-ink hover:bg-subtle',
    ghost: 'text-muted hover:bg-subtle hover:text-ink',
    danger: 'bg-danger text-white hover:bg-danger/90 dark:text-canvas',
    'danger-ghost': 'text-danger hover:bg-danger-soft',
    success: 'bg-ok text-white hover:bg-ok/90 dark:text-canvas',
  },
  size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-5 text-base', icon: 'size-10', 'icon-sm': 'size-8' },
};

export const Button = forwardRef(function Button({ variant = 'primary', size = 'md', className, to, href, loading, children, ...props }, ref) {
  const cls = cn(BTN.base, BTN.variant[variant], BTN.size[size], className);
  const content = loading ? (<><Loader2 className="animate-spin" />{children}</>) : children;
  if (to) return <Link ref={ref} to={to} className={cls} {...props}>{content}</Link>;
  if (href) return <a ref={ref} href={href} className={cls} {...props}>{content}</a>;
  return <button ref={ref} type="button" className={cls} disabled={loading || props.disabled} {...props}>{content}</button>;
});

/* ---------------- Surfaces ---------------- */

export function Card({ className, children, ...props }) {
  return <section className={cn('rounded-xl2 border border-line bg-surface shadow-card', className)} {...props}>{children}</section>;
}

export function CardHeader({ title, description, action, icon: Icon, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && <Icon className="size-4 shrink-0 text-faint" />}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
          {description && <p className="text-xs text-faint">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions, back }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.7rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ---------------- Status ---------------- */

const TONES = {
  neutral: 'bg-subtle text-muted',
  brand: 'bg-brand-soft text-brand',
  accent: 'bg-accent-soft text-accent',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

export function Badge({ tone = 'neutral', className, children, dot }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold [&_svg]:size-3', TONES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export const STATUS = {
  new: { label: 'New', tone: 'warn' },
  pending: { label: 'Pending', tone: 'warn' },
  quoted: { label: 'Quoted', tone: 'info' },
  accepted: { label: 'Accepted', tone: 'ok' },
  confirmed: { label: 'Confirmed', tone: 'ok' },
  booked: { label: 'Booked', tone: 'info' },
  declined: { label: 'Declined', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  draft: { label: 'Draft', tone: 'neutral' },
  published: { label: 'Published', tone: 'ok' },
  full: { label: 'Full', tone: 'accent' },
  closed: { label: 'Closed', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'danger' },
  sent: { label: 'Sent', tone: 'ok' },
  skipped: { label: 'Skipped', tone: 'neutral' },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, tone: 'neutral' };
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

/* ---------------- Forms ---------------- */

const control = 'w-full rounded-lg border border-line bg-surface px-3 text-[0.95rem] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60';

export const Input = forwardRef(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(control, 'h-11', className)} {...p} />;
});
export const Textarea = forwardRef(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(control, 'py-2.5', className)} {...p} />;
});
export const Select = forwardRef(function Select({ className, children, ...p }, ref) {
  return <select ref={ref} className={cn(control, 'h-11 pr-8', className)} {...p}>{children}</select>;
});

export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-danger">{error}</span> : hint ? <span className="mt-1 block text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

/* ---------------- Feedback ---------------- */

export function Alert({ tone = 'danger', title, children, className }) {
  const Icon = { danger: AlertTriangle, warn: AlertTriangle, ok: CheckCircle2, info: Info }[tone] || Info;
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-xl border p-3 text-sm', TONES[tone], 'border-current/20', className)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{title && <p className="font-semibold">{title}</p>}{children}</div>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-subtle', className)} />;
}

export function Empty({ icon: Icon, title, children, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-4 py-10 text-center', className)}>
      {Icon && <span className="mb-3 grid size-10 place-items-center rounded-full bg-subtle text-faint"><Icon className="size-5" /></span>}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {children && <p className="mt-1 max-w-xs text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------------- Sheet / dialog ---------------- */

/** Bottom sheet on phones, right-hand panel on desktop. */
export function Sheet({ open, onOpenChange, title, description, children, footer, wide }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed z-50 flex flex-col bg-surface shadow-pop focus:outline-none',
            'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl animate-slide-up',
            'sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:rounded-none sm:animate-slide-in',
            wide ? 'sm:w-[34rem]' : 'sm:w-[26rem]'
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
              <Dialog.Description className={description ? 'mt-0.5 text-sm text-muted' : 'sr-only'}>{description || title}</Dialog.Description>
            </div>
            <Dialog.Close className="-mr-2 rounded-lg p-2 text-faint hover:bg-subtle hover:text-ink" aria-label="Close"><X className="size-4" /></Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Promise-free confirm dialog: <Confirm open title body confirmLabel tone onConfirm onOpenChange /> */
export function Confirm({ open, onOpenChange, title, children, confirmLabel = 'Confirm', tone = 'primary', onConfirm, loading }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-fade-in" />
        <Dialog.Content className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl bg-surface p-5 shadow-pop animate-slide-up focus:outline-none sm:inset-x-0 sm:bottom-auto sm:top-[30%]">
          <Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
          <Dialog.Description asChild><div className="mt-2 text-sm text-muted">{children}</div></Dialog.Description>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------------- Toasts ---------------- */

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

const TOAST_TONES = {
  ok: 'bg-ink text-canvas',
  warn: 'border border-warn/30 bg-warn-soft text-warn', // something the team must act on — stays up longer
  danger: 'bg-danger text-white',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'warn' ? 9000 : 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cn('pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-pop animate-slide-up', TOAST_TONES[t.tone] || TOAST_TONES.ok)}>
            {t.tone === 'ok' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Contact ---------------- */

/** One-tap WhatsApp / call / email. `compact` renders icon buttons for list rows. */
export function ContactActions({ phone, email, name, context, compact, className }) {
  const wa = waNumber(phone);
  const greeting = encodeURIComponent(`Hi ${name ? name.split(' ')[0] : ''}, this is Exploring Watamu${context ? ` about ${context}` : ''}. `);
  const items = [
    wa && { href: `https://wa.me/${wa}?text=${greeting}`, label: 'WhatsApp', icon: MessageCircle, ext: true, cls: 'text-[#128c4b] dark:text-[#4ade80]' },
    phone && { href: `tel:${String(phone).replace(/\s/g, '')}`, label: 'Call', icon: Phone },
    email && { href: `mailto:${email}${context ? `?subject=${encodeURIComponent(`Your Exploring Watamu ${context}`)}` : ''}`, label: 'Email', icon: Mail },
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div className={cn('flex gap-2', className)}>
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target={it.ext ? '_blank' : undefined}
          rel={it.ext ? 'noopener noreferrer' : undefined}
          onClick={(e) => e.stopPropagation()}
          aria-label={`${it.label}${name ? ` ${name}` : ''}`}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface font-semibold text-ink hover:bg-subtle [&_svg]:size-4',
            compact ? 'size-9' : 'h-10 flex-1 px-3 text-sm',
            it.cls
          )}
        >
          <it.icon />
          {!compact && <span className="text-ink">{it.label}</span>}
        </a>
      ))}
    </div>
  );
}

/** Action bar pinned to the bottom on phones, inline on desktop. */
export function StickyActions({ children, className }) {
  return (
    <div className={cn('fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none', className)}>
      <div className="flex gap-2 [&>*]:flex-1 lg:[&>*]:flex-none">{children}</div>
    </div>
  );
}
