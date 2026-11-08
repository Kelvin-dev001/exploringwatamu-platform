import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Inbox, Search, ChevronRight, Users, CalendarDays, Layers } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { ago, cn, dateRange, kes } from '@/lib/utils';
import { Alert, Button, Card, ContactActions, Empty, Input, PageHeader, Skeleton, StatusBadge } from '@/ui';

const TABS = [
  { id: 'new', label: 'New' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'declined', label: 'Declined' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: '', label: 'All' },
];
const itemCount = (r) => (r.days || []).reduce((n, d) => n + (d.items || []).length, 0) + (r.ideas || []).length;

export default function TripRequests() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'new';
  const [q, setQ] = useState(params.get('q') || '');
  const page = Number(params.get('page') || 1);
  const [state, setState] = useState({ rows: [], counts: {}, total: 0, totalPages: 1, loading: true, error: '' });

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === '' || v === null || v === undefined ? next.delete(k) : next.set(k, v)));
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await api.get('/trip-requests', { params: { status: status || undefined, q: params.get('q') || undefined, page, limit: 20 } });
      setState({ rows: res.data.data || [], counts: res.data.counts || {}, total: res.data.total || 0, totalPages: res.data.totalPages || 1, loading: false, error: '' });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: errorMessage(err, 'Couldn’t load trip requests.') }));
    }
  }, [status, params, page]);

  useEffect(() => {
    document.title = 'Trip requests · Admin';
    load();
  }, [load]);

  const allCount = Object.values(state.counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader title="Trip requests" description="Itineraries built on the website. Price them and the traveller gets the quote by email." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Status">
          {TABS.map((t) => {
            const n = t.id ? state.counts[t.id] || 0 : allCount;
            const active = status === t.id;
            return (
              <button key={t.id || 'all'} role="tab" aria-selected={active} type="button" onClick={() => set({ status: t.id })}
                className={cn('flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium', active ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-muted hover:text-ink')}>
                {t.label}
                <span className={cn('rounded-full px-1.5 text-xs', active ? 'bg-canvas/20' : 'bg-subtle')}>{n}</span>
              </button>
            );
          })}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); set({ q: q.trim() }); }} className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Reference, name or email" className="h-10 pl-9" type="search" aria-label="Search trip requests" />
        </form>
      </div>

      {state.error && <Alert className="mb-4">{state.error} <button type="button" className="font-semibold underline" onClick={load}>Retry</button></Alert>}

      <Card className="overflow-hidden">
        {state.loading && !state.rows.length ? (
          <div className="space-y-3 p-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : state.rows.length === 0 ? (
          <Empty icon={Inbox} title={params.get('q') ? 'No requests match your search' : status === 'new' ? 'No new requests — you’re all caught up' : 'Nothing here yet'}>
            New requests appear here when travellers send a trip from the website planner.
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {state.rows.map((r) => (
              <li key={r._id}>
                <Link to={`/trip-requests/${r._id}`} className="flex items-start gap-3 px-4 py-3.5 hover:bg-subtle sm:items-center sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate font-semibold text-ink">{r.contact?.name}</p>
                      <span className="font-mono text-xs text-faint">{r.reference}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
                      <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" />{dateRange(r.arrival, r.departure)}</span>
                      <span className="inline-flex items-center gap-1"><Users className="size-3" />{r.adults + (r.children || 0)}</span>
                      <span className="inline-flex items-center gap-1"><Layers className="size-3" />{itemCount(r)} items</span>
                      {r.quote?.total != null && <span className="font-semibold text-ink">{kes(r.quote.total)}</span>}
                      <span>{ago(r.createdAt)}</span>
                    </p>
                  </div>
                  <ContactActions compact phone={r.contact?.phone} email={r.contact?.email} name={r.contact?.name} context={`trip request ${r.reference}`} className="hidden md:flex" />
                  <ChevronRight className="mt-1 size-4 shrink-0 text-faint sm:mt-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {state.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>Page {page} of {state.totalPages} · {state.total} requests</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => set({ page: page - 1 })}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= state.totalPages} onClick={() => set({ page: page + 1 })}>Next</Button>
          </div>
        </div>
      )}
    </>
  );
}
