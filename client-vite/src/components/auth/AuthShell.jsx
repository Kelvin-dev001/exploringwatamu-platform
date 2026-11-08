import { BrandBadge } from '@/components/brand/Logo';
import { WaveField } from '@/components/brand/Patterns';
import Seo from '@/components/seo/Seo';

/** Split layout for sign-in pages: form on sand, an ocean panel on large screens. */
export default function AuthShell({ title, lede, seoTitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100vh-4.5rem)] lg:grid-cols-[1fr_1.05fr]">
      <Seo title={seoTitle || title} noindex />
      <div className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="font-display text-4xl leading-tight text-ocean-900">{title}</h1>
          {lede && <p className="mt-3 text-ocean-900/65">{lede}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-ocean-900/65">{footer}</div>}
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ocean-900 lg:block" aria-hidden="true">
        <WaveField className="absolute inset-0 text-ocean-800" rows={10} gap={20} />
        <div className="absolute left-1/2 top-[30%] size-40 -translate-x-1/2 rounded-full bg-coral-500 shadow-[0_0_80px_20px_rgb(224_108_49/0.35)]" />
        <div className="absolute inset-x-0 bottom-0 top-[48%] bg-lagoon-600">
          <WaveField className="text-lagoon-300/50" rows={8} gap={18} amplitude={5} />
        </div>
        <div className="absolute bottom-12 left-12 right-12 flex items-end gap-5 text-sand-50">
          <BrandBadge className="size-20 ring-4 ring-ocean-900/40" />
          <p className="font-display text-2xl italic leading-snug">Your Watamu, tuned to you.</p>
        </div>
      </div>
    </div>
  );
}

export const authInput =
  'h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-ocean-900 placeholder:text-ocean-900/45 focus:border-ocean-900';

export function AuthField({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ocean-900">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ocean-900/60">{hint}</span>}
    </label>
  );
}

export function AuthError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-700">
      {children}
    </p>
  );
}
