// Port of server/schools.py: GreatSchools proxy for city pages and individual listings. Never stored.
import { need } from './aptly.js';
import { getListings } from './listings.js';

export const DEFAULT_CENTER = { lat: 33.5443, lon: -84.2338 }; // Stockbridge
export const CITY_CENTERS = {
  prattville: { lat: 32.464, lon: -86.46 },
  montgomery: { lat: 32.377, lon: -86.3 },
  fayetteville: { lat: 33.4487, lon: -84.4549 },
  mcdonough: { lat: 33.4481, lon: -84.1472 },
  atlanta: { lat: 33.749, lon: -84.388 },
};

export class NotFound extends Error {}
export class BadLocation extends Error {}

export function normalize(raw) {
  const text = key => String(raw[key] || '').slice(0, 500);
  const coordinate = (key, maximum) => {
    const value = raw[key];
    if (value === null || value === undefined || typeof value === 'boolean') return null;
    // Python's float() takes decimal text only; JS Number() would also accept '', '0x10' and similar.
    if (typeof value === 'string' && !/^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?\s*$/.test(value)) return null;
    const number = Number(value);
    return Number.isFinite(number) && Math.abs(number) <= maximum ? number : null;
  };
  let url = text('overview-url');
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !['greatschools.org', 'www.greatschools.org'].includes(parsed.hostname) || parsed.username || parsed.password) url = null;
  } catch {
    url = null;
  }
  return {
    id: text('universal-id'),
    name: text('name'),
    type: text('type'),
    grades: text('level'),
    levels: text('level-codes').split(',').map(v => v.trim().toLowerCase()),
    address: ['street', 'city', 'state', 'zip'].map(text).filter(Boolean).join(', '),
    lat: coordinate('lat', 90),
    lon: coordinate('lon', 180),
    url,
  };
}

export async function nearby(env, center = DEFAULT_CENTER) {
  const { GREATSCHOOLS_API_KEY } = need(env, 'GREATSCHOOLS_API_KEY');
  const schools = new Map();
  let received = 0;
  let partial = true;
  for (let page = 0; page < 4; page += 1) {
    const query = new URLSearchParams({ lat: center.lat, lon: center.lon, distance: 5, limit: 50, page });
    const response = await fetch(`https://gs-api.greatschools.org/v2/nearby-schools?${query}`, {
      headers: { 'X-API-Key': GREATSCHOOLS_API_KEY, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`GreatSchools ${response.status}`);
    const data = await response.json();
    const rows = data?.schools;
    const total = data?.total_count;
    if (!Array.isArray(rows) || !Number.isInteger(total)) throw new Error('Invalid school response');
    for (const raw of rows) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
      const school = normalize(raw);
      if (school.id && school.name) schools.set(school.id, school);
    }
    received += rows.length;
    if (received >= total) {
      partial = false;
      break;
    }
    if (!rows.length) break;
  }
  return { schools: [...schools.values()], partial, center, radiusMiles: 5 };
}

export async function forListing(env, listingId) {
  if (typeof listingId !== 'string' || !listingId || listingId.length > 100) throw new BadLocation('Invalid listing');
  const home = (await getListings()).data.find(row => row._id === listingId && row.publishedForRent !== false);
  if (!home) throw new NotFound('Listing not found');
  const point = home.address?.geopoint;
  if (!Array.isArray(point) || point.length < 2) throw new BadLocation('Location unavailable');
  const [lon, lat] = [Number(point[0]), Number(point[1])];
  if (![lat, lon].every(v => Number.isFinite(v) && v !== 0) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new BadLocation('Location unavailable');
  }
  return nearby(env, { lat, lon });
}
