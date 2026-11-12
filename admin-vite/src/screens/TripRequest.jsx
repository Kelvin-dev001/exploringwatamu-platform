import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Send, CheckCircle2, XCircle, Ban, RotateCcw, CalendarDays, Users, Globe2, Sparkles, StickyNote, History, ListChecks, Wand2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { ago, cn, date, dateRange, kes, notifiedMessage } from '@/lib/utils';
import { Alert, Badge, Button, Card, CardHeader, Confirm, ContactActions, Field, Input, PageHeader, Skeleton, StatusBadge, StickyActions, Textarea, useToast } from '@/ui';
import WhatsAppReply from './WhatsAppReply';

const VIBE = { ocean: 'Ocean & Reef', slow: 'Slow & Soulful', adventure: 'Adventure', culture: 'Culture & History', romance: 'Romance', social: 'Social & Nightlife' };
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

// What each planner item is (kinds from backend constants/tripItems.js). Stays and
// cars already say so in their title ("Stay · …"), so only add the tag when it doesn't.
const KIND = { group: 'Group trip', transfer: 'Transfer', stay: 'Stay', carhire: 'Car hire', service: 'Service' };
const kindTag = (it) => (KIND[it.kind] && !String(it.title || '').startsWith(KIND[it.kind]) ? KIND[it.kind] : null);
const KindTag = ({ item }) => (kindTag(item) ? <Badge className="ml-1.5 align-middle">{kindTag(item)}</Badge> : null);

/** Lines pre-filled from the itinerary (listed adult price × adults); the team adjusts before sending. */
function suggestLines(r) {
  const all = [...(r.days || []).flatMap((d) => d.items || []), ...(r.ideas || [])];
  return all.map((it) => ({
    label: it.listedPrice ? `${it.title} × ${r.adults} adult${r.adults === 1 ? '' : 's'}` : it.title,
    amount: it.listedPrice ? String(it.listedPrice * r.adults) : '',
  }));
}

