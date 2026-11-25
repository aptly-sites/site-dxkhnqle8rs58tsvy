// POST pipeline shared by the three lead forms. Mirrors Handler.do_POST in server/dev.py:
// same-origin check, JSON only, 14 kB cap, honeypot, duplicate and rate limiting, 502 with a phone number.
import { json, UserError } from './http.js';

const MAX_BODY_BYTES = 14000;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 5 * 60 * 1000;
const KEEP_MS = 60 * 60 * 1000;

// Per-isolate state, as in dev.py's process-local dictionaries. Cloudflare may run several isolates,
// so these are best-effort guards; the Aptly board is the source of truth.
const submitted = new Map(); // path + requestId -> time
const pending = new Set();
const attempts = new Map(); // ip -> [times]

function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

// Reads at most MAX_BODY_BYTES; returns null when the body is empty or larger.
async function readBody(request) {
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > MAX_BODY_BYTES) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  if (!size) return null;
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function prune(now) {
  if (submitted.size > 2000) for (const [key, at] of submitted) if (now - at > KEEP_MS) submitted.delete(key);
  if (attempts.size > 2000) for (const [ip, times] of attempts) if (!times.some(t => now - t < RATE_WINDOW_MS)) attempts.delete(ip);
}

export async function handleLeadPost({ request, env }, processor) {
  if (!sameOrigin(request)) return json({ error: 'Please submit from the website.' }, 403);
  if ((request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase() !== 'application/json') {
    return json({ error: 'JSON required' }, 415);
  }
  const text = await readBody(request);
  if (text === null) return json({ error: 'Request too large' }, 413);

  let lead;
  try {
    lead = processor.validate(JSON.parse(text));
  } catch (error) {
    return json({ error: error instanceof UserError ? error.message : 'Please check the form.' }, 400);
  }
  if (lead === null) return json({ ok: true }); // honeypot: pretend success

  const now = Date.now();
  const key = processor.path + lead.requestId;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  prune(now);
  if (submitted.has(key)) return json({ ok: true });
  if (pending.has(key)) return json({ error: 'Your request is being sent.' }, 409);
  const recent = (attempts.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    attempts.set(ip, recent);
    return json({ error: 'Please wait a few minutes before trying again.' }, 429);
  }
  recent.push(now);
  attempts.set(ip, recent);
  pending.add(key);
  try {
    await processor.submit(env, lead);
    submitted.set(key, now);
    return json({ ok: true });
  } catch (error) {
    // Log the cause (it never contains lead data) so a misconfiguration is visible in Pages logs.
    console.error(`Lead submit failed (${processor.path}):`, error instanceof Error ? error.message : 'Unknown error');
    const phone = lead.market === 'Alabama' ? '334-593-3130' : '678-782-7447';
    return json({ error: `We could not confirm your inquiry. Please call ${phone} before retrying.` }, 502);
  } finally {
    pending.delete(key);
  }
}
