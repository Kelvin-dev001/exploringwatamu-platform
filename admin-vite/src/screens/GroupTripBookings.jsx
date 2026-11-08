import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Ban, Users, Pencil } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { ago, cn, date, dateRange, kes } from '@/lib/utils';
import { Badge, Button, Card, Confirm, ContactActions, StatusBadge, useToast } from '@/ui';
import DataView from '@/ui/DataView';

export default function GroupTripBookings() {
  const { tripId } = useParams();
  const toast = useToast();
  const [trip, setTrip] = useState(null);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [b, t] = await Promise.all([api.get(`/group-bookings/admin/trip/${tripId}`), api.get('/group-trips/admin/all')]);
      setRows(b.data || []);
      const found = (t.data || []).find((x) => x._id === tripId) || null;
      setTrip(found);
      document.title = `${found?.title || 'Group trip'} bookings · Admin`;
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t load bookings for this trip.'));
    }
    setLoading(false);
  }, [tripId]);
  useEffect(() => { reload(); }, [reload]);

  const run = async () => {
    setBusy(true);
    try {
      if (action.kind === 'confirm') await api.post('/group-bookings/confirm', { bookingId: action.row._id });
      else await api.put(`/group-bookings/admin/${action.row._id}/cancel`);
      toast(action.kind === 'confirm' ? `${action.row.fullName} confirmed — receipt emailed` : `${action.row.fullName} cancelled — seat released`);
      setAction(null);
      reload();
    } catch (err) {
      toast(errorMessage(err), 'danger');
    }
    setBusy(false);
  };

  const actions = (b) => (
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
      {b.status === 'pending' && <Button size="sm" variant="success" onClick={() => setAction({ kind: 'confirm', row: b })}><CheckCircle2 />Confirm</Button>}
      {b.status !== 'cancelled' && <Button size="sm" variant="danger-ghost" onClick={() => setAction({ kind: 'cancel', row: b })}><Ban />Cancel</Button>}
    </div>
  );
  const filled = trip ? trip.confirmedParticipants || 0 : 0;
  const pct = trip?.maxParticipants ? Math.min(100, Math.round((filled / trip.maxParticipants) * 100)) : 0;
  const pending = (rows || []).filter((b) => b.status === 'pending').length;

  return (
    <>
      <Link to="/grouptrips" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"><ArrowLeft className="size-4" />Group trips</Link>
      {trip && (
        <Card className="mb-6 flex flex-wrap items-center gap-4 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-lg font-bold text-ink">{trip.title}<StatusBadge status={trip.status} /></p>
            <p className="text-sm text-muted">{dateRange(trip.startDate, trip.endDate)} · {kes(trip.fullPrice)} per person · deposit {kes(trip.depositAmount)}</p>
          </div>
          <div className="w-48">
            <p className="text-sm font-semibold text-ink">{filled}/{trip.maxParticipants} seats confirmed</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-subtle"><div className={cn('h-full rounded-full', pct >= 80 ? 'bg-accent' : 'bg-brand')} style={{ width: `${pct}%` }} /></div>
          </div>
          <Button variant="secondary" size="sm" to={`/grouptrips/${tripId}`}><Pencil />Edit trip</Button>
        </Card>
      )}
      <DataView
        title="Trip bookings"
        description={pending ? `${pending} waiting for confirmation` : 'Everyone who asked to join this trip'}
        rows={rows}
        setRows={setRows}
        loading={loading}
        error={error}
        reload={reload}
        search={(b) => `${b.fullName} ${b.email} ${b.phone}`}
        searchPlaceholder="Search travellers"
        filters={[{ key: 'status', label: 'Status', options: ['pending', 'confirmed', 'cancelled'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })), test: (b, v) => b.status === v }]}
        defaultSort={{ key: 'created', dir: 'asc' }}
        empty={{ icon: Users, title: 'No one has asked to join yet' }}
        columns={[
          { key: 'name', header: 'Traveller', sort: (b) => b.fullName, cell: (b) => <div className="min-w-0"><p className="truncate font-semibold text-ink">{b.fullName}</p><p className="truncate text-xs text-faint">{b.email} · {b.phone}</p></div> },
          { key: 'vibe', header: 'Vibe', cell: (b) => <div className="flex max-w-56 flex-wrap gap-1">{(b.travelPersonalities || []).slice(0, 2).map((p) => <Badge key={p}>{p}</Badge>)}{b.travelGroup && <Badge tone="brand">{b.travelGroup}</Badge>}</div> },
          { key: 'pay', header: 'Payment', sort: (b) => b.amountPaid || 0, cell: (b) => <div className="text-sm"><p className="font-medium capitalize text-ink">{b.paymentType} · {kes(b.amountPaid)}</p>{b.amountDue > 0 && <p className="text-xs text-faint">balance {kes(b.amountDue)}</p>}</div> },
          { key: 'status', header: 'Status', sort: (b) => b.status, cell: (b) => <StatusBadge status={b.status} /> },
          { key: 'created', header: 'Asked', sort: (b) => new Date(b.createdAt).getTime(), cell: (b) => <span className="text-xs text-faint">{ago(b.createdAt)}</span> },
          { key: 'contact', header: '', cell: (b) => <ContactActions compact phone={b.phone} email={b.email} name={b.fullName} context={trip ? `your ${trip.title} booking` : 'your booking'} /> },
          { key: 'actions', header: '', className: 'text-right', cell: actions },
        ]}
        card={(b) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0"><p className="truncate font-semibold text-ink">{b.fullName}</p><p className="text-xs text-faint">{b.paymentType} · {kes(b.amountPaid)} · {ago(b.createdAt)}</p></div>
              <StatusBadge status={b.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ContactActions compact phone={b.phone} email={b.email} name={b.fullName} context={trip ? `your ${trip.title} booking` : 'your booking'} />
              <span className="ml-auto">{actions(b)}</span>
            </div>
          </div>
        )}
      />
      <Confirm
        open={Boolean(action)}
        onOpenChange={(o) => !o && setAction(null)}
        title={action?.kind === 'confirm' ? `Confirm ${action?.row.fullName}?` : `Cancel ${action?.row.fullName}’s booking?`}
        confirmLabel={action?.kind === 'confirm' ? 'Confirm & email receipt' : 'Cancel booking'}
        tone={action?.kind === 'confirm' ? 'success' : 'danger'}
        onConfirm={run}
        loading={busy}
      >
        {action?.kind === 'confirm' ? 'This takes a seat and emails a receipt.' : 'The traveller is emailed and any seat they held is released.'}
        {action?.row && <p className="mt-2 text-xs text-faint">Asked {date(action.row.createdAt, { day: 'numeric', month: 'long' })}</p>}
      </Confirm>
    </>
  );
}
