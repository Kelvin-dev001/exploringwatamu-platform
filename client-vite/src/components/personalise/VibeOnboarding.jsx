import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useVibeProfile } from '@/context/VibeProfileContext';
import { VIBES, COMPANIONS, STAYS, MAX_VIBES, personalHeadline } from '@/lib/vibes';
import { Button } from '@/components/ui/button';
import { WaveField, Rosette } from '@/components/brand/Patterns';
import { BrandBadge } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'vibes', eyebrow: 'Step 1 of 3', title: "What's your Watamu?", hint: `Pick up to ${MAX_VIBES}. We'll put the best matches first.` },
  { key: 'companions', eyebrow: 'Step 2 of 3', title: "Who's coming along?", hint: 'So we suggest the right pace and places.' },
  { key: 'stay', eyebrow: 'Step 3 of 3', title: 'How long will you stay?', hint: 'A rough idea is fine — you can change it any time.' },
];

const EMPTY = { vibes: [], companions: null, stay: null };

/** One selectable tile. Large tap target, works as radio or checkbox. */
function OptionTile({ selected, onClick, icon: Icon, label, blurb, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5',
        selected
          ? 'border-coral-400 bg-sand-50 text-ocean-900 shadow-lift'
          : 'border-sand-50/15 bg-sand-50/[0.04] text-sand-50 hover:border-sand-50/40 hover:bg-sand-50/[0.08]',
        disabled && 'opacity-40'
      )}
    >
      {Icon && (
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-full transition-colors',
            selected ? 'bg-coral-500 text-white' : 'bg-lagoon-500/15 text-lagoon-300'
          )}
        >
          <Icon className="size-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg leading-tight sm:text-xl">{label}</span>
        {blurb && (
          <span className={cn('mt-1 block text-sm leading-snug', selected ? 'text-ocean-900/65' : 'text-sand-50/60')}>{blurb}</span>
        )}
      </span>
      <span
        className={cn(
          'mt-1 grid size-6 shrink-0 place-items-center rounded-full border transition-all',
          selected ? 'border-coral-500 bg-coral-500 text-white' : 'border-sand-50/30'
        )}
      >
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

