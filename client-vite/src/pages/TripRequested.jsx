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
import { useI18n } from '@/i18n';
import messages from '@/locales/planner';

// Only promise an email when the API says it can send one (delivery.email);
// while email isn't set up, the quote is shown in My bookings instead.
// title/text are message keys.
const nextSteps = (emailed) => [
  emailed ? { icon: MailCheck, title: 'stepInbox', text: 'stepInboxText' } : { icon: MailCheck, title: 'stepKeep', text: 'stepKeepText' },
  { icon: Search, title: 'stepCheck', text: 'stepCheckText' },
  { icon: FileText, title: 'stepQuote', text: emailed ? 'stepQuoteEmail' : 'stepQuoteAccount' },
];

export default function TripRequested() {
  const { t, rich } = useI18n(messages);
  const { reference } = useParams();
  const { state } = useLocation();
  const { user } = useAuth() || {};
  const emailed = state?.request?.delivery?.email === true;
  const NEXT = nextSteps(emailed);

  return (
    <>
      <Seo title={t('sentSeo', { reference })} noindex />
      <section className="relative overflow-hidden bg-ocean-900 text-sand-50">
        <WaveField className="absolute inset-0 text-ocean-800" rows={8} gap={18} />
        <Container size="narrow" className="relative py-16 text-center lg:py-24">
          <m.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <BrandBadge priority className="mx-auto size-24 ring-4 ring-ocean-800" />
          </m.div>
          <p className="eyebrow mt-8 !text-lagoon-300">{t('sentEyebrow')}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{t('sentTitle')}</h1>
          <p className="mt-4 text-lg text-sand-50/70">
            {state?.email
              ? rich(emailed ? 'sentEmailed' : 'sentWillReply', { b: (text) => <strong className="text-sand-50">{text}</strong> }, { email: state.email })
              : t('sentSoon')}
          </p>
          <div className="mx-auto mt-8 inline-flex flex-col items-center rounded-2xl border border-sand-50/15 bg-sand-50/[0.06] px-8 py-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-sand-50/60">{t('yourReference')}</span>
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
              <h2 className="mt-4 font-display text-2xl text-ocean-900">{t(s.title)}</h2>
              <p className="mt-2 text-ocean-900/65">{t(s.text)}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Button to="/trip" variant="outline" size="lg">
            {t('backToTrip')}
          </Button>
          <Button to="/experiences" size="lg">
            {t('keepExploring')} <ArrowRight />
          </Button>
          <WhatsAppButton size="lg" message={referenceMessage(reference)}>
            {t('questionsWhatsApp')}
          </WhatsAppButton>
        </div>
        <p className="mt-8 text-center text-sm text-ocean-900/60">
          <CheckCircle2 className="mr-1 inline size-4 text-lagoon-600" />
          {user
            ? rich('trackIt', { link: (text) => <Link to="/my-trips" className="font-semibold underline">{text}</Link> })
            : rich('createToTrack', { link: (text) => <Link to="/register" className="font-semibold underline">{text}</Link> })}
        </p>
      </Container>
    </>
  );
}
