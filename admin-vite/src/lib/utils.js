import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...a) => twMerge(clsx(a));

export const kes = (n) => (n === null || n === undefined || n === '' || Number.isNaN(Number(n)) ? '—' : `KES ${Math.round(Number(n)).toLocaleString('en-KE')}`);

/** Compact money for stat tiles: KES 1.2M, KES 450K. */
export const kesShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e6) return `KES ${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M`;
  if (v >= 1e4) return `KES ${Math.round(v / 1e3)}K`;
  return kes(v);
};

export const date = (d, opts = { day: 'numeric', month: 'short' }) => (d ? new Date(d).toLocaleDateString('en-GB', opts) : '—');
export const dateRange = (a, b) => (a ? `${date(a)} – ${date(b, { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Flexible dates');

export function ago(d) {
  if (!d) return '';
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days} d ago`;
  return date(d);
}

/** wa.me number from local or international formats (Kenyan 07… / 01… become +254…). */
export function waNumber(phone) {
  if (!phone) return null;
  let d = String(phone).replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (/^0[17]\d{8}$/.test(d)) d = `254${d.slice(1)}`;
  return d.length >= 8 ? d : null;
}

export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(String(v || ''));
