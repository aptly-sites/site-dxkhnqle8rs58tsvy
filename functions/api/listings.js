import { json } from '../_lib/http.js';
import { getListings } from '../_lib/listings.js';

export async function onRequestGet() {
  try {
    return json(await getListings());
  } catch (error) {
    console.error('Listings feed failed:', error instanceof Error ? error.message : 'Unknown error');
    return json({ error: 'Homes are temporarily unavailable. Please retry.' }, 502);
  }
}
