import {acceptFeedback} from './anonymous.mjs';

export async function reviewResponse(context, render) {
  const {request} = context;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/website-review/')) return acceptFeedback(context);
  const response = await render(context);
  if (url.origin !== 'https://site-dxkhnqle8rs58tsvy.pages.dev' || request.method !== 'GET' ||
      !response.ok || !response.headers.get('content-type')?.includes('text/html')) return response;
  return new HTMLRewriter()
    .on('head', {element(el){el.append('<link rel="stylesheet" href="/studio-review.css">',{html:true});}})
    .on('body', {element(el){el.append(`<script defer src="/website-review-link.js" data-submission-ready="${Boolean(context.env.ALL3_FEEDBACK_DB)}"></script>`,{html:true});}})
    .transform(response);
}