export default function TripRequest() {
  const { id } = useParams();
  const toast = useToast();
  const [r, setR] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [lines, setLines] = useState([]);
  const [message, setMessage] = useState('');
  const [validUntil, setValidUntil] = useState(inDays(14));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState(null); // 'send' | status string

  const hydrate = useCallback((data) => {
    setR(data);
    setNotes(data.adminNotes || '');
    if (data.quote?.lines?.length) {
      setLines(data.quote.lines.map((l) => ({ label: l.label, amount: String(l.amount) })));
      setMessage(data.quote.message || '');
      if (data.quote.validUntil) setValidUntil(String(data.quote.validUntil).slice(0, 10));
    } else {
      setLines(suggestLines(data));
      // In the traveller's language: for an Italian request the email around it is Italian too.
      const first = data.contact?.name?.split(' ')[0] || '';
      setMessage(
        data.locale === 'it'
          ? `Ciao ${first},\n\ngrazie per aver organizzato con noi il tuo viaggio a Watamu. Ecco il prezzo di tutto il tuo itinerario.`
          : `Hi ${first},\n\nThank you for planning your Watamu trip with us. Here’s the price for everything in your itinerary.`
      );
    }
  }, []);

  useEffect(() => {
    api.get(`/trip-requests/${id}`).then((res) => {
      hydrate(res.data);
      document.title = `${res.data.reference} · Trip requests`;
    }).catch((err) => setLoadError(errorMessage(err, 'Couldn’t load this trip request.')));
  }, [id, hydrate]);

  const total = useMemo(() => lines.reduce((s, l) => s + (Number(l.amount) || 0), 0), [lines]);
  const setLine = (i, patch) => setLines((ls) => ls.map((l, n) => (n === i ? { ...l, ...patch } : l)));
  const validLines = lines.filter((l) => l.label.trim());
  const canSend = r && r.status !== 'cancelled' && total > 0 && validLines.length > 0;

  const sendQuote = async () => {
    setBusy('send');
    setError('');
    try {
      const res = await api.put(`/trip-requests/${id}/quote`, {
        lines: validLines.map((l) => ({ label: l.label.trim(), amount: Number(l.amount) || 0 })),
        message, validUntil, adminNotes: notes,
      });
      hydrate(res.data);
      setConfirm(null);
      toast(...notifiedMessage(res.data.delivery, { done: 'Quote saved.', emailed: `Quote sent to ${res.data.contact.email}` }));
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t send the quote.'));
      setConfirm(null);
    }
    setBusy('');
  };

  const setStatus = async (status, notify) => {
    setBusy(status);
    try {
      const res = await api.put(`/trip-requests/${id}/status`, { status, notify });
      hydrate(res.data);
      setConfirm(null);
      toast(...notifiedMessage(res.data.delivery, { done: `Marked as ${status}.`, emailed: `Marked as ${status} — traveller emailed` }));
    } catch (err) {
      toast(errorMessage(err), 'danger');
    }
    setBusy('');
  };

  const saveNotes = async () => {
    try {
      await api.put(`/trip-requests/${id}/notes`, { adminNotes: notes });
      toast('Notes saved');
    } catch (err) {
      toast(errorMessage(err), 'danger');
    }
  };

  if (loadError) return <Alert>{loadError} <Link to="/trip-requests" className="font-semibold underline">Back to requests</Link></Alert>;
  if (!r) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;

  const travellers = `${r.adults} adult${r.adults === 1 ? '' : 's'}${r.children ? `, ${r.children} child${r.children === 1 ? '' : 'ren'}` : ''}`;
  const STATUS_COPY = {
    accepted: ['Mark as accepted?', 'Use this when the traveller has said yes. They’ll get a “trip confirmed” email if you choose to notify them.', 'success'],
    declined: ['Mark as declined?', 'Use this when the traveller has said no. You can reopen it later.', 'secondary'],
    cancelled: ['Cancel this request?', 'The request is closed. You can reopen it later.', 'danger'],
    new: ['Reopen this request?', 'It goes back to “New” so it can be priced again.', 'primary'],
  };

  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader
        back={<Link to="/trip-requests" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"><ArrowLeft className="size-4" />Trip requests</Link>}
        title={<span className="flex flex-wrap items-center gap-3">{r.contact.name}<StatusBadge status={r.status} /></span>}
        description={<><span className="font-mono">{r.reference}</span> · received {ago(r.createdAt)}</>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-6">
          {/* Traveller */}
          <Card className="p-4 sm:p-5">
            <WhatsAppReply request={r} />
            <ContactActions phone={r.contact.phone} email={r.contact.email} name={r.contact.name} context={`trip request ${r.reference}`} whatsapp={false} className="mt-2" />
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="flex items-center gap-1 text-xs text-faint"><CalendarDays className="size-3" />Dates</dt><dd className="font-medium text-ink">{dateRange(r.arrival, r.departure)}</dd></div>
              <div><dt className="flex items-center gap-1 text-xs text-faint"><Users className="size-3" />Travellers</dt><dd className="font-medium text-ink">{travellers}</dd></div>
              <div><dt className="text-xs text-faint">Email</dt><dd className="truncate font-medium text-ink">{r.contact.email}</dd></div>
              <div><dt className="text-xs text-faint">Phone</dt><dd className="font-medium text-ink">{r.contact.phone || '—'}</dd></div>
              {r.contact.country && <div><dt className="flex items-center gap-1 text-xs text-faint"><Globe2 className="size-3" />From</dt><dd className="font-medium text-ink">{r.contact.country}</dd></div>}
              <div><dt className="text-xs text-faint">Language</dt><dd className="font-medium text-ink">{r.locale === 'it' ? 'Italiano — emails and quote PDF in Italian' : 'English'}</dd></div>
              <div><dt className="text-xs text-faint">Prices seen</dt><dd className="font-medium text-ink">{r.residency === 'resident' ? 'Kenya resident' : 'Visitor'}{r.estimate?.total ? ` · est. ${kes(r.estimate.total)}` : ''}</dd></div>
            </dl>
            {r.profile?.vibes?.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <Sparkles className="size-3.5 text-faint" />
                {r.profile.vibes.map((v) => <Badge key={v} tone="brand">{VIBE[v] || v}</Badge>)}
                {r.profile.companions && <Badge>{r.profile.companions}</Badge>}
              </div>
            )}
          </Card>

          {/* Itinerary */}
          <Card>
            <CardHeader icon={ListChecks} title="Itinerary" description={`${(r.days || []).length} days`} />
            <ol className="divide-y divide-line">
              {(r.days || []).map((d, i) => (
                <li key={i} className="px-4 py-3 sm:px-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-faint">{d.label || `Day ${i + 1}`}</p>
                  {d.items.length === 0 ? <p className="mt-1 text-sm text-faint">Free day</p> : (
                    <ul className="mt-1.5 space-y-1">
                      {d.items.map((it, j) => (
                        <li key={j} className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="text-ink">{it.title}{it.hours ? <span className="text-faint"> · {it.hours}h</span> : null}<KindTag item={it} /></span>
                          {it.listedPrice ? <span className="shrink-0 text-xs text-faint">{kes(it.listedPrice)}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              {(r.ideas || []).length > 0 && (
                <li className="px-4 py-3 sm:px-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-faint">Stays, extras & unscheduled</p>
                  <ul className="mt-1.5 space-y-1">{r.ideas.map((it, j) => <li key={j} className="text-sm text-ink">{it.title}<KindTag item={it} /></li>)}</ul>
                </li>
              )}
            </ol>
            {r.notes && (
              <div className="border-t border-line px-4 py-3 sm:px-5">
                <p className="flex items-center gap-1 text-xs font-semibold text-faint"><StickyNote className="size-3" />Traveller notes</p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">{r.notes}</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quote builder */}
          <Card>
            <CardHeader icon={Send} title={r.quote?.sentAt ? `Quote · sent ${date(r.quote.sentAt)}` : 'Price this trip'}
              description="Pre-filled from listed adult prices — adjust for children, transfers and discounts"
              action={<Button variant="ghost" size="sm" onClick={() => setLines(suggestLines(r))} title="Rebuild lines from the itinerary"><Wand2 /><span className="hidden sm:inline">Refill</span></Button>} />
            <div className="space-y-2 p-4 sm:p-5">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-line p-2 sm:grid-cols-[1fr_9rem_auto] sm:border-0 sm:p-0">
                  <Input value={l.label} onChange={(e) => setLine(i, { label: e.target.value })} placeholder="What’s included" aria-label={`Line ${i + 1} description`} className="col-span-2 sm:col-span-1" />
                  <Input value={l.amount} onChange={(e) => setLine(i, { amount: e.target.value.replace(/[^\d.]/g, '') })} placeholder="KES" inputMode="decimal" aria-label={`Line ${i + 1} amount in KES`} className="text-right tabular-nums" />
                  <Button variant="ghost" size="icon" onClick={() => setLines((ls) => ls.filter((_, n) => n !== i))} aria-label={`Remove line ${i + 1}`}><Trash2 /></Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setLines((ls) => [...ls, { label: '', amount: '' }])}><Plus />Add line</Button>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-sm font-medium text-muted">Total</span>
                <span className="text-2xl font-bold tabular-nums text-ink">{kes(total)}</span>
              </div>
              <Field label="Message to the traveller"><Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
              <Field label="Valid until" className="sm:w-48"><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
              {error && <Alert>{error}</Alert>}
              <div className="hidden lg:block">
                <Button size="lg" className="w-full" disabled={!canSend} onClick={() => setConfirm('send')}><Send />{r.quote?.sentAt ? 'Send updated quote' : 'Send quote'} · {kes(total)}</Button>
              </div>
            </div>
          </Card>

          {/* Outcome */}
          <Card className="p-4 sm:p-5">
            <p className="text-sm font-semibold text-ink">Outcome</p>
            <p className="mt-0.5 text-xs text-faint">Record the traveller’s answer after they reply.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="success" disabled={r.status !== 'quoted' || !!busy} onClick={() => setConfirm('accepted')}><CheckCircle2 />Accepted</Button>
              <Button size="sm" variant="secondary" disabled={r.status !== 'quoted' || !!busy} onClick={() => setConfirm('declined')}><XCircle />Declined</Button>
              <Button size="sm" variant="danger-ghost" disabled={r.status === 'cancelled' || !!busy} onClick={() => setConfirm('cancelled')}><Ban />Cancel</Button>
              {['cancelled', 'declined'].includes(r.status) && <Button size="sm" variant="ghost" onClick={() => setConfirm('new')}><RotateCcw />Reopen</Button>}
            </div>
            <Field label="Internal notes" hint="Only your team sees these" className="mt-4">
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (r.adminNotes || '') && saveNotes()} />
            </Field>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink"><History className="size-4 text-faint" />History</p>
            <ol className="mt-3 space-y-2 border-l border-line pl-4">
              {(r.history || []).slice().reverse().map((h, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -left-[1.3rem] top-1.5 size-2 rounded-full bg-line" />
                  <StatusBadge status={h.status} /> <span className="text-muted">by {h.by} · {ago(h.at)}</span>
                  {h.note && <p className="text-xs text-faint">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      {/* Phone: send bar above the tab bar */}
      <StickyActions className="lg:hidden">
        <Button size="lg" disabled={!canSend} onClick={() => setConfirm('send')}><Send />{r.quote?.sentAt ? 'Resend' : 'Send'} · {kes(total)}</Button>
      </StickyActions>

      <Confirm
        open={confirm === 'send'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Email this quote to ${r.contact.name.split(' ')[0]}?`}
        confirmLabel={`Send ${kes(total)}`}
        onConfirm={sendQuote}
        loading={busy === 'send'}
      >
        Goes to <b>{r.contact.email}</b> with a PDF, valid until {date(validUntil, { day: 'numeric', month: 'long' })}.{r.contact.phone ? ' An SMS heads-up is sent too.' : ''}
      </Confirm>

      {confirm && confirm !== 'send' && (
        <Confirm
          open
          onOpenChange={(o) => !o && setConfirm(null)}
          title={STATUS_COPY[confirm][0]}
          confirmLabel={confirm === 'new' ? 'Reopen' : 'Yes, and email them'}
          tone={STATUS_COPY[confirm][2]}
          onConfirm={() => setStatus(confirm, confirm !== 'new')}
          loading={busy === confirm}
        >
          {STATUS_COPY[confirm][1]}
          {confirm !== 'new' && (
            <button type="button" className={cn('mt-3 block text-sm font-semibold text-brand underline')} onClick={() => setStatus(confirm, false)}>Update without emailing</button>
          )}
        </Confirm>
      )}
    </div>
  );
}
