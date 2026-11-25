// Port of server/listings_feed.py: All 3 Realty's public Aptly listings feed, no API key involved.
const COMPANY = 'DXKHnQLE8RS58tSvy';
const BASE = `https://app.getaptly.com/api/portal/listings/${COMPANY}`;
const FRESH_MS = 180 * 1000; // same as the Python cache
const STALE_OK_MS = 60 * 60 * 1000; // if the feed is down, keep showing the last good copy for an hour

let cache = null; // { value, at }
let inflight = null;

async function fetchPage(page) {
  const response = await fetch(`${BASE}?page=${page}&size=20`, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Feed ${response.status}`);
  return response.json();
}

async function loadAll() {
  const items = new Map();
  let page = 0;
  let total = 0;
  while (page < 100) {
    const response = await fetchPage(page);
    if (!Array.isArray(response?.data) || typeof response.total !== 'number') throw new Error('Invalid public feed');
    total = Math.trunc(response.total);
    const before = items.size;
    for (const row of response.data) {
      if (row && typeof row === 'object' && !Array.isArray(row) && row._id) items.set(row._id, row);
    }
    if (items.size >= total) break;
    if (items.size === before || !response.data.length) throw new Error('Incomplete public feed');
    page += 1;
  }
  if (items.size < total) throw new Error('Public feed pagination limit reached');
  return { data: [...items.values()], total: items.size, fetchedAt: Date.now() / 1000 };
}

export async function getListings() {
  const now = Date.now();
  if (cache && now - cache.at < FRESH_MS) return cache.value;
  inflight ??= loadAll()
    .then(value => {
      cache = { value, at: Date.now() };
      return value;
    })
    .finally(() => {
      inflight = null;
    });
  try {
    return await inflight;
  } catch (error) {
    if (cache && now - cache.at < STALE_OK_MS) return cache.value;
    throw error;
  }
}

// Test hook: forget the cached feed.
export function resetListingsCache() {
  cache = null;
  inflight = null;
}
