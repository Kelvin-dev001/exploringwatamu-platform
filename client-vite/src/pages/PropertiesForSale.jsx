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
import { useI18n } from '@/i18n';
import { pickText } from '@/i18n/listingContent';
import messages from '@/locales/listings';

const ART_CYCLE = ['culture', 'slow', 'ocean', 'romance'];

// Labels are message keys (locales/listings.js).
const TYPES = [
  { id: '', label: 'allProperties' },
  { id: 'villa', label: 'villas' },
  { id: 'apartment', label: 'apartments' },
  { id: 'land', label: 'land' },
];
const TYPE_LABEL = { villa: 'typeVilla', apartment: 'typeApartment', land: 'typeLand' };
const TIMES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const inputCls = 'h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-ocean-900';

/** Book a viewing slot (POST /api/propertyviewings/book). */
function ViewingSheet({ property, onClose }) {
  const { t, locale } = useI18n(messages);
  const [form, setForm] = useState({ date: tomorrow(), time: '10:00', userName: '', userContact: '' });
  const [state, setState] = useState({ sending: false, error: '', done: null });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.userName.trim().length < 2 || form.userContact.trim().length < 5) {
      setState({ sending: false, error: t('viewingMissing'), done: null });
      return;
    }
    setState({ sending: true, error: '', done: null });
    try {
      const res = await axios.post(`${API_URL}/propertyviewings/book`, { propertyId: property._id, ...form, userName: form.userName.trim(), userContact: form.userContact.trim() });
      setState({ sending: false, error: '', done: res.data });
    } catch (err) {
      const msg = err?.response?.data?.error;
      // The API's own wording is English; show ours for what we know, else a general line.
      setState({ sending: false, error: msg === 'Slot not available' ? t('slotTaken') : locale === 'en' && msg ? msg : t('viewingFailed'), done: null });
    }
  };

  return (
    <Sheet open={Boolean(property)} onOpenChange={(o) => !o && onClose()} title={t('bookViewing')} description={property ? pickText(property, 'title', locale, property.name).text : undefined}>
      {state.done ? (
        <div className="px-6 py-8 text-center">
          <Check className="mx-auto size-10 rounded-full bg-mangrove-100 p-2 text-mangrove-700" />
          <p className="mt-4 font-display text-2xl text-ocean-900">{t('viewingBooked')}</p>
          <p className="mt-2 text-ocean-900/65">
            {t('viewingConfirm', { date: formatDay(form.date, { weekday: 'long', day: 'numeric', month: 'long' }), time: form.time })}
          </p>
          <Button className="mt-6" onClick={onClose}>{t('done')}</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4 px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">{t('date')}</span>
              <input type="date" min={tomorrow()} value={form.date} onChange={set('date')} className={inputCls} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">{t('time')}</span>
              <select value={form.time} onChange={set('time')} className={inputCls}>
                {TIMES.map((slot) => <option key={slot}>{slot}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">{t('yourName')}</span>
            <input value={form.userName} onChange={set('userName')} autoComplete="name" className={inputCls} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">{t('contact')}</span>
            <input value={form.userContact} onChange={set('userContact')} autoComplete="tel" className={inputCls} required />
          </label>
          {state.error && <p className="rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-700">{state.error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={state.sending}>
            <CalendarCheck /> {state.sending ? t('booking') : t('bookViewingButton')}
          </Button>
        </form>
      )}
    </Sheet>
  );
}

export default function PropertiesForSale() {
  const { t, locale } = useI18n(messages);
  const { items, loading, error, retry } = useListing('/properties', LIST_PARAMS);
  const [type, setType] = useState('');
  const [viewing, setViewing] = useState(null);
  const filtered = useMemo(() => items.filter((p) => p.active !== false && (!type || p.type === type)), [items, type]);

  return (
    <>
      <Seo route="/properties-for-sale" />
      <PageHero eyebrow={t('propertyEyebrow')} title={t('propertyTitle')} lede={t('propertyLede')} />
      <Container size="wide" className="py-10 lg:py-14">
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label={t('propertyType')}>
          {TYPES.map((option) => (
            <Chip key={option.id || 'all'} selected={type === option.id} onClick={() => setType(option.id)}>{t(option.label)}</Chip>
          ))}
        </div>
        {error ? (
          <ErrorState what={t('whatProperties')} onRetry={retry} />
        ) : loading ? (
          <GridSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState title={t('propertyEmptyTitle')} text={t('propertyEmptyText')}>
            <Button href={`mailto:hello@exploringwatamu.com?subject=${encodeURIComponent(t('propertySubject'))}`}>{t('tellUs')}</Button>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p, i) => {
              const title = pickText(p, 'title', locale, p.name);
              const description = pickText(p, 'description', locale);
              return (
                <ListingCard
                  key={p._id}
                  images={p.pictures}
                  art={ART_CYCLE[i % ART_CYCLE.length]}
                  title={title.text}
                  titleLang={title.lang}
                  badge={p.type ? <Badge tone="glass" className="capitalize">{TYPE_LABEL[p.type] ? t(TYPE_LABEL[p.type]) : p.type}</Badge> : null}
                  meta={[p.location && { icon: MapPin, text: p.location }]}
                  description={description.text}
                  descriptionLang={description.lang}
                  price={p.price != null ? { amount: p.price, prefix: t('asking'), unit: '' } : null}
                  actions={<Button size="sm" onClick={() => setViewing(p)}><CalendarCheck /> {t('bookViewing')}</Button>}
                />
              );
            })}
          </div>
        )}
      </Container>
      <ViewingSheet property={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
