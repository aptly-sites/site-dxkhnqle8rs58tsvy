// Shared helpers for the Pages Functions that replace server/dev.py in production.

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

// An error whose message is safe to show to the visitor (validation feedback).
export class UserError extends Error {}

// Same output as Python's html.escape(): & < > " and ' are escaped.
export const escapeHtml = value =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

// Number of Unicode code points, matching Python's len() (not UTF-16 units).
export const length = value => [...value].length;

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accepts the same spellings as Python's uuid.UUID() and returns the canonical lowercase form.
export function canonicalUuid(value) {
  if (typeof value !== 'string') return null;
  const hex = value.trim().replace(/^urn:uuid:/i, '').replace(/^\{(.*)\}$/, '$1').replace(/-/g, '');
  if (!/^[0-9a-f]{32}$/i.test(hex)) return null;
  const h = hex.toLowerCase();
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
