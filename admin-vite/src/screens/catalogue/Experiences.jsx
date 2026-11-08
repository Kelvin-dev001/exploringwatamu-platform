import { Link } from 'react-router-dom';
import { Compass, Plus, Pencil, ExternalLink, Trash2, ImageOff } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Badge } from '@/ui';
import DataView, { useRows } from '@/ui/DataView';
import { InlinePrice, RowMenu, Thumb, Toggle } from '@/ui/controls';
import { listOf, SITE_URL, TagSummary, useDelete, useQuick } from './kit';

export default function Experiences() {
  const list = useRows(async () => listOf(await api.get('/tours', { params: { limit: 1000 } })));
  const quick = useQuick('tours');
  const del = useDelete({ endpoint: (r) => `/tours/${r._id}`, name: (r) => r.name, what: 'experience', warning: 'and its photos from the website' });
  const menu = (r, l) => [
    { label: 'Edit', icon: Pencil, to: `/tours/${r._id}` },
    { label: 'View on website', icon: ExternalLink, href: `${SITE_URL}/experiences/${r._id}`, hidden: r.active === false },
    { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => del.ask(r, l) },
  ];
  const live = (r, l) => <Toggle checked={r.active !== false} label={r.active !== false ? 'Live on website — tap to hide' : 'Hidden — tap to publish'} onChange={(v) => quick(r._id, { active: v }, l, v ? `${r.name} is live` : `${r.name} hidden from the website`)} />;

  return (
    <>
      <DataView
        title="Experiences"
        description="Tours and activities travellers can add to their trip."
        actions={<Button to="/tours/new"><Plus />Add experience</Button>}
        {...list}
        rowLink={(r) => `/tours/${r._id}`}
        search={(r) => `${r.name} ${r.duration || ''} ${(r.highlights || []).join(' ')}`}
        searchPlaceholder="Search experiences"
        filters={[
          { key: 'status', label: 'Status', options: [{ value: 'live', label: 'Live' }, { value: 'hidden', label: 'Hidden' }], test: (r, v) => (v === 'live' ? r.active !== false : r.active === false) },
          { key: 'tags', label: 'Vibe tags', options: [{ value: 'missing', label: 'Missing' }, { value: 'set', label: 'Tagged' }], test: (r, v) => (v === 'missing' ? !r.vibes?.length : r.vibes?.length > 0) },
          { key: 'photos', label: 'Photos', options: [{ value: 'missing', label: 'Missing' }, { value: 'set', label: 'Has photos' }], test: (r, v) => (v === 'missing' ? !r.gallery?.length : r.gallery?.length > 0) },
        ]}
        defaultSort={{ key: 'name', dir: 'asc' }}
        empty={{ icon: Compass, title: 'No experiences yet', text: 'Add your first tour so travellers can find and book it.', action: <Button to="/tours/new"><Plus />Add experience</Button> }}
        columns={[
          {
            key: 'name', header: 'Experience', sort: (r) => r.name,
            cell: (r) => (
              <div className="flex items-center gap-3">
                <Thumb src={r.gallery?.[0]} icon={ImageOff} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{r.name}</p>
                  <p className="truncate text-xs text-faint">{r.duration || 'No duration'} · <TagSummary vibes={r.vibes} /></p>
                </div>
              </div>
            ),
          },
          { key: 'visitor', header: 'Visitor (adult)', sort: (r) => r.priceForeignerAdult ?? 0, cell: (r, l) => <InlinePrice value={r.priceForeignerAdult} label="Visitor adult price" onSave={(n) => quick(r._id, { priceForeignerAdult: n }, l, 'Visitor price updated')} /> },
          { key: 'resident', header: 'Resident (adult)', sort: (r) => r.priceResidentAdult ?? 0, cell: (r, l) => <InlinePrice value={r.priceResidentAdult} label="Resident adult price" onSave={(n) => quick(r._id, { priceResidentAdult: n }, l, 'Resident price updated')} /> },
          { key: 'live', header: 'Live', sort: (r) => (r.active !== false ? 1 : 0), className: 'w-20', cell: live },
          { key: 'menu', header: '', className: 'w-12 text-right', cell: (r, l) => <RowMenu items={menu(r, l)} /> },
        ]}
        card={(r, l) => (
          <div className="flex gap-3">
            <Link to={`/tours/${r._id}`}><Thumb src={r.gallery?.[0]} icon={ImageOff} className="size-14" /></Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/tours/${r._id}`} className="min-w-0">
                  <p className="truncate font-semibold text-ink">{r.name}</p>
                  <p className="truncate text-xs text-faint">{r.duration || 'No duration'}</p>
                </Link>
                {live(r, l)}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-xs text-faint">Visitor</span>
                <InlinePrice value={r.priceForeignerAdult} label="Visitor adult price" onSave={(n) => quick(r._id, { priceForeignerAdult: n }, l, 'Visitor price updated')} />
                {!r.vibes?.length && <Badge tone="warn">No vibe tags</Badge>}
                <span className="ml-auto"><RowMenu items={menu(r, l)} /></span>
              </div>
            </div>
          </div>
        )}
      />
      {del.dialog}
    </>
  );
}
