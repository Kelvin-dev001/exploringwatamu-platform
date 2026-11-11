import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeCheck, CheckCircle2, ChevronRight, EyeOff, Image as ImageIcon, MessageSquareQuote, RotateCcw, Search, Star } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { ago, cn, date } from '@/lib/utils';
import { cloudinaryUrl } from '@/lib/images';
import { Alert, Badge, Button, Card, Empty, Field, Input, PageHeader, Sheet, Skeleton, StatusBadge, Textarea, useToast } from '@/ui';

/*
 * Review moderation. Nothing a traveller writes is public until it is approved
 * here; hidden reviews are kept but never shown. Only approved reviews count
 * towards a listing's rating (the API recomputes it after every change).
 */

const TABS = [
  { id: 'pending', label: 'Waiting' },
  { id: 'approved', label: 'Approved' },
  { id: 'hidden', label: 'Hidden' },
  { id: '', label: 'All' },
];
const TYPE = { tour: 'Experience', group: 'Group trip', stay: 'Stay', transfer: 'Transfer', carhire: 'Car hire', service: 'Service' };
const EDIT_PATH = { tour: '/tours', group: '/grouptrips', stay: '/hotels', transfer: '/transfers', carhire: '/carhire', service: '/services' };

function Stars({ value, className }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true" className={cn('size-3.5', n <= value ? 'fill-amber-400 text-amber-400' : 'fill-subtle text-line')} />
      ))}
    </span>
  );
}

function Provenance({ review }) {
  if (review.booking?.type === 'legacy') return <Badge>Imported, not verified</Badge>;
  return (
    <Badge tone="ok">
      <BadgeCheck className="size-3" /> Verified booking
    </Badge>
  );
}

function BookingLink({ review, details }) {
  if (review.booking?.type === 'tripRequest') {
    return details?.id ? (
      <Link to={`/trip-requests/${details.id}`} className="font-mono font-semibold text-brand underline">{details.reference || review.booking.reference}</Link>
    ) : (
      <span className="font-mono">{review.booking.reference || 'Trip request'}</span>
    );
  }
  if (review.booking?.type === 'groupBooking') {
    return details?.trip?._id ? (
      <Link to={`/grouptripbookings/${details.trip._id}`} className="font-semibold text-brand underline">Group booking · {details.trip.title}</Link>
    ) : (
      <span>Group booking</span>
    );
  }
  return <span className="text-faint">None (imported from the old stay reviews)</span>;
}

