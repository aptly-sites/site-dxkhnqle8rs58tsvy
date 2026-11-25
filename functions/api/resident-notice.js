import { json } from '../_lib/http.js';
import { handleLeadPost } from '../_lib/lead-post.js';
import residentNotices, { isReady } from '../_lib/resident-notices.js';

// The notice page asks first whether the board is configured, and disables the form if not.
export function onRequestGet({ request, env }) {
  const kind = new URL(request.url).searchParams.get('kind') ?? '';
  return json({ ready: isReady(env, kind) });
}

export const onRequestPost = context => handleLeadPost(context, residentNotices);
