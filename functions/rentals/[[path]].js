import { getListings } from '../_lib/listings.js';
import { normalizeListings } from '../../listing-data.js';
import { listingHtml, origin } from '../_lib/rental-seo.js';

export async function serveRental({request, env}) {
  const url = new URL(request.url);
  const legacy = url.pathname.replace(/\/$/, '') === '/rental';
  const id = legacy ? url.searchParams.get('id') : url.pathname.split('/').filter(Boolean).pop();
  let home;
  try {
    home = normalizeListings((await getListings()).data).find(item => item.id === id);
  } catch {
    return new Response('Listings temporarily unavailable.', {status:503, headers:{'Retry-After':'120'}});
  }
  if (!home) return new Response('<h1>This rental is unavailable.</h1><a href="/homes-for-rent/">Browse available homes</a>', {status:404, headers:{'Content-Type':'text/html; charset=utf-8'}});
  if (home.detailHref !== url.pathname) {
    const target = new URL(home.detailHref, url);
    if (url.searchParams.has('returnTo')) target.searchParams.set('returnTo', url.searchParams.get('returnTo'));
    return Response.redirect(target.href, 301);
  }
  const template = await env.ASSETS.fetch(new URL('/rental/', url));
  if (!template.ok) return new Response('Rental page temporarily unavailable.', {status:503});
  let html = listingHtml(await template.text(), home);
  if (url.origin === origin) html = html.replace('<meta name="robots" content="noindex,nofollow">','');
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}});
}
export const onRequestGet = serveRental;
