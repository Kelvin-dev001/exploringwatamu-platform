import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import messages from '@/locales/cards';

/** Visitor (non-resident) vs Kenya-resident pricing. International-first default. */
export default function ResidencyToggle({ value, onChange, className }) {
  const { t } = useI18n(messages);
  const opts = [
    { id: 'nonResident', label: t('visitorPrices') },
    { id: 'resident', label: t('residentPrices') },
  ];
  return (
    <div role="radiogroup" aria-label={t('priceType')} className={cn('inline-flex rounded-full border border-sand-300 bg-white p-1', className)}>
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
            value === o.id ? 'bg-ocean-900 text-sand-50' : 'text-ocean-900/60 hover:text-ocean-900'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
