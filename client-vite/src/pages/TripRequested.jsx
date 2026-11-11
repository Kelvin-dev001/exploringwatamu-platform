import { Link, useLocation, useParams } from 'react-router-dom';
import { m } from 'motion/react';
import { CheckCircle2, MailCheck, Search, FileText, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { BrandBadge } from '@/components/brand/Logo';
import { WaveField } from '@/components/brand/Patterns';
import { useAuth } from '@/context/AuthContext.jsx';
import Seo from '@/components/seo/Seo';
import { WhatsAppButton } from '@/components/contact/WhatsApp';
import { referenceMessage } from '@/lib/whatsapp';


// Only promise an email when the API says it can send one (delivery.email);
// while email isn't set up, the quote is shown in My bookings instead.
const nextSteps = (emailed) => [
  emailed
    ? { icon: MailCheck, title: 'Check your inbox', text: 'We’ve emailed a copy of your itinerary with your reference.' }
    : { icon: MailCheck, title: 'Keep your reference', text: 'Quote it whenever you contact us — it’s how we find your trip.' },
  { icon: Search, title: 'We check availability', text: 'Our local team confirms boats, guides and transfers for your dates.' },
  emailed
    ? { icon: FileText, title: 'Your quote arrives', text: 'A full price for the whole trip, by email. Reply to accept — nothing to pay until then.' }
    : { icon: FileText, title: 'Your quote arrives', text: 'A full price for the whole trip, in My bookings — or we’ll contact you directly. Nothing to pay until you accept.' },
];

export default function TripRequested() {
  const { reference } = useParams();
  const { state } = useLocation();
  const { user } = useAuth() || {};
  const emailed = state?.request?.delivery?.email === true;
  const NEXT = nextSteps(emailed);

  return (
    <>
      <Seo title={`Trip request ${reference}`} noindex />
      <section className="relative overflow-hidden bg-ocean-900 text-sand-50">
        <WaveField className="absolute inset-0 text-ocean-800" rows={8} gap={18} />
        <Container size="narrow" className="relative py-16 text-center lg:py-24">
          <m.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <BrandBadge priority className="mx-auto size-24 ring-4 ring-ocean-800" />
          </m.div>
          <p className="eyebrow mt-8 !text-lagoon-300">Request sent</p>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Asante! Your trip is with our team.</h1>
          <p className="mt-4 text-lg text-sand-50/70">
            {emailed && state?.email ? (
              <>A confirmation is on its way to <strong className="text-sand-50">{state.email}</strong>.</>
            ) : state?.email ? (
              <>Our local team will get back to you at <strong className="text-sand-50">{state.email}</strong>.</>
            ) : (
              'Our local team will be in touch soon.'
            )}
          </p>
          <div className="mx-auto mt-8 inline-flex flex-col items-center rounded-2xl border border-sand-50/15 bg-sand-50/[0.06] px-8 py-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-sand-50/60">Your reference</span>
            <span className="mt-1 font-mono text-3xl font-semibold tracking-wider text-sand-50">{reference}</span>
          </div>
        </Container>
      </section>

      <Container size="default" className="py-16">
        <ol className="grid gap-8 md:grid-cols-3">
          {NEXT.map((s, i) => (
            <li key={s.title} className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-lagoon-100 text-lagoon-700">
                  <s.icon className="size-5" />
                </span>
                <span className="font-display text-3xl italic text-coral-200">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h2 className="mt-4 font-display text-2xl text-ocean-900">{s.title}</h2>
              <p className="mt-2 text-ocean-900/65">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Button to="/trip" variant="outline" size="lg">
            Back to my trip
          </Button>
          <Button to="/experiences" size="lg">
            Keep exploring <ArrowRight />
          </Button>
          <WhatsAppButton size="lg" message={referenceMessage(reference)}>
            Questions? WhatsApp us
          </WhatsAppButton>
        </div>
        <p className="mt-8 text-center text-sm text-ocean-900/60">
          <CheckCircle2 className="mr-1 inline size-4 text-lagoon-600" />
          {user ? (
            <>Track it any time in <Link to="/my-trips" className="font-semibold underline">My bookings</Link>.</>
          ) : (
            <><Link to="/register" className="font-semibold underline">Create an account</Link> with the same email to track your requests.</>
          )}
        </p>
      </Container>
    </>
  );
}
