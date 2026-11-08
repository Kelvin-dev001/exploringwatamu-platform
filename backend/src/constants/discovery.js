'use strict';

/*
 * Discovery tags shared by every bookable listing (tours, group trips, and
 * later stays and services). The ids match the client's personalisation
 * vocabulary in client-vite/src/lib/vibes.js, so a visitor's chosen vibes can
 * be matched against listings with a simple overlap score.
 */
const VIBES = ['ocean', 'slow', 'adventure', 'culture', 'romance', 'social'];
const SUITS = ['solo', 'couple', 'friends', 'family'];
const ENERGY = ['easy', 'moderate', 'active'];

function toList(value) {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return trimmed.split(',');
  }
  return [];
}

/** Keep only known ids, de-duplicated, in a stable order. */
function cleanList(value, allowed) {
  const wanted = new Set(toList(value).map((v) => String(v).trim().toLowerCase()));
  return allowed.filter((id) => wanted.has(id));
}

function cleanEnergy(value) {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return ENERGY.includes(v) ? v : undefined;
}

function cleanHours(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= 24 * 30 ? n : undefined;
}

/**
 * Pull discovery fields out of a request body (multipart strings, JSON arrays
 * or real arrays). Only keys that were actually sent are returned, so an
 * update from an older admin form never wipes existing tags.
 */
function parseDiscovery(body = {}) {
  const out = {};
  if (body.vibes !== undefined) out.vibes = cleanList(body.vibes, VIBES);
  if (body.suits !== undefined) out.suits = cleanList(body.suits, SUITS);
  if (body.energy !== undefined) out.energy = cleanEnergy(body.energy) ?? null;
  if (body.durationHours !== undefined) out.durationHours = cleanHours(body.durationHours) ?? null;
  return out;
}

module.exports = { VIBES, SUITS, ENERGY, parseDiscovery, cleanList };
