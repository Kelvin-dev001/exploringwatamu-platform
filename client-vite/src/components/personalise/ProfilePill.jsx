import { Pencil, Sparkles } from 'lucide-react';
import { useVibeProfile } from '@/context/VibeProfileContext';
import { profileSummary, byId, VIBES } from '@/lib/vibes';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import messages from '@/locales/personalise';

/**
 * "Your Watamu: Ocean · Two of us · 3–4 days ✎" — always in the header.
 * The only way back into the full-screen question after the first visit.
 */
export default function ProfilePill({ compact = false, className }) {
  const { t } = useI18n(messages);
  const { profile, openOnboarding } = useVibeProfile();
  const summary = profileSummary(profile);
  const FirstIcon = profile ? byId(VIBES, profile.vibes[0])?.icon : null;

  if (!summary) {
    return (
      <button
        type="button"
        onClick={openOnboarding}
        className={cn(
          'inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-dashed border-coral-400/70 bg-coral-50 px-3.5 py-2 text-sm font-semibold text-coral-700 transition hover:border-coral-500 hover:bg-coral-100',
          className
        )}
      >
        <Sparkles className="size-4" />
        {compact ? (
          t('pillCompact')
        ) : (
          <>
            <span className="2xl:hidden">{t('pillCompact')}</span>
            <span className="hidden 2xl:inline">{t('pillStart')}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openOnboarding}
      aria-label={t('pillLabel', { summary })}
      className={cn(
        'group inline-flex max-w-full items-center gap-2 rounded-full border border-sand-300 bg-white py-1.5 pl-1.5 pr-3.5 text-sm shadow-soft transition hover:border-ocean-900/40',
        className
      )}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ocean-900 text-lagoon-300">
        {FirstIcon ? <FirstIcon className="size-3.5" /> : <Sparkles className="size-3.5" />}
      </span>
      {!compact && <span className="hidden whitespace-nowrap font-semibold text-ocean-900/60 2xl:inline">{t('pillYours')}</span>}
      <span className="truncate font-semibold text-ocean-900">{summary}</span>
      <Pencil className="size-3.5 shrink-0 text-ocean-900/40 transition group-hover:text-coral-500" />
    </button>
  );
}
