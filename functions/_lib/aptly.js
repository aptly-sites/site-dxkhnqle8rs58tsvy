// Server-side Aptly API access. The token only ever exists in the Pages environment.

const API = 'https://core-api.getaptly.com/api/';

// Returns the named environment values, or throws if any is missing/blank.
// The thrown message names only the variable, never a value.
export function need(env, ...keys) {
  const values = {};
  for (const key of keys) {
    const value = typeof env?.[key] === 'string' ? env[key].trim() : '';
    if (!value) throw new Error(`Missing configuration: ${key}`);
    values[key] = value;
  }
  return values;
}

export async function aptly(env, path, body) {
  const { APTLY_API_TOKEN } = need(env, 'APTLY_API_TOKEN');
  const response = await fetch(API + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'x-token': APTLY_API_TOKEN, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  // Never include the response body: it can echo the submitted lead.
  if (!response.ok) throw new Error(`Aptly API ${response.status}`);
  return response.json();
}
