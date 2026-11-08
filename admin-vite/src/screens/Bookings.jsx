import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarCheck, Ban, ExternalLink } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { ago, cn, date, kes } from '@/lib/utils';
import { Confirm, ContactActions, StatusBadge, useToast } from '@/ui';
import DataView from '@/ui/DataView';
import { RowMenu } from '@/ui/controls';

const TYPES = [
  { value: '', label: 'All' },
  { value: 'triprequest', label: 'Trip requests' },
  { value: 'grouptour', label: 'Group trips' },
  { value: 'tour', label: 'Experiences' },
  { value: 'carhire', label: 'Car hire' },
  { value: 'service', label: 'Services' },
  { value: 'propertyviewing', label: 'Viewings' },
];
const STATUSES = ['new', 'pending', 'quoted', 'booked', 'confirmed', 'accepted', 'declined', 'cancelled'];
const SIMPLE = ['tour', 'carhire', 'service', 'propertyviewing']; // cancellable from here

const contactOf = (b) => {
  const c = b.customerContact || '';
  return /@/.test(c) ? { email: c } : /\d{6,}/.test(c) ? { phone: c } : {};
};
const openLink = (b) => (b.type === 'triprequest' ? `/trip-requests/${b.id}` : b.type === 'grouptour' ? '/grouptrips' : null);

export default function Bookings() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || '';
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancel, setCancel] = useState(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/bookings', { params: { type: type || undefined, limit: 100 } });
      setRows(res.data.data || []);
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t load bookings.'));
    }
    setLoading(false);
  }, [type]);
  useEffect(() => {
    document.title = 'Bookings · Admin';
    setRows(null);
    reload();
  }, [reload]);

  const setType = (v) => {
    const next = new URLSearchParams(params);
    if (v) next.set('type', v); else next.delete('type');
    setParams(next, { replace: true });
  };

  const doCancel = async () => {
    setBusy(true);
    try {
      const res = await api.put(`/bookings/${cancel.row.type}/${cancel.row.id}/cancel`);
      cancel.list.update(cancel.row.id, { status: res.data.status });
      toast('Booking cancelled');
      setCancel(null);
    } catch (err) {
      toast(errorMessage(err), 'danger');
    }
    setBusy(false);
  };

  const menu = (b, l) => [
    openLink(b) && { label: b.type === 'triprequest' ? 'Open request' : 'Open group trips', icon: ExternalLink, to: openLink(b) },
    SIMPLE.includes(b.type) && b.status !== 'cancelled' && { label: 'Cancel booking', icon: Ban, tone: 'danger', onClick: () => setCancel({ row: b, list: l }) },
  ].filter(Boolean);

  return (
    <>
      <DataView
        title="Bookings"
        description={type ? `Latest ${TYPES.find((t) => t.value === type)?.label.toLowerCase()}` : 'Latest across every booking type'}
        tabs={
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Booking type">
        {TYPES.map((t) => (
          <button key={t.value || 'all'} type="button" role="tab" aria-selected={type === t.value} onClick={() => setType(t.value)}
            className={cn('shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium', type === t.value ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-muted hover:text-ink')}>
            {t.label}
          </button>
        ))}
      </div>
        }
        rows={rows}
        setRows={setRows}
        loading={loading}
        error={error}
        reload={reload}
        rowKey={(b) => `${b.type}-${b.id}`}
        search={(b) => `${b.customerName || ''} ${b.customerContact || ''} ${b.item || ''}`}
        searchPlaceholder="Search name, contact or item"
        filters={[{ key: 'status', label: 'Status', options: STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })), test: (b, v) => b.status === v }]}
        defaultSort={{ key: 'created', dir: 'desc' }}
        summary={(v) => {
          const total = v.reduce((s, b) => s + (Number(b.amount) || 0), 0);
          return total ? `${kes(total)} in view` : '';
        }}
        empty={{ icon: CalendarCheck, title: 'No bookings yet' }}
        columns={[
          {
            key: 'name', header: 'Traveller', sort: (b) => b.customerName || '',
            cell: (b) => (
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{b.customerName || 'Guest'}</p>
                <p className="truncate text-xs text-faint">{b.customerContact || '—'}</p>
              </div>
            ),
          },
          { key: 'item', header: 'Booking', sort: (b) => b.item || '', cell: (b) => <div className="min-w-0"><p className="truncate text-sm text-ink">{b.item || '—'}</p><p className="text-xs text-faint">{TYPES.find((t) => t.value === b.type)?.label || b.type}</p></div> },
          { key: 'date', header: 'For', sort: (b) => (b.date ? new Date(b.date).getTime() : 0), cell: (b) => <span className="whitespace-nowrap text-sm">{b.date ? date(b.date) : '—'}</span> },
          { key: 'amount', header: 'Amount', sort: (b) => Number(b.amount) || 0, cell: (b) => <span className="whitespace-nowrap text-sm font-medium tabular-nums">{b.amount != null ? kes(b.amount) : '—'}</span> },
          { key: 'status', header: 'Status', sort: (b) => b.status, cell: (b) => <StatusBadge status={b.status} /> },
          { key: 'created', header: 'Received', sort: (b) => new Date(b.createdAt || 0).getTime(), cell: (b) => <span className="whitespace-nowrap text-xs text-faint">{ago(b.createdAt)}</span> },
          { key: 'contact', header: '', className: 'w-36', cell: (b) => <ContactActions compact {...contactOf(b)} name={b.customerName} context="your booking" /> },
          { key: 'menu', header: '', className: 'w-12 text-right', cell: (b, l) => <RowMenu items={menu(b, l)} /> },
        ]}
        card={(b, l) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              {openLink(b) ? <Link to={openLink(b)} className="min-w-0"><p className="truncate font-semibold text-ink">{b.customerName || 'Guest'}</p></Link> : <p className="truncate font-semibold text-ink">{b.customerName || 'Guest'}</p>}
              <StatusBadge status={b.status} />
            </div>
            <p className="mt-0.5 truncate text-sm text-muted">{b.item || '—'}</p>
            <p className="text-xs text-faint">{TYPES.find((t) => t.value === b.type)?.label} · {b.date ? `for ${date(b.date)} · ` : ''}{b.amount != null ? `${kes(b.amount)} · ` : ''}{ago(b.createdAt)}</p>
            <div className="mt-2 flex items-center gap-2">
              <ContactActions compact {...contactOf(b)} name={b.customerName} context="your booking" />
              <span className="ml-auto"><RowMenu items={menu(b, l)} /></span>
            </div>
          </div>
        )}
      />
      <Confirm open={Boolean(cancel)} onOpenChange={(o) => !o && setCancel(null)} title={`Cancel ${cancel?.row.customerName || 'this'}’s booking?`} confirmLabel="Cancel booking" tone="danger" onConfirm={doCancel} loading={busy}>
        The booking is marked cancelled. The traveller isn’t emailed automatically — let them know using the contact buttons.
      </Confirm>
    </>
  );
}
