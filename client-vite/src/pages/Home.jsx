import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight, Compass, Users, BedDouble, Plane, CarFront, Sparkles, Home as HomeIcon, MousePointerClick, CalendarDays, MessageSquareQuote } from 'lucide-react';
import { useFirstVisitPrompt } from '@/context/VibeProfileContext';
import PersonalHero from '@/components/home/PersonalHero';
import { Container, SectionHeading } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { ArchBand, ChainBand, WaveField, Weave, Rosette } from '@/components/brand/Patterns';
import { cn } from '@/lib/utils';

/*
 * Interim homepage for Phase 1: personal hero + editorial ways-in.
 * Phase 2 replaces the category grid with matched experiences and
 * ready-made itineraries.
 */
const WAYS_IN = [
  {
    to: '/tours',
    title: 'Experiences',
    desc: 'Marine park snorkelling, Mida Creek, Gede Ruins, forest walks and more.',
    icon: Compass,
    span: 'md:col-span-2 md:row-span-2',
    tone: 'bg-ocean-900 text-sand-50',
    art: <WaveField className="text-ocean-700" rows={10} gap={18} />,
    big: true,
  },
  {
    to: '/group-trips',
    title: 'Group trips',
    desc: 'Join scheduled adventures with other travellers.',
    icon: Users,
    span: 'md:row-span-2',
    tone: 'bg-coral-500 text-white',
    art: <Rosette className="absolute -bottom-10 -right-10 text-coral-400" size={220} />,
    big: true,
  },
  { to: '/hotels', title: 'Stays', desc: 'Hotels, villas and beach houses.', icon: BedDouble, tone: 'bg-white', art: <Weave className="text-sand-200" /> },
  { to: '/transfers', title: 'Transfers', desc: 'Airport and hotel pick-ups.', icon: Plane, tone: 'bg-sand-200/70', art: null },
  { to: '/carhire', title: 'Car hire', desc: 'Explore the coast at your pace.', icon: CarFront, tone: 'bg-mangrove-100', art: null },
  { to: '/services', title: 'Local services', desc: 'Chefs, guides, wellness.', icon: Sparkles, tone: 'bg-ochre-100', art: null },
  {
    to: '/properties-for-sale',
    title: 'Property for sale',
    desc: 'Make Watamu home.',
    icon: HomeIcon,
    span: 'md:col-span-2',
    tone: 'bg-white',
    art: <ChainBand className="absolute inset-x-0 bottom-0 text-sand-300" />,
  },
];

const HOW = [
  { icon: MousePointerClick, title: 'Pick what you love', text: 'Browse experiences, stays and transfers made for how you travel.' },
  { icon: CalendarDays, title: 'Tell us your dates', text: 'Share when you’re coming and who’s with you.' },
  { icon: MessageSquareQuote, title: 'Get a tailored price', text: 'Our local team confirms availability and emails your quote. No payment until you say yes.' },
];

function WayInCard({ item, index }) {
  const Icon = item.icon;
  const dark = item.tone.includes('ocean-900') || item.tone.includes('coral-500');
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.3 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={item.span}
    >
      <Link
        to={item.to}
        className={cn(
          'group relative flex h-full min-h-44 flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-sand-200 p-6 transition-all duration-300 ease-[var(--ease-tide)] hover:-translate-y-1 hover:shadow-lift',
          item.big && 'min-h-72 p-8',
          item.tone
        )}
      >
        {item.art && <div className="pointer-events-none absolute inset-0">{item.art}</div>}
        <div className="relative flex items-start justify-between">
          <span className={cn('grid size-12 place-items-center rounded-full', dark ? 'bg-white/15' : 'bg-ocean-900 text-sand-50')}>
            <Icon className="size-5" />
          </span>
          <ArrowUpRight className={cn('size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5', dark ? 'text-white/70' : 'text-coral-500')} />
        </div>
        <div className="relative mt-8">
          <h3 className={cn('font-display leading-tight', item.big ? 'text-4xl lg:text-5xl' : 'text-2xl')}>{item.title}</h3>
          <p className={cn('mt-2 max-w-sm', dark ? 'text-white/75' : 'text-ocean-900/65', item.big && 'text-lg')}>{item.desc}</p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Home() {
  useFirstVisitPrompt();

  return (
    <>
      <PersonalHero />

      <ArchBand className="text-sand-300" />

      <section className="bg-sand-100 py-20 lg:py-28">
        <Container size="wide">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Ways in"
              title="Everything Watamu, in one place"
              lede="Start with an experience, a stay or a group trip — we’ll help you fit the rest around it."
            />
            <Button to="/tours" variant="outline" className="self-start md:self-auto">
              All experiences <ArrowUpRight />
            </Button>
          </div>
          <div className="mt-12 grid auto-rows-fr gap-4 md:grid-cols-4">
            {WAYS_IN.map((item, i) => (
              <WayInCard key={item.to} item={item} index={i} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container size="wide" className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <SectionHeading eyebrow="How it works" title="Your trip, priced by people who live here" />
          <ol className="grid gap-8 sm:grid-cols-3">
            {HOW.map((step, i) => (
              <li key={step.title} className="relative">
                <span className="font-display text-6xl italic text-coral-200">{String(i + 1).padStart(2, '0')}</span>
                <step.icon className="mt-4 size-6 text-ocean-500" />
                <h3 className="mt-3 font-display text-2xl text-ocean-900">{step.title}</h3>
                <p className="mt-2 text-ocean-900/65">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  );
}
