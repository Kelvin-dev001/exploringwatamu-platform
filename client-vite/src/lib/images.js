/*
 * Right-sized listing photos from Cloudinary, without touching stored URLs.
 *
 * Uploads are stored as Cloudinary delivery URLs
 * (https://res.cloudinary.com/<cloud>/image/upload/v123/tours/x.jpg). At render
 * time we ask Cloudinary for a version that fits:
 *   f_auto   WebP/AVIF for browsers that take them, JPG otherwise
 *   q_auto   Cloudinary's perceptual quality setting (no visible loss)
 *   c_limit  shrink to the width, never enlarge, never crop (CSS crops)
 * Any other URL (local files, other hosts, already-transformed URLs) is used
 * as it is. Each size is generated once and then served from Cloudinary's CDN.
 */

const UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;
// A transformation segment, e.g. "c_fill,w_100" or "f_auto,q_auto,c_limit,w_640".
const TRANSFORM = /^[a-z]{1,3}_[^/]+$/;

/** The standard widths we generate; a few sizes keep Cloudinary's derived images (and its quota use) low. */
export const WIDTHS = [320, 480, 640, 960, 1280, 1600];

export function isCloudinary(url) {
  return typeof url === 'string' && UPLOAD.test(url);
}

/** A Cloudinary URL resized to `width`, or the URL unchanged. */
export function cloudinaryUrl(url, width) {
  const m = typeof url === 'string' && url.match(UPLOAD);
  if (!m || !width) return url;
  const [, base, rest] = m;
  if (TRANSFORM.test(rest.split('/')[0])) return url; // already transformed (a version "v123" never matches)
  return `${base}f_auto,q_auto,c_limit,w_${Math.round(width)}/${rest}`;
}

/** srcset for a Cloudinary URL (undefined otherwise), up to `max` px wide. */
export function cloudinarySrcSet(url, max = 1600) {
  if (!isCloudinary(url)) return undefined;
  return WIDTHS.filter((w) => w <= max)
    .map((w) => `${cloudinaryUrl(url, w)} ${w}w`)
    .join(', ');
}
