import { Button } from '@/components/ui/button';

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-[var(--radius-card)] border border-sand-200 bg-white p-2.5">
          <div className="aspect-[4/3] animate-pulse rounded-[1rem] bg-sand-100" />
          <div className="space-y-3 p-3">
            <div className="h-3 w-1/3 animate-pulse rounded bg-sand-100" />
            <div className="h-6 w-4/5 animate-pulse rounded bg-sand-100" />
            <div className="h-3 w-full animate-pulse rounded bg-sand-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ what = 'this page', onRetry }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-10 text-center">
      <p className="font-display text-2xl text-ocean-900">We couldn’t load {what}</p>
      <p className="mt-2 text-ocean-900/60">Check your connection and try again.</p>
      {onRetry && (
        <Button className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, text, children }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-sand-300 bg-sand-100/60 p-10 text-center">
      <p className="font-display text-2xl text-ocean-900">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-ocean-900/60">{text}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
