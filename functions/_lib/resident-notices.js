// Port of server/resident_notices.py: Georgia resident notices routed to an Aptly board.
import { aptly, need } from './aptly.js';
import { EMAIL, UserError, canonicalUuid, length } from './http.js';

export const NOTICE_TYPES = {
  'lease-end': 'Lease ending',
  'occupant-release': 'Single occupant release',
  'early-termination': 'Early termination',
};

// GET ?kind=...  ->  is the board configured for this notice type?
export function isReady(env, kind) {
  try {
    need(env, 'APTLY_API_TOKEN', 'APTLY_RESIDENT_NOTICE_BOARD_ID');
  } catch {
    return false;
  }
  return Object.hasOwn(NOTICE_TYPES, kind);
}

// Python date.fromisoformat for a calendar date; returns YYYY-MM-DD or null.
function isoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || year < 1) return null;
  return value;
}

export function validate(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new UserError('Invalid form.');
  if (raw.website) return null; // honeypot
  const kind = raw.kind;
  if (typeof kind !== 'string' || !Object.hasOwn(NOTICE_TYPES, kind)) throw new UserError('Choose a notice type.');
  const requestId = canonicalUuid(raw.requestId ?? '');
  if (!requestId) throw new UserError('Please reload the form.');
  const values = { kind, requestId };
  const fields = ['name', 'email', 'address', 'leaseEnd', 'moveDate', 'reason', 'signature', 'phone'];
  fields.push(kind === 'occupant-release' ? 'remaining' : 'forwarding');
  if (kind === 'early-termination') fields.push('lockbox');
  for (const key of fields) {
    const value = raw[key] === undefined ? '' : raw[key]; // like dict.get(key, ''): an explicit null is rejected
    if (typeof value !== 'string' || length(value) > (key === 'reason' ? 1500 : 350)) throw new UserError('Check your form entries.');
    values[key] = value.trim();
    if (!values[key] && key !== 'phone' && !(key === 'forwarding' && kind === 'early-termination')) {
      throw new UserError('Complete all required fields.');
    }
  }
  if (!EMAIL.test(values.email)) throw new UserError('Enter a valid email.');
  for (const key of ['leaseEnd', 'moveDate']) {
    const date = isoDate(values[key]);
    if (!date) throw new UserError('Enter valid lease and move-out dates.');
    values[key] = date;
  }
  if (kind === 'early-termination' && values.moveDate >= values.leaseEnd) {
    throw new UserError('Early termination requires a move-out date before lease expiration.');
  }
  if (kind === 'early-termination' && !['Yes', 'No', 'Unsure'].includes(values.lockbox)) throw new UserError('Select a lockbox option.');
  if (raw.ack !== 'on') throw new UserError('Review the acknowledgement.');
  return values;
}

export function payload(values, fields) {
  const kind = values.kind;
  const body = {
    name: `${NOTICE_TYPES[kind]} — ${values.address}`,
    stage: 'Received', market: 'Georgia', noticeType: NOTICE_TYPES[kind],
    residentName: values.name, residentEmail: values.email,
    rentalAddress: { formattedAddress: values.address },
    ack: true,
    ackText: 'I have reviewed my signed lease and confirm the information in this request.',
    receivedAt: new Date().toISOString(),
    sourcePath: `/markets/georgia/residents/notice/${kind}/`,
  };
  for (const key of ['leaseEnd', 'moveDate', 'reason', 'signature', 'requestId', 'remaining', 'lockbox']) {
    if (values[key]) body[key] = values[key];
  }
  if (values.phone) body.residentPhone = values.phone;
  if (values.forwarding) body.forwarding = { formattedAddress: values.forwarding };
  const schema = Object.fromEntries(fields.map(f => [f.uuid, f]));
  for (const [key, value] of Object.entries(body)) {
    if (key === 'name') continue; // built-in card title, outside the custom field schema
    const field = schema[key];
    if (!field) throw new Error(`Missing notice field: ${key}`);
    if ((field.type === 'singleselect' || field.type === 'stageselect') && !(field.data ?? []).some(o => o.label === value)) {
      throw new Error(`Missing notice option: ${key}`);
    }
  }
  return body;
}

export async function submit(env, values) {
  const { APTLY_RESIDENT_NOTICE_BOARD_ID } = need(env, 'APTLY_API_TOKEN', 'APTLY_RESIDENT_NOTICE_BOARD_ID');
  const path = `board/${encodeURIComponent(APTLY_RESIDENT_NOTICE_BOARD_ID)}`;
  const fields = (await aptly(env, `${path}/configuration`)).data.fields;
  const result = await aptly(env, path, payload(values, fields));
  if (!result.data?._id) throw new Error('Unconfirmed');
}

export default { path: '/api/resident-notice', validate, submit };
