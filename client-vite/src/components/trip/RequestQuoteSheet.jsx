import { useState } from 'react';
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

const COUNTRIES = ['Kenya', 'United Kingdom', 'Germany', 'Italy', 'United States', 'Netherlands', 'France', 'Switzerland', 'Uganda', 'Tanzania'];

function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ocean-900">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ocean-900/50">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-coral-600">{error}</span>}
    </label>
  );
}

const inputCls = 'h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-ocean-900 placeholder:text-ocean-900/35 focus:border-ocean-900';

/** Contact details + send. Guests welcome; signed-in travellers are pre-filled. */
export default function RequestQuoteSheet({ open, onOpenChange, residency }) {
  const { user, token } = useAuth() || {};
  const { trip, markRequested } = useTrip();
  const { profile } = useVibeProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', country: '', website: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Please tell us your name';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = 'Please enter a valid email address';
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
          if (i.path === 'contact.name') fieldErrs.name = i.message;
          else if (i.path === 'contact.email') fieldErrs.email = i.message;
        });
        setErrors(fieldErrs);
        setFailure(Object.keys(fieldErrs).length ? '' : issues[0].message);
      } else if (err?.response?.status === 429) {
        setFailure('Too many requests from this connection. Please try again in a few minutes.');
      } else {
        setFailure('We couldn’t send your request. Check your connection and try again — your trip is saved.');
      }
    }
    setSending(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Request my quote" description={`${itemCount(trip)} items · ${trip.days.length} days · ${trip.adults + trip.children} travellers`}>
      <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4 px-6 py-4">
          <p className="text-sm text-ocean-900/65">Our local team checks availability and emails your personal quote. Nothing to pay now.</p>
          <Field label="Your name" error={errors.name}>
            <input className={inputCls} value={form.name} onChange={set('name')} autoComplete="name" required />
          </Field>
          <Field label="Email" error={errors.email} hint="We’ll send your quote here">
            <input className={inputCls} type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
          </Field>
          <Field label="Phone or WhatsApp (optional)" hint="Include the country code, e.g. +44…">
            <input className={inputCls} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
          </Field>
          <Field label="Where are you travelling from? (optional)">
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
              Website
              <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
            </label>
          </div>
          {failure && <p className="rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-700">{failure}</p>}
        </div>
        <div className="sticky bottom-0 space-y-3 border-t border-sand-200 bg-sand-50 px-6 py-5">
          <Button type="submit" size="lg" className="w-full" disabled={sending}>
            {sending ? 'Sending…' : (<><Send /> Send my trip</>)}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-ocean-900/55">
            <ShieldCheck className="size-3.5 text-lagoon-600" /> We only use your details to plan this trip.
          </p>
        </div>
      </form>
    </Sheet>
  );
}
