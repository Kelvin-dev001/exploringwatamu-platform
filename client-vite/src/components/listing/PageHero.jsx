import { Container } from '@/components/ui/primitives';
import { WaveField, Rosette } from '@/components/brand/Patterns';
import { cn } from '@/lib/utils';

/** Editorial page header used by every listing page. */
export default function PageHero({ eyebrow, title, lede, children, tone = 'sand' }) {
  const dark = tone === 'ocean';
  return (
    <section className={cn('relative overflow-hidden border-b', dark ? 'border-ocean-800 bg-ocean-900 text-sand-50' : 'grain border-sand-200')}>
      {dark ? (
        <WaveField className="absolute inset-0 text-ocean-800" rows={8} gap={18} />
      ) : (
        <Rosette className="pointer-events-none absolute -right-16 -top-20 hidden text-sand-200 md:block" size={300} strokeWidth={0.9} />
      )}
      <Container size="wide" className="relative pb-10 pt-12 lg:pb-14 lg:pt-16">
        {eyebrow && <p className={cn('eyebrow', dark && '!text-lagoon-300')}>{eyebrow}</p>}
        <h1 className={cn('mt-3 max-w-4xl font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl', !dark && 'text-ocean-900')}>{title}</h1>
        {lede && <p className={cn('mt-4 max-w-2xl text-lg', dark ? 'text-sand-50/70' : 'text-ocean-900/65')}>{lede}</p>}
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </section>
  );
}
