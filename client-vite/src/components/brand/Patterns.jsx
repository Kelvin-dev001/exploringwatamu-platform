import { useId } from 'react';
import { cn } from '@/lib/utils';

/*
 * Original SVG motifs for the Swahili-coast look. They are loosely inspired by
 * carved coastal doorways (arches, rosettes, chain borders) and makuti weave,
 * drawn from simple geometry so they stay light, crisp and recolourable via
 * `currentColor`. Use them where photography will eventually sit, too.
 */

/** Band of small carved arches with a bead under each — for section edges. */
export function ArchBand({ className, height = 18 }) {
  const id = useId();
  return (
    <svg aria-hidden="true" className={cn('block w-full', className)} height={height}>
      <defs>
        <pattern id={id} width="28" height={height} patternUnits="userSpaceOnUse">
          <path
            d={`M2 ${height} V${height * 0.55} A12 12 0 0 1 26 ${height * 0.55} V${height}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <circle cx="14" cy={height * 0.62} r="1.8" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Interlocking rings, like a carved chain border on a door frame. */
export function ChainBand({ className, height = 14 }) {
  const id = useId();
  const r = height / 2 - 1;
  return (
    <svg aria-hidden="true" className={cn('block w-full', className)} height={height}>
      <defs>
        <pattern id={id} width={r * 2.6} height={height} patternUnits="userSpaceOnUse">
          <circle cx={r + 1} cy={height / 2} r={r} fill="none" stroke="currentColor" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Rows of gentle waves — tides, the reef, the creek. */
export function WaveField({ className, rows = 6, gap = 14, amplitude = 4, strokeWidth = 1.2 }) {
  const id = useId();
  const w = 64;
  const h = rows * gap;
  const wave = (y) => `M0 ${y} Q ${w / 4} ${y - amplitude} ${w / 2} ${y} T ${w} ${y}`;
  return (
    <svg aria-hidden="true" className={cn('block h-full w-full', className)}>
      <defs>
        <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse">
          {Array.from({ length: rows }, (_, i) => (
            <path key={i} d={wave(gap / 2 + i * gap)} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Diagonal weave like a makuti (palm-thatch) roof. */
export function Weave({ className, size = 16, strokeWidth = 1 }) {
  const id = useId();
  return (
    <svg aria-hidden="true" className={cn('block h-full w-full', className)}>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2={size} stroke="currentColor" strokeWidth={strokeWidth} />
          <line x1={size / 2} y1="0" x2={size / 2} y2={size / 2} stroke="currentColor" strokeWidth={strokeWidth} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Eight-petal rosette, the boss you find at the centre of carved panels. */
export function Rosette({ className, size = 120, strokeWidth = 1.2 }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg
      aria-hidden="true"
      viewBox="-60 -60 120 120"
      width={size}
      height={size}
      className={cn('block', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    >
      <circle r="56" />
      <circle r="50" strokeDasharray="2 4" />
      {petals.map((a) => (
        <ellipse key={a} rx="9" ry="26" cy="-22" transform={`rotate(${a})`} />
      ))}
      {petals.map((a) => (
        <circle key={`d${a}`} r="2.2" cy="-46" transform={`rotate(${a + 22.5})`} fill="currentColor" />
      ))}
      <circle r="8" />
      <circle r="3" fill="currentColor" />
    </svg>
  );
}

/** Tall arched frame — a doorway — used as an image placeholder or a feature panel. */
export function DoorFrame({ className, children }) {
  return (
    <div className={cn('relative overflow-hidden rounded-t-[999px] rounded-b-[var(--radius-card)]', className)}>
      {children}
    </div>
  );
}
