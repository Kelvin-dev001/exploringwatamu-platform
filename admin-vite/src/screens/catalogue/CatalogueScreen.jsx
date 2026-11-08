import { Link } from 'react-router-dom';
import { Plus, Pencil, ExternalLink, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/ui';
import DataView, { useRows } from '@/ui/DataView';
import { InlinePrice, RowMenu, Thumb, Toggle } from '@/ui/controls';
import { listOf, SITE_URL, useDelete, useQuick } from './kit';

/*
 * Config-driven list for simpler catalogue types (stays, transfers, car hire,
 * vehicles, services, property): thumbnail + name + details, optional inline
 * price and live toggle, edit/view/delete menu.
 */
export default function CatalogueScreen({ c }) {
  const list = useRows(async () => listOf(await api.get(c.endpoint, { params: c.params })));
  const quick = useQuick(c.quick);
  const del = useDelete({ endpoint: (r) => `${c.endpoint}/${r._id}`, name: c.name, what: c.what });
  const edit = (r) => `${c.path}/${r._id}`;

  const menu = (r, l) => [
    { label: 'Edit', icon: Pencil, to: edit(r) },
    c.website && { label: 'View on website', icon: ExternalLink, href: `${SITE_URL}${c.website}`, hidden: r.active === false },
    { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => del.ask(r, l) },
  ];
  const price = (r, l) => c.price && (
    <InlinePrice value={r[c.price.field]} label={c.price.label} suffix={c.price.suffix} onSave={(n) => quick(r._id, { [c.price.field]: n }, l, `${c.price.label} updated`)} />
  );
  const live = (r, l) => c.active && (
    <Toggle checked={r.active !== false} label={r.active !== false ? 'Live — tap to hide' : 'Hidden — tap to show'} onChange={(v) => quick(r._id, { active: v }, l, v ? `${c.name(r)} is live` : `${c.name(r)} hidden`)} />
  );
  const identity = (r, size) => (
    <div className="flex min-w-0 items-center gap-3">
      <Thumb src={c.image?.(r)} icon={c.icon} className={size} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">{c.name(r)}</p>
        <p className="truncate text-xs text-faint">{c.subtitle?.(r)}</p>
      </div>
    </div>
  );

  const columns = [
    { key: 'name', header: c.noun, sort: (r) => c.name(r), cell: (r) => identity(r) },
    ...(c.columns || []),
    c.price && { key: 'price', header: c.price.label, sort: (r) => r[c.price.field] ?? 0, cell: price },
    c.active && { key: 'live', header: 'Live', className: 'w-20', sort: (r) => (r.active !== false ? 1 : 0), cell: live },
    { key: 'menu', header: '', className: 'w-12 text-right', cell: (r, l) => <RowMenu items={menu(r, l)} /> },
  ].filter(Boolean);

  return (
    <>
      <DataView
        title={c.title}
        description={c.description}
        actions={<Button to={`${c.path}/new`}><Plus />Add {c.noun.toLowerCase()}</Button>}
        {...list}
        rowLink={edit}
        search={c.search}
        searchPlaceholder={`Search ${c.title.toLowerCase()}`}
        filters={[
          ...(c.filters || []),
          ...(c.active ? [{ key: 'status', label: 'Status', options: [{ value: 'live', label: 'Live' }, { value: 'hidden', label: 'Hidden' }], test: (r, v) => (v === 'live' ? r.active !== false : r.active === false) }] : []),
        ]}
        defaultSort={{ key: 'name', dir: 'asc' }}
        empty={{ icon: c.icon, title: `No ${c.title.toLowerCase()} yet`, action: <Button to={`${c.path}/new`}><Plus />Add {c.noun.toLowerCase()}</Button> }}
        columns={columns}
        card={(r, l) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link to={edit(r)} className="min-w-0 flex-1">{identity(r, 'size-14')}</Link>
              {live(r, l)}
            </div>
            <div className="mt-1.5 flex items-center gap-3 pl-[4.25rem]">
              {price(r, l)}
              {c.cardExtra?.(r)}
              <span className="ml-auto"><RowMenu items={menu(r, l)} /></span>
            </div>
          </div>
        )}
      />
      {del.dialog}
    </>
  );
}
