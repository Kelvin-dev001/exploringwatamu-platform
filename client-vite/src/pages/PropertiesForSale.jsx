import { useMemo, useState } from 'react';
import axios from 'axios';
import { MapPin, CalendarCheck, Check } from 'lucide-react';
import { API_URL } from '@/api.js';
import useListing, { LIST_PARAMS } from '@/components/listing/useListing';
import PageHero from '@/components/listing/PageHero';
import ListingCard from '@/components/listing/ListingCard';
import { GridSkeleton, ErrorState, EmptyState } from '@/components/listing/States';
import Seo from '@/components/seo/Seo';
import { Container, Chip, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { formatDay } from '@/lib/utils';

const ART_CYCLE = ['culture', 'slow', 'ocean', 'romance'];

const TYPES = [
  { id: '', label: 'All' },
  { id: 'villa', label: 'Villas' },
  { id: 'apartment', label: 'Apartments' },
  { id: 'land', label: 'Land' },
];
const TIMES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const inputCls = 'h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-ocean-900';

/** Book a viewing slot (POST /api/propertyviewings/book). */
function ViewingSheet({ property, onClose }) {
  const [form, setForm] = useState({ date: tomorrow(), time: '10:00', userName: '', userContact: '' });
  const [state, setState] = useState({ sending: false, error: '', done: null });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.userName.trim().length < 2 || form.userContact.trim().length < 5) {
      setState({ sending: false, error: 'Please add your name and a phone number or email.', done: null });
      return;
    }
    setState({ sending: true, error: '', done: null });
    try {
      const res = await axios.post(`${API_URL}/propertyviewings/book`, { propertyId: property._id, ...form, userName: form.userName.trim(), userContact: form.userContact.trim() });
      setState({ sending: false, error: '', done: res.data });
    } catch (err) {
      const msg = err?.response?.data?.error;
      setState({ sending: false, error: msg === 'Slot not available' ? 'That time is already booked — please pick another.' : msg || 'We couldn’t book that viewing. Please try again.', done: null });
    }
  };

  return (
    <Sheet open={Boolean(property)} onOpenChange={(o) => !o && onClose()} title="Book a viewing" description={property?.name}>
      {state.done ? (
        <div className="px-6 py-8 text-center">
          <Check className="mx-auto size-10 rounded-full bg-mangrove-100 p-2 text-mangrove-700" />
          <p className="mt-4 font-display text-2xl text-ocean-900">Viewing booked</p>
          <p className="mt-2 text-ocean-900/65">
            {formatDay(form.date, { weekday: 'long', day: 'numeric', month: 'long' })} at {form.time}. We’ll contact you to confirm the meeting point.
          </p>
          <Button className="mt-6" onClick={onClose}>Done</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4 px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Date</span>
              <input type="date" min={tomorrow()} value={form.date} onChange={set('date')} className={inputCls} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Time</span>
              <select value={form.time} onChange={set('time')} className={inputCls}>
                {TIMES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Your name</span>
            <input value={form.userName} onChange={set('userName')} autoComplete="name" className={inputCls} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Phone, WhatsApp or email</span>
            <input value={form.userContact} onChange={set('userContact')} autoComplete="tel" className={inputCls} required />
          </label>
          {state.error && <p className="rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-700">{state.error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={state.sending}>
            <CalendarCheck /> {state.sending ? 'Booking…' : 'Book viewing'}
          </Button>
        </form>
      )}
    </Sheet>
  );
}

export default function PropertiesForSale() {
  const { items, loading, error, retry } = useListing('/properties', LIST_PARAMS);
  const [type, setType] = useState('');
  const [viewing, setViewing] = useState(null);
  const filtered = useMemo(() => items.filter((p) => p.active !== false && (!type || p.type === type)), [items, type]);

  return (
    <>
      <Seo title="Property for sale in Watamu" description="Villas, apartments and land for sale in Watamu, Kenya. Book a viewing with our local team." />
      <PageHero eyebrow="Property" title="Make Watamu home" lede="Villas, apartments and plots on Kenya’s most beautiful stretch of coast. Book a viewing and we’ll show you around." />
      <Container size="wide" className="py-10 lg:py-14">
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Property type">
          {TYPES.map((t) => (
            <Chip key={t.id || 'all'} selected={type === t.id} onClick={() => setType(t.id)}>{t.label}</Chip>
          ))}
        </div>
        {error ? (
          <ErrorState what="properties" onRetry={retry} />
        ) : loading ? (
          <GridSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState title="No properties listed right now" text="Tell us what you’re looking for and we’ll let you know when something comes up.">
            <Button href="mailto:hello@exploringwatamu.com?subject=Property%20search">Tell us what you need</Button>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p, i) => (
              <ListingCard
                key={p._id}
                images={p.pictures}
                art={ART_CYCLE[i % ART_CYCLE.length]}
                title={p.name}
                badge={p.type ? <Badge tone="glass" className="capitalize">{p.type}</Badge> : null}
                meta={[p.location && { icon: MapPin, text: p.location }]}
                description={p.description}
                price={p.price != null ? { amount: p.price, prefix: 'Asking', unit: '' } : null}
                actions={<Button size="sm" onClick={() => setViewing(p)}><CalendarCheck /> Book a viewing</Button>}
              />
            ))}
          </div>
        )}
      </Container>
      <ViewingSheet property={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
