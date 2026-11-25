// Port of server/agent_referrals.py: route an agent's client introduction to the Georgia mailbox.
import { aptly, need } from './aptly.js';
import { EMAIL, UserError, canonicalUuid, escapeHtml, length } from './http.js';

const MAILBOX = 'georgia@all3realty.com';
const FIELDS = {
  agent: ['Referring agent', 120], brokerage: ['Brokerage', 180], email: ['Agent email', 254], phone: ['Agent phone', 32],
  client: ['Client name', 120], clientEmail: ['Client email', 254], clientPhone: ['Client phone', 32],
  property: ['Rental property', 300], notes: ['Referral notes', 1800],
};

export function validate(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new UserError('Please check the form.');
  if (raw.website) return null; // honeypot
  const lead = {};
  for (const [key, [label, limit]] of Object.entries(FIELDS)) {
    const value = raw[key] === undefined ? '' : raw[key]; // like dict.get(key, ''): an explicit null is rejected
    if (typeof value !== 'string' || length(value) > limit) throw new UserError(`Please check the field: ${label}`);
    lead[key] = value.trim();
  }
  if (!['agent', 'brokerage', 'email', 'client'].every(key => lead[key])) {
    throw new UserError('Enter your name, brokerage, email, and client’s name.');
  }
  if (!lead.clientEmail && !lead.clientPhone) throw new UserError('Enter an email address or phone number for your client.');
  for (const key of ['email', 'clientEmail']) {
    if (lead[key] && !EMAIL.test(lead[key])) throw new UserError('Check the email address.');
  }
  const requestId = canonicalUuid(raw.requestId ?? '');
  if (!requestId) throw new UserError('Please reload the form.');
  lead.requestId = requestId;
  return lead;
}

export async function submit(env, lead) {
  const { APTLY_REFERRAL_USER_ID, APTLY_REFERRAL_CHANNEL_ID } = need(env, 'APTLY_API_TOKEN', 'APTLY_REFERRAL_USER_ID', 'APTLY_REFERRAL_CHANNEL_ID');
  const body = Object.entries(FIELDS)
    .filter(([key]) => lead[key])
    .map(([key, [label]]) => `<p><strong>${label}</strong><br>${escapeHtml(lead[key]).replace(/\n/g, '<br>')}</p>`)
    .join('');
  await aptly(env, 'email/send', {
    userId: APTLY_REFERRAL_USER_ID,
    channelId: APTLY_REFERRAL_CHANNEL_ID,
    failOnCreateNewThread: false,
    to: [{ value: MAILBOX }],
    subject: `Georgia agent referral · ${lead.requestId.slice(0, 8)}`,
    body,
  });
}

export default { path: '/api/agent-referral', validate, submit };
