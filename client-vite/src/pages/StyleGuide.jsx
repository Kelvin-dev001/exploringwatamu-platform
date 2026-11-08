import { useState } from 'react';
import { ArrowRight, Clock, Sparkles, Star, Plus, MapPin } from 'lucide-react';
import { Container, SectionHeading, Badge, Chip, Card } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { ArchBand, ChainBand, WaveField, Weave, Rosette, DoorFrame } from '@/components/brand/Patterns';
import { Logo, BrandBadge } from '@/components/brand/Logo';
import ProfilePill from '@/components/personalise/ProfilePill';
import { useVibeProfile } from '@/context/VibeProfileContext';
import { VIBES } from '@/lib/vibes';

/*
 * Living design-system reference at /style-guide. Not linked from the nav;
 * used to approve the look and as a reference while building Phases 2–5.
 */
const PALETTE = [
  { name: 'Sand', note: 'Space & surfaces', shades: ['50', '100', '200', '300', '400', '500'], key: 'sand' },
  { name: 'Ocean', note: 'Ink & deep sections', shades: ['100', '300', '500', '700', '900', '950'], key: 'ocean' },
  { name: 'Lagoon', note: 'Turquoise ring & shallows', shades: ['50', '100', '300', '500', '600', '700'], key: 'lagoon' },
  { name: 'Coral', note: 'Sunset · action & highlight', shades: ['50', '100', '200', '400', '500', '700'], key: 'coral' },
  { name: 'Mangrove', note: 'Nature & calm', shades: ['50', '100', '300', '500', '700'], key: 'mangrove' },
  { name: 'Ochre', note: 'Golden sand · ratings', shades: ['100', '300', '500', '700'], key: 'ochre' },
];

function Block({ eyebrow, title, children }) {
  return (
    <section className="border-t border-sand-200 py-16">
      <Container size="wide">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="mt-10">{children}</div>
      </Container>
    </section>
  );
}

