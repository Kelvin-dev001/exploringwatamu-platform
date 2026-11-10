'use strict';

/*
 * Photo lists on listing updates (multipart forms). New photos arrive as
 * files; photos the admin kept arrive as a list of their URLs (existingGallery,
 * existingPictures, existingImages...), in display order.
 *
 *   kept list sent (even [])  ->  kept + new uploads replace what is stored
 *   kept list NOT sent        ->  stored photos stay; new uploads are appended
 *
 * so a client that leaves the field out can never wipe a gallery.
 */

/** URLs from a JSON array string, a real array, or a single URL string. */
function urlList(value) {
  let list = value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        list = JSON.parse(trimmed);
      } catch {
        list = [];
      }
    } else {
      list = trimmed ? [trimmed] : [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim());
}

/**
 * The photo list to store, or undefined to leave the stored list untouched.
 * `current` = stored URLs, `kept` = the raw kept-list field, `uploaded` = new URLs.
 */
function nextGallery(current, kept, uploaded = []) {
  if (kept === undefined) return uploaded.length ? [...(current || []), ...uploaded] : undefined;
  return [...urlList(kept), ...uploaded];
}

const uploadedPaths = (files) => (Array.isArray(files) ? files.map((f) => f.path) : []);

module.exports = { urlList, nextGallery, uploadedPaths };
