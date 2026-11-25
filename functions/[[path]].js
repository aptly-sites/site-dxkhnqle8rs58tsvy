// Keep staging pages out of search while allowing the public site's editorial pages.
import {origin} from './_lib/rental-seo.js';

export async function onRequest({request, next}) {
  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const url = new URL(request.url);
  if (url.origin !== origin) {
    const preview = new Response(response.body, response);
    preview.headers.set('X-Robots-Tag','noindex, nofollow');
    return preview;
  }
  if (response.ok && !url.pathname.startsWith('/rental/') && /\/$/.test(url.pathname)) {
    return new HTMLRewriter().on('meta[name="robots"][content="noindex,nofollow"]', {element(el){el.remove()}}).transform(response);
  }
  return response;
}
