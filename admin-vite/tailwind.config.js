/*
 * Admin design system. New screens use the semantic tokens below (canvas,
 * surface, line, ink, muted, brand, accent, ok/warn/danger) which switch for
 * dark mode via CSS variables in src/index.css. DaisyUI stays only so the
 * not-yet-redesigned screens keep working; it goes in Phase 3.
 */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        subtle: token('subtle'),
        line: token('line'),
        ink: token('ink'),
        muted: token('muted'),
        faint: token('faint'),
        brand: { DEFAULT: token('brand'), soft: token('brand-soft'), ink: token('brand-ink') },
        accent: { DEFAULT: token('accent'), soft: token('accent-soft') },
        ok: { DEFAULT: token('ok'), soft: token('ok-soft') },
        warn: { DEFAULT: token('warn'), soft: token('warn-soft') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(16 24 40 / 0.04), 0 1px 3px rgb(16 24 40 / 0.06)',
        pop: '0 12px 32px -8px rgb(16 24 40 / 0.22), 0 4px 8px -4px rgb(16 24 40 / 0.08)',
      },
      borderRadius: { xl2: '1rem' },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { transform: 'translateY(16px)', opacity: 0 }, to: { transform: 'none', opacity: 1 } },
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in .15s ease-out',
        'slide-up': 'slide-up .22s cubic-bezier(.22,1,.36,1)',
        'slide-in': 'slide-in .25s cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        exploringwatamu: {
          primary: '#028a8e',
          secondary: '#e06c31',
          accent: '#f9e9c4',
          neutral: '#1f2937',
          'base-100': '#ffffff',
        },
      },
    ],
    darkTheme: 'exploringwatamu',
    logs: false,
  },
};
