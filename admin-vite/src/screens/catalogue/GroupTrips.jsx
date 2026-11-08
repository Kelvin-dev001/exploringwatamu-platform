import { Link } from 'react-router-dom';
import { Users, Plus, Pencil, ExternalLink, Trash2, ImageOff, ListChecks } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, date } from '@/lib/utils';
import { Button, Select, StatusBadge } from '@/ui';
import DataView, { useRows } from '@/ui/DataView';
import { InlinePrice, RowMenu, Thumb } from '@/ui/controls';
import { listOf, SITE_URL, TagSummary, useDelete, useQuick } from './kit';

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'full', label: 'Full' },
  { value: 'closed', label: 'Closed' },
];

function Seats({ r }) {
  const pct = r.maxParticipants ? Math.min(100, Math.round(((r.confirmedParticipants || 0) / r.maxParticipants) * 100)) : 0;
  return (
    <div className="w-28">
      <p className="text-xs font-semibold text-ink">{r.confirmedParticipants || 0}/{r.maxParticipants} <span className="font-normal text-faint">seats</span></p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-subtle"><div className={cn('h-full rounded-full', pct >= 80 ? 'bg-accent' : 'bg-brand')} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function GroupTrips() {
  const list = useRows(async () => listOf(await api.get('/group-trips/admin/all')));
  const quick = useQuick('grouptrips');
  const del = useDelete({ endpoint: (r) => `/group-trips/${r._id}`, name: (r) => r.title, what: 'group trip', warning: '(existing bookings stay in the bookings list)' });
  const statusSelect = (r, l) => (
    <Select value={r.status} onClick={(e) => e.stopPropagation()} onChange={(e) => quick(r._id, { status: e.target.value }, l, `${r.title}: ${e.target.value}`)} className="h-9 w-36 text-sm" aria-label={`Status of ${r.title}`}>
      {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
    </Select>
  );
  const menu = (r, l) => [
    { label: 'Edit', icon: Pencil, to: `/grouptrips/${r._id}` },
    { label: 'Bookings', icon: ListChecks, to: `/grouptripbookings/${r._id}` },
    { label: 'View on website', icon: ExternalLink, href: `${SITE_URL}/group-trips/${r.slug}`, hidden: !['published', 'full'].includes(r.status) },
    { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => del.ask(r, l) },
  ];
  const upcoming = (r) => new Date(r.startDate) >= new Date(new Date().toDateString());

  return (
    <>
      <DataView
        title="Group trips"
        description="Scheduled trips travellers can join. Change status or price right here."
        actions={<Button to="/grouptrips/new"><Plus />Add group trip</Button>}
        {...list}
        rowLink={(r) => `/grouptrips/${r._id}`}
        search={(r) => `${r.title} ${r.meetingPoint || ''}`}
        searchPlaceholder="Search group trips"
        filters={[
          { key: 'status', label: 'Status', options: STATUSES, test: (r, v) => r.status === v },
          { key: 'when', label: 'When', options: [{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }], test: (r, v) => (v === 'upcoming' ? upcoming(r) : !upcoming(r)) },
        ]}
        defaultSort={{ key: 'date', dir: 'asc' }}
        empty={{ icon: Users, title: 'No group trips yet', action: <Button to="/grouptrips/new"><Plus />Add group trip</Button> }}
        columns={[
          {
            key: 'title', header: 'Trip', sort: (r) => r.title,
            cell: (r) => (
              <div className="flex items-center gap-3">
                <Thumb src={r.heroImage || r.gallery?.[0]} icon={ImageOff} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{r.title}</p>
                  <p className="truncate text-xs text-faint"><TagSummary vibes={r.vibes} /></p>
                </div>
              </div>
            ),
          },
          { key: 'date', header: 'Dates', sort: (r) => new Date(r.startDate).getTime(), cell: (r) => <span className={cn('whitespace-nowrap', !upcoming(r) && 'text-faint')}>{date(r.startDate)} – {date(r.endDate)}</span> },
          { key: 'seats', header: 'Seats', sort: (r) => (r.confirmedParticipants || 0) / (r.maxParticipants || 1), cell: (r) => <Link to={`/grouptripbookings/${r._id}`} onClick={(e) => e.stopPropagation()}><Seats r={r} /></Link> },
          { key: 'price', header: 'Price', sort: (r) => r.fullPrice ?? 0, cell: (r, l) => <InlinePrice value={r.fullPrice} label="Full price" onSave={(n) => quick(r._id, { fullPrice: n }, l, 'Price updated')} /> },
          { key: 'status', header: 'Status', sort: (r) => r.status, cell: statusSelect },
          { key: 'menu', header: '', className: 'w-12 text-right', cell: (r, l) => <RowMenu items={menu(r, l)} /> },
        ]}
        card={(r, l) => (
          <div className="flex gap-3">
            <Link to={`/grouptrips/${r._id}`}><Thumb src={r.heroImage || r.gallery?.[0]} icon={ImageOff} className="size-14" /></Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/grouptrips/${r._id}`} className="min-w-0">
                  <p className="truncate font-semibold text-ink">{r.title}</p>
                  <p className="text-xs text-faint">{date(r.startDate)} – {date(r.endDate)}</p>
                </Link>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Link to={`/grouptripbookings/${r._id}`}><Seats r={r} /></Link>
                <InlinePrice value={r.fullPrice} label="Full price" onSave={(n) => quick(r._id, { fullPrice: n }, l, 'Price updated')} />
              </div>
              <div className="mt-2 flex items-center gap-2">{statusSelect(r, l)}<span className="ml-auto"><RowMenu items={menu(r, l)} /></span></div>
            </div>
          </div>
        )}
      />
      {del.dialog}
    </>
  );
}
