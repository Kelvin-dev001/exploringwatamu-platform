import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useVibeProfile } from '@/context/VibeProfileContext';
import { personalHeadline, byId, VIBES } from '@/lib/vibes';
import { Container, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { DoorFrame, Rosette, WaveField, Weave } from '@/components/brand/Patterns';
import { BrandBadge } from '@/components/brand/Logo';

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

/** "A doorway to the sea" — an illustrated stand-in until photography arrives. */
function DoorwayArt() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
      <Weave className="absolute -left-6 top-10 h-40 w-40 text-sand-300" />
      <DoorFrame className="absolute inset-0 bg-ocean-900 shadow-lift">
        <div className="absolute inset-x-0 top-0 h-[52%] bg-gradient-to-b from-ocean-900 via-ocean-700 to-ocean-600" />
        <div className="absolute inset-x-0 top-[36%] mx-auto size-28 rounded-full bg-coral-500 shadow-[0_0_60px_10px_rgb(224_108_49/0.35)] sm:size-32" />
        <div className="absolute inset-x-0 top-[50%] h-[6%] bg-ochre-500" />
        <div className="absolute inset-x-0 bottom-0 top-[56%] bg-lagoon-600">
          <WaveField className="text-lagoon-300/60" rows={7} gap={16} amplitude={5} />
        </div>
        <Rosette className="absolute left-1/2 top-[10%] -translate-x-1/2 text-ocean-500/80" size={92} />
        <div className="absolute inset-3 rounded-t-[999px] rounded-b-[calc(var(--radius-card)-6px)] border border-sand-50/15" />
      </DoorFrame>
      <BrandBadge className="absolute -left-4 top-6 size-24 rotate-[-10deg] ring-4 ring-sand-50 sm:-left-8 sm:size-28" />
      <div className="absolute -bottom-5 -right-3 rotate-[-3deg] rounded-2xl bg-white px-4 py-3 shadow-lift sm:-right-8">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ocean-900/50">Watamu, Kenya</p>
        <p className="font-display text-lg italic text-ocean-900">Where the tide sets the plan</p>
      </div>
    </div>
  );
}

export default function PersonalHero() {
  const { profile, openOnboarding } = useVibeProfile();
  const headline = personalHeadline(profile);

  return (
    <section className="grain relative overflow-hidden">
      <Container size="wide" className="grid items-center gap-14 pb-20 pt-10 lg:grid-cols-[1.15fr_1fr] lg:pb-28 lg:pt-16">
        <div>
          <motion.p variants={rise} initial="hidden" animate="show" className="eyebrow">
            {headline ? 'Your Watamu' : 'Watamu, Kenya · Personalised trips'}
          </motion.p>

          <motion.h1
            key={headline || 'default'}
            variants={rise}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-4 font-display text-[2.6rem] leading-[1.02] text-ocean-900 sm:text-6xl lg:text-[4.6rem]"
          >
            {headline || (
              <>
                Watamu, the way <em className="text-coral-500">you</em> like it.
              </>
            )}
          </motion.h1>

          <motion.p variants={rise} initial="hidden" animate="show" custom={2} className="mt-6 max-w-xl text-lg leading-relaxed text-ocean-900/70 sm:text-xl">
            {headline
              ? 'Pick the experiences that fit, tell us your dates, and our local team prices the whole trip for you.'
              : 'Reef, creek, forest and old Swahili towns. Tell us how you like to travel and we’ll shape the coast around you.'}
          </motion.p>

          {profile && (
            <motion.div variants={rise} initial="hidden" animate="show" custom={3} className="mt-6 flex flex-wrap gap-2">
              {profile.vibes.map((id) => {
                const v = byId(VIBES, id);
                return v ? (
                  <Badge key={id} tone="glass" className="border border-sand-200">
                    <v.icon className="text-coral-500" /> {v.label}
                  </Badge>
                ) : null;
              })}
            </motion.div>
          )}

          <motion.div variants={rise} initial="hidden" animate="show" custom={4} className="mt-9 flex flex-wrap items-center gap-3">
            <Button to="/experiences" size="lg">
              {headline ? 'See my experiences' : 'Browse experiences'} <ArrowRight />
            </Button>
            {headline ? (
              <Button variant="link" onClick={openOnboarding}>
                Change my preferences
              </Button>
            ) : (
              <Button variant="outline" size="lg" onClick={openOnboarding}>
                <Sparkles /> Personalise my Watamu
              </Button>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <DoorwayArt />
        </motion.div>
      </Container>
    </section>
  );
}
