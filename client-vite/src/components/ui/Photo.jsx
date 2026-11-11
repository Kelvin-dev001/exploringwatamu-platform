import { useState } from 'react';
import { cloudinarySrcSet, cloudinaryUrl, isCloudinary } from '@/lib/images';

/**
 * A listing photo at the size it is shown (see lib/images.js).
 *
 * - sizes: how wide it is on screen, e.g. "(min-width: 1024px) 33vw, 100vw";
 *   the browser then picks the smallest version that is sharp enough.
 * - max: the largest width worth generating for this spot.
 * - fallback: shown when there is no photo or it cannot be loaded.
 *
 * If a resized version fails (e.g. the Cloudinary account disallows on-the-fly
 * resizing), the original URL is tried before giving up, so a configuration
 * change can never blank the listings.
 */
function PhotoImage({ src, sizes = '100vw', max = 1600, fallback = null, priority = false, alt = '', ...rest }) {
  // 0: resized, 1: original, 2: failed
  const [stage, setStage] = useState(isCloudinary(src) ? 0 : 1);
  if (!src || stage === 2) return fallback;
  const resized = stage === 0;
  return (
    <img
      src={resized ? cloudinaryUrl(src, Math.min(max, 960)) : src}
      srcSet={resized ? cloudinarySrcSet(src, max) : undefined}
      sizes={resized ? sizes : undefined}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      onError={() => setStage((s) => s + 1)}
      {...rest}
    />
  );
}

// Keyed by src, so a new photo starts again from its resized version.
export default function Photo(props) {
  return <PhotoImage key={props.src || 'none'} {...props} />;
}
