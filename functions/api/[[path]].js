import { json } from '../_lib/http.js';

// Anything under /api/ that isn't a real endpoint answers JSON 404, as server/dev.py does.
export const onRequest = () => json({ error: 'Not found' }, 404);