/** Full review, moderation buttons and the reply editor. */
function ReviewDetail({ id, onChanged }) {
  const toast = useToast();
  const [r, setR] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    let alive = true;
    api.get(`/reviews/admin/${id}`)
      .then((res) => {
        if (!alive) return;
        setR(res.data);
        setReply(res.data.reply?.text || '');
      })
      .catch((err) => alive && setError(errorMessage(err, 'Couldn’t load this review.')));
    return () => {
      alive = false;
    };
  }, [id]);

  const moderate = async (status) => {
    setBusy(status);
    try {
      const res = await api.put(`/reviews/admin/${id}/status`, { status, note: note.trim() || undefined });
      setR((prev) => ({ ...prev, ...res.data.review }));
      const { average, count } = res.data.listingStats || {};
      toast(status === 'approved' ? `Approved — it’s on the website. Rating now ${count ? `${average} from ${count}` : 'empty'}.` : status === 'hidden' ? 'Hidden — it isn’t shown and doesn’t count.' : 'Moved back to waiting.');
      setNote('');
      onChanged();
    } catch (err) {
      toast(errorMessage(err), 'danger');
    }
    setBusy('');
  };

  const saveReply = async (text) => {
    setBusy('reply');
    try {
      const res = await api.put(`/reviews/admin/${id}/reply`, { text });
      setR((prev) => ({ ...prev, reply: res.data.review.reply }));
      setReply(res.data.review.reply?.text || '');
      toast(text ? (r.reply?.text ? 'Reply updated' : 'Reply saved') : 'Reply removed');
      onChanged();
    } catch (err) {
      toast(errorMessage(err), 'danger');
    }
    setBusy('');
  };

  if (error) return <Alert>{error}</Alert>;
  if (!r) return <div className="space-y-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-24" /><Skeleton className="h-10" /></div>;

  const traveller = r.user ? `${r.user.name} · ${r.user.email}` : r.bookingDetails?.contact ? `${r.bookingDetails.contact.name} · ${r.bookingDetails.contact.email}` : 'Unknown (imported)';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={r.status} />
        <Provenance review={r} />
      </div>

      <div>
        <Stars value={r.rating} />
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{r.text}</p>
        {r.photos?.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {r.photos.map((src, i) => (
              <li key={src}>
                <a href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open photo ${i + 1}`}>
                  <img src={cloudinaryUrl(src, 320)} alt={`Photo ${i + 1}`} className="size-20 rounded-lg object-cover" loading="lazy" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-faint">{TYPE[r.listingType]}</dt><dd className="font-medium text-ink">{EDIT_PATH[r.listingType] ? <Link to={`${EDIT_PATH[r.listingType]}/${r.listingId}`} className="underline">{r.listingTitle || 'Open listing'}</Link> : r.listingTitle}</dd></div>
        <div><dt className="text-xs text-faint">Shown as</dt><dd className="font-medium text-ink">{r.displayName}</dd></div>
        <div><dt className="text-xs text-faint">Traveller</dt><dd className="break-words font-medium text-ink">{traveller}</dd></div>
        <div><dt className="text-xs text-faint">Booking</dt><dd className="font-medium text-ink"><BookingLink review={r} details={r.bookingDetails} /></dd></div>
        <div><dt className="text-xs text-faint">Submitted</dt><dd className="font-medium text-ink">{date(r.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div>
        {r.moderation?.at && (
          <div><dt className="text-xs text-faint">Last moderated</dt><dd className="font-medium text-ink">{ago(r.moderation.at)} by {r.moderation.by}{r.moderation.note ? ` — “${r.moderation.note}”` : ''}</dd></div>
        )}
      </dl>

      <Card className="space-y-3 p-4">
        <Field label="Note (optional, only your team sees it)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="e.g. Checked with the guide" />
        </Field>
        <div className="flex flex-wrap gap-2">
          {r.status !== 'approved' && <Button variant="success" loading={busy === 'approved'} disabled={!!busy} onClick={() => moderate('approved')}><CheckCircle2 />Approve</Button>}
          {r.status !== 'hidden' && <Button variant="secondary" loading={busy === 'hidden'} disabled={!!busy} onClick={() => moderate('hidden')}><EyeOff />Hide</Button>}
          {r.status !== 'pending' && <Button variant="ghost" loading={busy === 'pending'} disabled={!!busy} onClick={() => moderate('pending')}><RotateCcw />Back to waiting</Button>}
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink"><MessageSquareQuote className="size-4 text-faint" />Reply from Exploring Watamu</p>
        <p className="text-xs text-faint">Shown under the review on the website once it is approved.</p>
        <Textarea rows={4} value={reply} maxLength={1500} onChange={(e) => setReply(e.target.value)} aria-label="Reply" placeholder="Asante for your review…" />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={!!busy || !reply.trim() || reply.trim() === (r.reply?.text || '')} loading={busy === 'reply'} onClick={() => saveReply(reply.trim())}>{r.reply?.text ? 'Update reply' : 'Save reply'}</Button>
          {r.reply?.text && <Button size="sm" variant="danger-ghost" disabled={!!busy} onClick={() => saveReply('')}>Remove reply</Button>}
        </div>
        {r.reply?.updatedAt && <p className="text-xs text-faint">Last edited {ago(r.reply.updatedAt)} by {r.reply.by}</p>}
      </Card>
    </div>
  );
}

export default function Reviews() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'pending';
  const page = Number(params.get('page') || 1);
  const [q, setQ] = useState(params.get('q') || '');
  const [open, setOpen] = useState(null);
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
      const res = await api.get('/reviews/admin', { params: { status: status || undefined, q: params.get('q') || undefined, page, limit: 20 } });
      setState({ rows: res.data.data || [], counts: res.data.counts || {}, total: res.data.total || 0, totalPages: res.data.totalPages || 1, loading: false, error: '' });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: errorMessage(err, 'Couldn’t load reviews.') }));
    }
  }, [status, params, page]);

  useEffect(() => {
    document.title = 'Reviews · Admin';
    load();
  }, [load]);

  const allCount = Object.values(state.counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader title="Reviews" description="Travellers review what they booked once the trip is over. Nothing is public until you approve it." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Status">
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
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Listing, name, words, EW-…" className="h-10 pl-9" type="search" aria-label="Search reviews" />
        </form>
      </div>

      {state.error && <Alert className="mb-4">{state.error} <button type="button" className="font-semibold underline" onClick={load}>Retry</button></Alert>}

      <Card className="overflow-hidden">
        {state.loading && !state.rows.length ? (
          <div className="space-y-3 p-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : state.rows.length === 0 ? (
          <Empty icon={Star} title={params.get('q') ? 'No reviews match your search' : status === 'pending' ? 'Nothing waiting — you’re all caught up' : 'Nothing here yet'}>
            Travellers can review what they booked once their trip has ended. New reviews wait here for you.
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {state.rows.map((r) => (
              <li key={r._id}>
                <button type="button" onClick={() => setOpen(r._id)} className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-subtle sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Stars value={r.rating} />
                      <p className="truncate font-semibold text-ink">{r.listingTitle}</p>
                      <Badge>{TYPE[r.listingType]}</Badge>
                      {status === '' && <StatusBadge status={r.status} />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{r.text}</p>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-faint">
                      <span>{r.displayName}</span>
                      {r.booking?.reference && <span className="font-mono">{r.booking.reference}</span>}
                      {r.booking?.type === 'legacy' && <span>imported</span>}
                      {r.photos?.length > 0 && <span className="inline-flex items-center gap-1"><ImageIcon className="size-3" />{r.photos.length}</span>}
                      {r.reply?.text && <span className="inline-flex items-center gap-1"><MessageSquareQuote className="size-3" />replied</span>}
                      <span>{ago(r.createdAt)}</span>
                    </p>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-faint" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {state.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>Page {page} of {state.totalPages} · {state.total} reviews</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => set({ page: page - 1 })}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= state.totalPages} onClick={() => set({ page: page + 1 })}>Next</Button>
          </div>
        </div>
      )}

      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)} title="Review" description={state.rows.find((r) => r._id === open)?.listingTitle} wide>
        {open && <ReviewDetail id={open} onChanged={load} />}
      </Sheet>
    </>
  );
}
