import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox, Users, CalendarClock, RefreshCw, Plus, Send, CheckCircle2, Wallet, TrendingUp, Tag, ImageOff, FileEdit,
  Flame, Activity, MailWarning, ChevronRight, Building2, ArrowUpRight,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { ago, cn, date, dateRange, kes, kesShort } from '@/lib/utils';
import { Alert, Badge, Button, Card, CardHeader, Confirm, ContactActions, Empty, PageHeader, Skeleton, StatusBadge, useToast } from '@/ui';

function greeting() {
  const h = Number(new Date().toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Africa/Nairobi' }));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function Stat({ icon: Icon, label, value, sub, tone = 'brand', to }) {
  const body = (
    <Card className={cn('h-full p-4 transition-colors', to && 'hover:border-brand/40')}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className={cn('grid size-7 place-items-center rounded-lg', { brand: 'bg-brand-soft text-brand', accent: 'bg-accent-soft text-accent', ok: 'bg-ok-soft text-ok', info: 'bg-info-soft text-info' }[tone])}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-faint">{sub}</p>}
    </Card>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

function Row({ to, children, className }) {
  const cls = cn('flex items-center gap-3 px-4 py-3 sm:px-5', to && 'hover:bg-subtle', className);
  return to ? <Link to={to} className={cls}>{children}</Link> : <div className={cls}>{children}</div>;
}

function Section({ title, count, icon: Icon, children, more }) {
  return (
    <div>
      <div className="flex items-center justify-between bg-subtle/60 px-4 py-2 sm:px-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-faint"><Icon className="size-3.5" />{title}</p>
        {count > 0 ? <Badge tone="accent">{count}</Badge> : <Badge>0</Badge>}
      </div>
      <div className="divide-y divide-line">{children}</div>
      {more}
    </div>
  );
}

function HealthItem({ icon: Icon, label, count, hint, to, tone = 'warn' }) {
  const done = !count;
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 hover:bg-subtle sm:px-5">
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', done ? 'bg-ok-soft text-ok' : tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn')}>
        {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block truncate text-xs text-faint">{done ? 'All good' : hint}</span>
      </span>
      {!done && <span className="text-sm font-bold text-ink">{count}</span>}
      <ChevronRight className="size-4 text-faint" />
    </Link>
  );
}

export default function Dashboard() {
  const { admin } = useAdminAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null); // { kind: 'confirm'|'cancel', booking }
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/overview');
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t load the dashboard.'));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = 'Dashboard · Admin';
    load();
  }, [load]);

  const runBookingAction = async () => {
    setBusy(true);
    try {
      if (action.kind === 'confirm') await api.post('/group-bookings/confirm', { bookingId: action.booking.id });
      else await api.put(`/group-bookings/admin/${action.booking.id}/cancel`);
      toast(action.kind === 'confirm' ? `Confirmed ${action.booking.name}. Receipt emailed.` : `Cancelled ${action.booking.name}’s request.`);
      setAction(null);
      load();
    } catch (err) {
      toast(errorMessage(err), 'danger');
    }
    setBusy(false);
  };

  const todo = data?.todo;
  const money = data?.money;
  const content = data?.content;
  const activity = data?.activity;
  const todoTotal = todo ? todo.tripRequests.count + todo.groupBookings.count + todo.viewings.count : 0;
  const first = (admin?.name || '').split(' ')[0];

  return (
    <>
      <PageHeader
        title={`${greeting()}${first ? `, ${first}` : ''}`}
        description={loading ? 'Loading today’s overview…' : todoTotal ? `${todoTotal} thing${todoTotal === 1 ? '' : 's'} need${todoTotal === 1 ? 's' : ''} your attention.` : 'You’re all caught up.'}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={load} disabled={loading} aria-label="Refresh"><RefreshCw className={cn(loading && 'animate-spin')} /><span className="hidden sm:inline">{data ? `Updated ${ago(data.generatedAt)}` : 'Refresh'}</span></Button>
            <Button variant="secondary" size="sm" to="/grouptrips/new" className="hidden sm:inline-flex"><Plus />Group trip</Button>
            <Button size="sm" to="/tours/new"><Plus />Experience</Button>
          </>
        }
      />

      {error && <Alert tone="danger" className="mb-6" title="Dashboard unavailable">{error} <button type="button" onClick={load} className="font-semibold underline">Try again</button></Alert>}

      {/* Money & pipeline */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading && !data ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[6.5rem] rounded-xl2" />)
        ) : money ? (
          <>
            <Stat icon={Inbox} label="Needs pricing" value={todo.tripRequests.count} sub="new trip requests" tone="accent" to="/trip-requests" />
            <Stat icon={Send} label="Quotes this month" value={kesShort(money.quotesSent.value)} sub={`${money.quotesSent.count} sent`} tone="info" />
            <Stat icon={TrendingUp} label="Accepted this month" value={kesShort(money.quotesAccepted.value)} sub={money.conversion !== null ? `${money.quotesAccepted.count} won · ${money.conversion}% win rate` : `${money.quotesAccepted.count} won`} tone="ok" />
            <Stat icon={Wallet} label="Open pipeline" value={kesShort(money.openPipeline.value)} sub={`${money.openPipeline.count} quote${money.openPipeline.count === 1 ? '' : 's'} awaiting reply`} />
          </>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* To do */}
        <Card>
          <CardHeader icon={Inbox} title="To do" description="Oldest first — reply fast, win more trips" />
          {loading && !data ? (
            <div className="space-y-3 p-5">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : todo ? (
            <>
              <Section title="Trip requests to price" count={todo.tripRequests.count} icon={Inbox}
                more={todo.tripRequests.count > todo.tripRequests.items.length && <Link to="/trip-requests" className="block px-5 py-2 text-xs font-semibold text-brand">See all {todo.tripRequests.count}</Link>}>
                {todo.tripRequests.items.length === 0 ? <Empty title="No new requests" /> : todo.tripRequests.items.map((r) => (
                  <Row key={r.id} to={`/trip-requests/${r.id}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{r.name} <span className="font-mono text-xs font-normal text-faint">{r.reference}</span></p>
                      <p className="truncate text-xs text-muted">{dateRange(r.arrival, r.departure)} · {r.travellers} travellers · {r.items} items · {ago(r.createdAt)}</p>
                    </div>
                    <ContactActions compact phone={r.phone} email={r.email} name={r.name} context={`trip request ${r.reference}`} className="hidden sm:flex" />
                    <ChevronRight className="size-4 shrink-0 text-faint" />
                  </Row>
                ))}
              </Section>

              <Section title="Group bookings to confirm" count={todo.groupBookings.count} icon={Users}>
                {todo.groupBookings.items.length === 0 ? <Empty title="Nothing pending" /> : todo.groupBookings.items.map((b) => (
                  <div key={b.id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{b.name}</p>
                        <p className="truncate text-xs text-muted">
                          <Link to={b.tripId ? `/grouptripbookings/${b.tripId}` : '/grouptrips'} className="hover:underline">{b.trip || 'Group trip'}</Link>
                          {b.startDate ? ` · ${date(b.startDate)}` : ''} · {b.paymentType} {kes(b.amount)} · {ago(b.createdAt)}
                        </p>
                      </div>
                      <ContactActions compact phone={b.phone} email={b.email} name={b.name} context={b.trip ? `your ${b.trip} booking` : 'your booking'} />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="success" className="flex-1 sm:flex-none" onClick={() => setAction({ kind: 'confirm', booking: b })}><CheckCircle2 />Confirm</Button>
                      <Button size="sm" variant="danger-ghost" onClick={() => setAction({ kind: 'cancel', booking: b })}>Cancel</Button>
                    </div>
                  </div>
                ))}
              </Section>

              <Section title="Property viewings · next 14 days" count={todo.viewings.count} icon={CalendarClock}>
                {todo.viewings.items.length === 0 ? <Empty title="No viewings booked" /> : todo.viewings.items.map((v) => (
                  <Row key={v.id}>
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-subtle text-center leading-none">
                      <span><span className="block text-sm font-bold text-ink">{new Date(v.date).getDate()}</span><span className="text-[0.65rem] uppercase text-faint">{date(v.date, { month: 'short' })}</span></span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{v.name} · {v.time}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted"><Building2 className="size-3" />{v.property || 'Property'}</p>
                    </div>
                    <ContactActions compact phone={/\d{7,}/.test(v.contact || '') ? v.contact : null} email={/@/.test(v.contact || '') ? v.contact : null} name={v.name} context="your property viewing" />
                  </Row>
                ))}
              </Section>
            </>
          ) : null}
        </Card>

        <div className="space-y-6">
          {/* Content health */}
          <Card>
            <CardHeader icon={Flame} title="Content health" description="Fix these to rank better on the website" />
            {content ? (
              <div className="divide-y divide-line">
                <HealthItem icon={Tag} label="Experiences without vibe tags" count={content.untaggedTours.count} hint={content.untaggedTours.items.map((t) => t.name).join(', ')} to={content.untaggedTours.items[0] ? `/tours/${content.untaggedTours.items[0].id}` : '/tours'} />
                <HealthItem icon={ImageOff} label="Experiences without photos" count={content.toursWithoutPhotos.count} hint={content.toursWithoutPhotos.items.map((t) => t.name).join(', ')} to={content.toursWithoutPhotos.items[0] ? `/tours/${content.toursWithoutPhotos.items[0].id}` : '/tours'} />
                <HealthItem icon={FileEdit} label="Group trips still in draft" count={content.draftTrips.count} hint={content.draftTrips.items.map((t) => t.title).join(', ')} to="/grouptrips" />
                <HealthItem icon={Tag} label="Group trips without vibe tags" count={content.untaggedTrips.count} hint="Untagged trips rank lower" to="/grouptrips" />
                {content.nearlyFull.map((t) => (
                  <Link key={t.id} to={`/grouptripbookings/${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-subtle sm:px-5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent"><Users className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{t.title}</span>
                      <span className="block text-xs text-faint">{date(t.startDate)} · {t.filled}/{t.capacity} seats {t.full ? '· full' : '· nearly full'}</span>
                    </span>
                    <ChevronRight className="size-4 text-faint" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-3 p-5">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
            )}
            {money && money.balancesDue.value > 0 && (
              <p className="border-t border-line px-5 py-3 text-xs text-muted">
                <Wallet className="mr-1 inline size-3.5" /> {kes(money.balancesDue.value)} in group-trip balances still to collect ({money.balancesDue.count} bookings).
              </p>
            )}
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader icon={Activity} title="Recent activity" action={<Button variant="ghost" size="sm" to="/bookings">All<ArrowUpRight /></Button>} />
            {activity?.failedNotifications.count > 0 && (
              <Link to="/notifications" className="flex items-center gap-3 border-b border-line bg-danger-soft/60 px-5 py-3 text-sm text-danger hover:bg-danger-soft">
                <MailWarning className="size-4 shrink-0" />
                <span className="flex-1"><b>{activity.failedNotifications.count}</b> email/SMS failed this week — check SMTP and SMS settings</span>
                <ChevronRight className="size-4" />
              </Link>
            )}
            {activity ? (
              activity.recent.length === 0 ? <Empty icon={Activity} title="No bookings yet" /> : (
                <ul className="divide-y divide-line">
                  {activity.recent.map((b) => (
                    <li key={`${b.type}-${b.id}`} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink"><span className="font-medium">{b.customerName || 'Guest'}</span> <span className="text-faint">· {b.label}</span></p>
                        <p className="truncate text-xs text-faint">{b.item || '—'} · {ago(b.createdAt)}</p>
                      </div>
                      <StatusBadge status={b.status} />
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <div className="space-y-3 p-5">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-8" />)}</div>
            )}
          </Card>
        </div>
      </div>

      <Confirm
        open={Boolean(action)}
        onOpenChange={(o) => !o && setAction(null)}
        title={action?.kind === 'confirm' ? `Confirm ${action?.booking.name}?` : `Cancel ${action?.booking.name}’s request?`}
        confirmLabel={action?.kind === 'confirm' ? 'Confirm & email receipt' : 'Cancel request'}
        tone={action?.kind === 'confirm' ? 'success' : 'danger'}
        onConfirm={runBookingAction}
        loading={busy}
      >
        {action?.kind === 'confirm'
          ? <>This takes a seat on <b>{action?.booking.trip}</b> and emails the traveller a receipt for {kes(action?.booking.amount)}.</>
          : <>The traveller is emailed that their request was cancelled. Any held seat is released.</>}
      </Confirm>
    </>
  );
}
