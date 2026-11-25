import { json } from '../../_lib/http.js';
import { BadLocation, CITY_CENTERS, NotFound, forListing, nearby } from '../../_lib/schools.js';

const UNAVAILABLE = { error: 'School information is temporarily unavailable. Please retry.' };

// /api/schools/<city>, /api/schools/stockbridge (default center) and /api/schools/listing?id=...
export async function onRequestGet({ request, env, params }) {
  const name = [].concat(params.path ?? []).join('/');
  try {
    if (name === 'listing') {
      return json(await forListing(env, new URL(request.url).searchParams.get('id') ?? ''));
    }
    if (name === 'stockbridge') return json(await nearby(env));
    if (Object.hasOwn(CITY_CENTERS, name)) return json(await nearby(env, CITY_CENTERS[name]));
    return json({ error: 'Not found' }, 404);
  } catch (error) {
    if (error instanceof NotFound) return json({ error: 'Listing not found.' }, 404);
    if (error instanceof BadLocation) return json({ error: 'School information requires a verified property location.' }, 400);
    console.error('Schools lookup failed:', error instanceof Error ? error.message : 'Unknown error');
    return json(UNAVAILABLE, 502);
  }
}
