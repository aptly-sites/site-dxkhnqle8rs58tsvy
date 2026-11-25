// Keep staging pages out of search while allowing the public site's editorial pages.
import {origin} from './_lib/rental-seo.js';
import {restoredPages, redirects} from './_lib/migration-routes.js';

export async function onRequest({request, next, env}) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '');
  const target = redirects.get(path) || (restoredPages.has(path) && path !== url.pathname ? path : null);
  if (target) {
    url.pathname = target;
    return Response.redirect(url.href, 301);
  }
  // Fetch the static asset internally so legacy extensionless URLs stay at 200.
  const response = restoredPages.has(path)
    ? await env.ASSETS.fetch(new Request(new URL(path + '/', url), request))
    : await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
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
