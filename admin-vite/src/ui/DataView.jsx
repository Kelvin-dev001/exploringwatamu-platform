import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, Button, Card, Empty, Input, PageHeader, Select, Skeleton } from '@/ui';

const PAGE = 25;

/*
 * List screen used across the admin: search, filters, sortable columns,
 * table on desktop and cards on phones, client-side paging. Filters and the
 * search live in the URL so the back button and shared links keep them.
 *
 * columns: [{ key, header, cell(row, api), sort(row), className, mobile: false }]
 * card(row, api): phone layout (defaults to the first columns)
 * filters: [{ key, label, options: [{ value, label }], test(row, value) }]
 * api passed to cells: { update(id, patch|doc), remove(id), reload() }
 */
export default function DataView({
  title, description, actions, rows, loading, error, reload, setRows,
  columns, card, rowKey = (r) => r._id || r.id, rowLink, search, searchPlaceholder = 'Search…',
  filters = [], defaultSort, empty, summary, tabs,
}) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') || '';
  const [qDraft, setQDraft] = useState(q);
  const [sort, setSort] = useState(defaultSort || null); // { key, dir }
  const [page, setPage] = useState(1);
  useEffect(() => setQDraft(q), [q]);

  // Debounced search into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if (qDraft === q) return;
      const next = new URLSearchParams(params);
      if (qDraft) next.set('q', qDraft); else next.delete('q');
      setParams(next, { replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [qDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const api = useMemo(() => ({
    update: (id, patch) => setRows((rs) => rs.map((r) => (rowKey(r) === id ? { ...r, ...patch } : r))),
    remove: (id) => setRows((rs) => rs.filter((r) => rowKey(r) !== id)),
    reload,
  }), [setRows, reload, rowKey]);

  const visible = useMemo(() => {
    let out = rows || [];
    const needle = q.trim().toLowerCase();
    if (needle && search) out = out.filter((r) => search(r).toLowerCase().includes(needle));
    filters.forEach((f) => {
      const v = params.get(f.key);
      if (v) out = out.filter((r) => f.test(r, v));
    });
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sort) {
        out = [...out].sort((a, b) => {
          const x = col.sort(a);
          const y = col.sort(b);
          const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true });
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, q, params, filters, sort, columns, search]);

  useEffect(() => setPage(1), [q, params, sort]);
  const pages = Math.max(1, Math.ceil(visible.length / PAGE));
  const slice = visible.slice((page - 1) * PAGE, page * PAGE);
  const activeFilters = filters.filter((f) => params.get(f.key)).length + (q ? 1 : 0);

  const toggleSort = (key) => setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }));
  const open = (row) => rowLink && navigate(rowLink(row));

  return (
    <>
      <PageHeader title={title} description={description} actions={actions} />
      {tabs && <div className="mb-3">{tabs}</div>}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {search && (
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input type="search" value={qDraft} onChange={(e) => setQDraft(e.target.value)} placeholder={searchPlaceholder} className="h-10 pl-9" aria-label="Search" />
          </div>
        )}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {filters.map((f) => (
            <Select key={f.key} value={params.get(f.key) || ''} onChange={(e) => setFilter(f.key, e.target.value)} className="h-10 w-auto shrink-0 text-sm" aria-label={f.label}>
              <option value="">{f.label}: all</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          ))}
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" className="h-10 shrink-0" onClick={() => { setQDraft(''); setParams(new URLSearchParams(), { replace: true }); }}><RotateCcw />Clear</Button>
          )}
        </div>
        <p className="text-sm text-faint sm:ml-auto" aria-live="polite">
          {loading && !rows ? 'Loading…' : `${visible.length}${visible.length !== (rows || []).length ? ` of ${(rows || []).length}` : ''} ${visible.length === 1 ? 'item' : 'items'}`}
          {summary ? ` · ${summary(visible)}` : ''}
        </p>
      </div>

      {error && <Alert className="mb-4">{error} {reload && <button type="button" onClick={reload} className="font-semibold underline">Try again</button>}</Alert>}

      <Card className="overflow-hidden">
        {loading && !rows ? (
          <div className="space-y-3 p-4 sm:p-5">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : visible.length === 0 ? (
          activeFilters ? <Empty icon={Search} title="Nothing matches">Try a different search or clear the filters.</Empty> : <Empty icon={empty?.icon} title={empty?.title || 'Nothing here yet'} action={empty?.action}>{empty?.text}</Empty>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-line bg-subtle/60 text-left text-xs font-semibold uppercase tracking-wider text-faint">
                  {columns.map((c) => (
                    <th key={c.key} scope="col" className={cn('px-4 py-2.5 font-semibold first:pl-5 last:pr-5', c.className)} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                      {c.sort ? (
                        <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 uppercase hover:text-ink">
                          {c.header}
                          {sort?.key === c.key ? (sort.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
                        </button>
                      ) : c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {slice.map((row) => (
                  <tr key={rowKey(row)} onClick={() => open(row)} className={cn('align-middle', rowLink && 'cursor-pointer hover:bg-subtle/60')}>
                    {columns.map((c) => <td key={c.key} className={cn('px-4 py-3 first:pl-5 last:pr-5', c.className)}>{c.cell(row, api)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Phone cards */}
            <ul className="divide-y divide-line md:hidden">
              {slice.map((row) => (
                <li key={rowKey(row)} className="px-4 py-3.5">
                  {card ? card(row, api) : rowLink ? <Link to={rowLink(row)} className="block">{columns[0].cell(row, api)}</Link> : columns[0].cell(row, api)}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </>
  );
}

/** Load a list once with the admin API client. Returns { rows, setRows, loading, error, reload }. */
export function useRows(loader) {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useMemo(() => async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await loader());
    } catch (err) {
      const { errorMessage } = await import('@/lib/api');
      setError(errorMessage(err, 'Couldn’t load this list.'));
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [reload]);
  return { rows, setRows, loading, error, reload };
}
