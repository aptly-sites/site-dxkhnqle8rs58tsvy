import {getListings} from './_lib/listings.js';
import {normalizeListings} from '../listing-data.js';
import {origin, escape} from './_lib/rental-seo.js';

export async function onRequestGet() {
  try {
    const homes = normalizeListings((await getListings()).data);
    const entries = homes.map(home => '<url><loc>' + escape(origin + home.detailHref) + '</loc></url>');
    return new Response('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries.join('') + '</urlset>', {headers:{'Content-Type':'application/xml'}});
  } catch {
    return new Response('Listings temporarily unavailable.', {status:503});
  }
}
