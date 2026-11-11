import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 ease-[var(--ease-tide)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-[1.1em] [&_svg]:shrink-0';

const variants = {
  primary: 'bg-coral-500 text-white shadow-soft hover:bg-coral-600 hover:shadow-lift',
  ocean: 'bg-ocean-900 text-sand-50 hover:bg-ocean-800',
  outline: 'border border-ocean-900/20 bg-transparent text-ocean-900 hover:border-ocean-900 hover:bg-ocean-900/[0.03]',
  ghost: 'bg-transparent text-ocean-900 hover:bg-ocean-900/[0.06]',
  light: 'bg-sand-50 text-ocean-900 hover:bg-white',
  whatsapp: 'bg-whatsapp-600 text-white shadow-soft hover:bg-whatsapp-700 hover:shadow-lift',
  link: 'bg-transparent p-0 h-auto text-ocean-900 underline decoration-coral-400 decoration-2 underline-offset-4 hover:decoration-coral-600',
};

const sizes = {
  sm: 'h-9 px-4 text-sm rounded-full',
  md: 'h-11 px-6 text-[0.95rem] rounded-full',
  lg: 'h-14 px-8 text-base rounded-full',
  icon: 'h-11 w-11 rounded-full',
};

export function buttonClasses({ variant = 'primary', size = 'md', className } = {}) {
  return cn(base, variants[variant], variant !== 'link' && sizes[size], className);
}

/**
 * Button. Pass `to` to render a router Link, `href` for an external link.
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className, to, href, children, ...props },
  ref
) {
  const classes = buttonClasses({ variant, size, className });
  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button ref={ref} type="button" className={classes} {...props}>
      {children}
    </button>
  );
});