/** Preview of the Phase 2 product card, using placeholder art instead of photos. */
function SampleExperienceCard({ vibe, title, duration, from, match }) {
  const v = VIBES.find((x) => x.id === vibe);
  return (
    <Card interactive className="group flex flex-col">
      <DoorFrame className="relative m-3 mb-0 aspect-[4/3] !rounded-t-[1rem] bg-ocean-800">
        <WaveField className="text-ocean-600" rows={8} gap={16} />
        <div className="absolute left-1/2 top-1/3 size-14 -translate-x-1/2 rounded-full bg-coral-500/90" />
        <div className="absolute left-3 top-3 flex gap-2">
          {match && (
            <Badge tone="coral">
              <Sparkles /> Great match
            </Badge>
          )}
        </div>
      </DoorFrame>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-sm text-ocean-900/55">
          <span className="inline-flex items-center gap-1">
            <v.icon className="size-4 text-coral-500" /> {v.label}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-4" /> {duration}
          </span>
        </div>
        <h3 className="mt-2 font-display text-2xl leading-tight text-ocean-900">{title}</h3>
        <div className="mt-auto flex items-end justify-between pt-6">
          <p className="text-sm text-ocean-900/55">
            from <span className="block font-display text-2xl text-ocean-900">{from}</span>
          </p>
          <Button size="sm">
            <Plus /> Add to my trip
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function StyleGuide() {
  const [chips, setChips] = useState(['ocean']);
  const [sheet, setSheet] = useState(false);
  const { openOnboarding } = useVibeProfile();

  return (
    <div className="pb-10">
      <Container size="wide" className="py-16">
        <BrandBadge priority className="mb-8 size-32" />
        <p className="eyebrow">Design system · Phase 1</p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[1.02] text-ocean-900 sm:text-7xl">
          Warm Swahili-coast <em className="text-coral-500">editorial</em>
        </h1>
        <p className="mt-6 max-w-2xl text-xl text-ocean-900/70">
          Every colour comes from the badge: cream sky, navy dhow, lagoon turquoise, golden sand and the setting sun. Big serif type does the work photography will
          do later, and original carved-door patterns give the site its own texture.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={openOnboarding}>
            Preview the first-visit question <ArrowRight />
          </Button>
          <Button variant="outline" onClick={() => setSheet(true)}>
            Open a sheet
          </Button>
        </div>
      </Container>

      <Block eyebrow="01 · Colour" title="Palette">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {PALETTE.map((p) => (
            <div key={p.key}>
              <p className="font-display text-2xl text-ocean-900">{p.name}</p>
              <p className="text-sm text-ocean-900/55">{p.note}</p>
              <div className="mt-3 flex overflow-hidden rounded-2xl border border-sand-200">
                {p.shades.map((s) => (
                  <div key={s} className="h-20 flex-1" style={{ background: `var(--color-${p.key}-${s})` }} title={`${p.key}-${s}`}>
                    <span className="m-1.5 inline-block rounded bg-white/80 px-1 text-[0.6rem] font-bold text-ocean-900">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block eyebrow="02 · Type" title="Fraunces + Plus Jakarta Sans">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="font-display text-7xl leading-none text-ocean-900">Aa</p>
            <p className="font-display text-5xl leading-tight text-ocean-900">Display · Where the tide sets the plan</p>
            <p className="font-display text-3xl italic text-ocean-900">Italic accents for warmth</p>
            <p className="font-display text-2xl text-ocean-900">Card title · Sunset dhow on Mida Creek</p>
          </div>
          <div className="space-y-4">
            <p className="eyebrow">Eyebrow label</p>
            <p className="text-xl leading-relaxed text-ocean-900/75">
              Lede — Reef, creek, forest and old Swahili towns. Tell us how you like to travel and we’ll shape the
              coast around you.
            </p>
            <p className="leading-relaxed text-ocean-900/70">
              Body — Plus Jakarta Sans keeps prices, dates and forms crisp and readable at small sizes, on every
              screen. It pairs with the serif without competing.
            </p>
            <p className="text-sm text-ocean-900/55">Small print · No payment until you confirm</p>
          </div>
        </div>
      </Block>

      <Block eyebrow="03 · Pattern" title="Original coastal motifs">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <p className="font-semibold">Arch band</p>
            <ArchBand className="mt-4 text-ocean-500" height={22} />
            <p className="mt-6 font-semibold">Chain band</p>
            <ChainBand className="mt-4 text-coral-400" />
          </Card>
          <Card className="relative h-56 overflow-hidden bg-ocean-900 p-6 text-sand-50">
            <WaveField className="absolute inset-0 text-ocean-700" rows={8} gap={18} />
            <p className="relative font-semibold">Wave field</p>
          </Card>
          <Card className="relative grid h-56 place-items-center overflow-hidden p-6">
            <Weave className="absolute inset-0 text-sand-200" />
            <Rosette className="relative text-coral-500" size={140} />
          </Card>
        </div>
      </Block>

      <Block eyebrow="04 · Components" title="Buttons, chips and badges">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Request my quote</Button>
            <Button variant="ocean">Sign in</Button>
            <Button variant="outline">All experiences</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="link">Change my preferences</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">
              Large <ArrowRight />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <Chip
                key={v.id}
                icon={v.icon}
                selected={chips.includes(v.id)}
                onClick={() => setChips((c) => (c.includes(v.id) ? c.filter((x) => x !== v.id) : [...c, v.id]))}
              >
                {v.label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Half day</Badge>
            <Badge tone="coral">
              <Sparkles /> Great match
            </Badge>
            <Badge tone="mangrove">Family friendly</Badge>
            <Badge tone="ochre">
              <Star /> 4.9
            </Badge>
            <Badge tone="ocean">
              <MapPin /> Mida Creek
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ProfilePill />
            <ProfilePill compact />
            <Logo />
          </div>
        </div>
      </Block>

      <Block eyebrow="05 · Preview" title="Experience cards (Phase 2)">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SampleExperienceCard vibe="ocean" title="Marine park snorkel & sandbank lunch" duration="Half day" from="$45" match />
          <SampleExperienceCard vibe="romance" title="Sunset dhow on Mida Creek" duration="3 hours" from="$60" />
          <SampleExperienceCard vibe="culture" title="Gede Ruins & Swahili food walk" duration="Full day" from="$55" />
        </div>
        <p className="mt-4 text-sm text-ocean-900/50">Sample content and prices for layout only.</p>
      </Block>

      <Sheet open={sheet} onOpenChange={setSheet} title="My Watamu trip" description="Phase 3 puts the itinerary here.">
        <div className="px-6 py-4 text-ocean-900/70">Sheets slide in from the right on desktop, or up from the bottom on phones.</div>
      </Sheet>
    </div>
  );
}
