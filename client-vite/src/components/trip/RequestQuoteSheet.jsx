import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, ShieldCheck } from 'lucide-react';
import { API_URL } from '@/api.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { useTrip } from '@/context/TripContext';
import { useVibeProfile } from '@/context/VibeProfileContext';
import { toRequestPayload, itemCount } from '@/lib/trip';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlowNotice } from '@/components/listing/States';
import { useI18n } from '@/i18n';
import messages from '@/locales/planner';
import catalogText from '@/locales/catalog';
import { translate } from '@/i18n';

const COUNTRIES = ['Kenya', 'United Kingdom', 'Germany', 'Italy', 'United States', 'Netherlands', 'France', 'Switzerland', 'Uganda', 'Tanzania'];

function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ocean-900">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ocean-900/60">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-coral-600">{error}</span>}
    </label>
  );
}

const inputCls = 'h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-ocean-900 placeholder:text-ocean-900/45 focus:border-ocean-900';

/** Contact details + send. Guests welcome; signed-in travellers are pre-filled. */
export default function RequestQuoteSheet({ open, onOpenChange, residency }) {
  const { t, locale } = useI18n(messages);
  const tc = (key, vars) => translate(catalogText, locale, key, vars);
  // The API answers in English: keep its words on the English site, ours elsewhere.
  const apiText = (message, fallback) => (locale === 'en' && message ? message : t(fallback));
  const { user, token } = useAuth() || {};
  const { trip, markRequested } = useTrip();
  const { profile } = useVibeProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', country: '', website: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // The session can finish loading after the planner mounts: fill in what's still empty.
  useEffect(() => {
    if (open && user) setForm((f) => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }));
  }, [open, user]);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = t('nameError');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = t('emailError');
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    setFailure('');
    try {
      const payload = toRequestPayload(trip, {
        contact: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), country: form.country.trim() },
        profile,
        residency,
        website: form.website,
      });
      const res = await axios.post(`${API_URL}/trip-requests`, payload, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      markRequested(res.data.reference);
      onOpenChange(false);
      navigate(`/trip/sent/${res.data.reference}`, { state: { request: res.data, email: form.email.trim() } });
    } catch (err) {
      const issues = err?.response?.data?.issues;
      if (issues?.length) {
        const fieldErrs = {};
        issues.forEach((i) => {
          if (i.path === 'contact.name') fieldErrs.name = apiText(i.message, 'nameError');
          else if (i.path === 'contact.email') fieldErrs.email = apiText(i.message, 'emailError');
        });
        setErrors(fieldErrs);
        setFailure(Object.keys(fieldErrs).length ? '' : apiText(issues[0].message, 'sendFailedCheck'));
      } else if (err?.response?.status === 429) {
        setFailure(t('tooMany'));
      } else {
        setFailure(t('sendFailed'));
      }
    }
    setSending(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('quoteTitle')}
      description={t('tripFacts', { items: t('items', { count: itemCount(trip) }), days: tc('days', { count: trip.days.length }), travellers: t('travellersCount', { count: trip.adults + trip.children }) })}
    >
      <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4 px-6 py-4">
          <p className="text-sm text-ocean-900/65">{t('quoteIntro')}</p>
          <Field label={t('yourName')} error={errors.name}>
            <input className={inputCls} value={form.name} onChange={set('name')} autoComplete="name" required />
          </Field>
          <Field label={t('email')} error={errors.email} hint={t('emailHint')}>
            <input className={inputCls} type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
          </Field>
          <Field label={t('phone')} hint={t('phoneHint')}>
            <input className={inputCls} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
          </Field>
          <Field label={t('country')}>
            <input className={inputCls} list="ew-countries" value={form.country} onChange={set('country')} autoComplete="country-name" />
            <datalist id="ew-countries">
              {COUNTRIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          {/* Honeypot: hidden from people, tempting to bots */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              {t('honeypot')}
              <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
            </label>
          </div>
          {failure && <p className="rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-700">{failure}</p>}
          {sending && <SlowNotice />}
        </div>
        <div className="sticky bottom-0 space-y-3 border-t border-sand-200 bg-sand-50 px-6 py-5">
          <Button type="submit" size="lg" className="w-full" disabled={sending}>
            {sending ? t('sendingDots') : (<><Send /> {t('sendTrip')}</>)}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-ocean-900/60">
            <ShieldCheck className="size-3.5 text-lagoon-600" /> {t('privacy')}
          </p>
        </div>
      </form>
    </Sheet>
  );
}