export default function VibeOnboarding() {
  const { onboardingOpen, profile, saveProfile, skip, clearProfile } = useVibeProfile();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(EMPTY);
  const editing = Boolean(profile);

  // Fresh start (or prefilled when editing) each time it opens.
  useEffect(() => {
    if (onboardingOpen) {
      setStep(0);
      setDraft(profile ? { ...EMPTY, ...profile } : EMPTY);
    }
  }, [onboardingOpen, profile]);

  const toggleVibe = (id) =>
    setDraft((d) => {
      const has = d.vibes.includes(id);
      if (has) return { ...d, vibes: d.vibes.filter((v) => v !== id) };
      if (d.vibes.length >= MAX_VIBES) return d;
      return { ...d, vibes: [...d.vibes, id] };
    });

  const current = STEPS[step];
  const canContinue =
    (current.key === 'vibes' && draft.vibes.length > 0) ||
    (current.key === 'companions' && draft.companions) ||
    (current.key === 'stay' && draft.stay);
  const isLast = step === STEPS.length - 1;

  const next = () => (isLast ? saveProfile(draft) : setStep((s) => s + 1));
  const preview = personalHeadline(draft);

  return (
    <Dialog.Root open={onboardingOpen} onOpenChange={(open) => !open && skip()}>
      <Dialog.Portal>
        <Dialog.Content
          className="fixed inset-0 z-[60] overflow-y-auto bg-ocean-900 text-sand-50 focus:outline-none data-[state=open]:animate-[fade-in_.4s_ease-out]"
          aria-describedby="vibe-onboarding-hint"
        >
          {/* Atmosphere: tide lines and a carved rosette */}
          <WaveField className="pointer-events-none fixed inset-0 text-ocean-700/60" rows={8} gap={18} />
          <Rosette className="pointer-events-none fixed -right-24 -top-24 hidden text-ocean-600/60 lg:block" size={420} strokeWidth={0.8} />

          <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3">
                <BrandBadge priority className="size-12 ring-2 ring-sand-50/10" />
                <span className="flex flex-col leading-none">
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.32em] text-lagoon-300">Exploring</span>
                  <span className="font-display text-xl font-semibold">Watamu</span>
                </span>
              </span>
              <button
                type="button"
                onClick={skip}
                className="text-sm font-semibold text-sand-50/70 underline decoration-sand-50/30 underline-offset-4 transition hover:text-sand-50 hover:decoration-coral-400"
              >
                {editing ? 'Close' : 'Just let me browse'}
              </button>
            </div>

            <div className="grid flex-1 gap-10 py-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16 lg:py-16">
              {/* Left: the question */}
              <div>
                <div className="mb-6 flex gap-1.5" aria-hidden="true">
                  {STEPS.map((s, i) => (
                    <span
                      key={s.key}
                      className={cn('h-1 rounded-full transition-all duration-500', i <= step ? 'w-10 bg-coral-400' : 'w-5 bg-sand-50/20')}
                    />
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.key}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="eyebrow !text-coral-300">{current.eyebrow}</p>
                    <Dialog.Title className="mt-3 font-display text-4xl leading-[1.04] sm:text-5xl lg:text-6xl">
                      {current.title}
                    </Dialog.Title>
                    <p id="vibe-onboarding-hint" className="mt-4 max-w-md text-lg text-sand-50/70">
                      {current.hint}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Live preview of their personal headline */}
                {preview && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 hidden max-w-md rounded-2xl border border-sand-50/10 bg-sand-50/[0.05] p-5 lg:block"
                  >
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sand-50/50">
                      <Sparkles className="size-3.5 text-ochre-300" /> Your Watamu so far
                    </p>
                    <p className="mt-2 font-display text-2xl italic leading-snug text-sand-50">{preview}</p>
                  </motion.div>
                )}
              </div>

              {/* Right: the options */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.key}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {current.key === 'vibes' &&
                    VIBES.map((v) => {
                      const selected = draft.vibes.includes(v.id);
                      return (
                        <OptionTile
                          key={v.id}
                          {...v}
                          selected={selected}
                          disabled={!selected && draft.vibes.length >= MAX_VIBES}
                          onClick={() => toggleVibe(v.id)}
                        />
                      );
                    })}
                  {current.key === 'companions' &&
                    COMPANIONS.map((c) => (
                      <OptionTile
                        key={c.id}
                        {...c}
                        selected={draft.companions === c.id}
                        onClick={() => setDraft((d) => ({ ...d, companions: c.id }))}
                      />
                    ))}
                  {current.key === 'stay' &&
                    STAYS.map((s) => (
                      <OptionTile
                        key={s.id}
                        label={s.label}
                        blurb={s.blurb}
                        selected={draft.stay === s.id}
                        onClick={() => setDraft((d) => ({ ...d, stay: s.id }))}
                      />
                    ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom bar */}
            <div className="sticky bottom-0 -mx-5 flex items-center justify-between gap-3 border-t border-sand-50/10 bg-ocean-900/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
              <div className="flex items-center gap-2">
                {step > 0 ? (
                  <Button variant="ghost" className="text-sand-50 hover:bg-sand-50/10" onClick={() => setStep((s) => s - 1)}>
                    <ArrowLeft /> Back
                  </Button>
                ) : editing ? (
                  <Button variant="ghost" className="text-sand-50/70 hover:bg-sand-50/10" onClick={clearProfile}>
                    Clear my preferences
                  </Button>
                ) : (
                  <span />
                )}
              </div>
              <Button size="lg" onClick={next} disabled={!canContinue}>
                {isLast ? (editing ? 'Update my Watamu' : 'Show me my Watamu') : 'Continue'} <ArrowRight />
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
