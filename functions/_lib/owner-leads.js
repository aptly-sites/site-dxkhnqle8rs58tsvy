// Port of server/owner_leads.py: validate an owner inquiry, map it onto the Aptly board, submit it.
import { aptly, need } from './aptly.js';
import { EMAIL, UserError, escapeHtml, length } from './http.js';

const PROPERTY_TYPES = new Set(['Single Family Home', 'Condo', 'Townhouse', 'Apartment or Studio', 'Duplex', 'Triplex', 'Building Complex', 'Other']);
const GOALS = new Set(["Understand my home's rental value", 'Get my home ready to rent', 'Find a new property manager', 'Lease my vacant home', 'Discuss ongoing management']);
const CITIES = new Set(['Atlanta', 'Stockbridge', 'McDonough', 'Fayetteville', 'Lithonia', 'Montgomery', 'Prattville']);
const CALCULATORS = { 'rent-vs-sell': 'Rent vs. Sell', 'management-fee-roi': 'Management Fee ROI', 'eviction-cost': 'Eviction Cost', 'rent-reduction': 'Rent Reduction' };
// Python: {str(n/2) for n in range(1,17)} | {str(n) for n in range(1,9)}  ->  0.5, 1.0 ... 8.0 and 1 ... 8
const BATHROOMS = new Set([
  ...Array.from({ length: 16 }, (_, i) => ((i + 1) / 2).toFixed(1)),
  ...Array.from({ length: 8 }, (_, i) => String(i + 1)),
]);
const LIMITS = {
  name: 120, email: 254, phone: 30, address: 300, message: 2000, city: 30, pageUrl: 500, pageTitle: 180,
  formSource: 180, requestId: 64, propertyType: 60, bedrooms: 4, bathrooms: 4, goal: 100, formVersion: 5,
  calculatorType: 50, calculatorSummary: 6000, includeResults: 5,
};

// Python: str(raw.get(k, '')).strip()
function text(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') throw new UserError('Please check the form.');
  return String(value).trim();
}

export function validate(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new UserError('Please check the form.');
  if (raw.website) return null; // honeypot
  const lead = {};
  for (const key of Object.keys(LIMITS)) lead[key] = text(raw[key]);
  if (Object.entries(LIMITS).some(([key, max]) => length(lead[key]) > max)) throw new UserError('Please shorten your entries.');
  if (length(lead.name) < 2 || !EMAIL.test(lead.email) || length(lead.address) < 12) {
    throw new UserError('Please enter your name, a valid email, and the full rental address.');
  }
  if (!CITIES.has(lead.city) && !['Georgia', 'Alabama'].includes(lead.city)) throw new UserError('Choose a supported city.');
  if (lead.formVersion === '2' || ['propertyType', 'bedrooms', 'bathrooms', 'goal'].some(key => lead[key])) {
    if (!PROPERTY_TYPES.has(lead.propertyType) || !GOALS.has(lead.goal)) throw new UserError('Please choose your property type and main goal.');
    if (!/^(?:[0-9]|10)$/.test(lead.bedrooms)) throw new UserError('Please choose the bedroom count.');
    if (!BATHROOMS.has(lead.bathrooms)) throw new UserError('Please choose the bathroom count.');
  }
  if (lead.phone && !/^[+()\d\s.\-]{7,30}$/.test(lead.phone)) throw new UserError('Please check your phone number.');

  let parsed;
  try {
    parsed = new URL(lead.pageUrl);
  } catch {
    throw new UserError('Please reload this page.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new UserError('Please reload this page.');
  const route = parsed.pathname.replace(/\/+$/, '');
  if (CITIES.has(lead.city) && route === `/${lead.city.toLowerCase()}-property-management`) {
    lead.formSource = `${lead.city} City Owner Lead Form`;
    lead.calculatorType = '';
    lead.calculatorSummary = '';
    lead.includeResults = '';
  } else if ((lead.city === 'Georgia' && ['/markets/georgia', '/markets/georgia/owners'].includes(route)) || (lead.city === 'Alabama' && route === '/markets/alabama')) {
    lead.formSource = route === '/markets/georgia/owners' ? 'Georgia Owners — Free Rental Analysis' : `${lead.city} Homepage — Property Management Inquiry`;
    lead.calculatorType = '';
    lead.calculatorSummary = '';
    lead.includeResults = '';
  } else if (['Georgia', 'Alabama'].includes(lead.city) && route === '/property-management-services') {
    lead.formSource = `${lead.city} — Property Management Services Inquiry`;
    lead.calculatorType = '';
    lead.calculatorSummary = '';
    lead.includeResults = '';
  } else if (
    lead.city === 'Georgia' && route === '/calculators' &&
    parsed.searchParams.getAll('market').filter(Boolean).join('|') === 'georgia' &&
    Object.hasOwn(CALCULATORS, lead.calculatorType)
  ) {
    lead.formSource = `${CALCULATORS[lead.calculatorType]} Calculator — Georgia Owner Inquiry`;
    if (lead.includeResults !== 'true') lead.calculatorSummary = '';
    else if (!lead.calculatorSummary) throw new UserError('Update your calculator before including the scenario.');
  } else {
    throw new UserError('Please reload this page.');
  }
  if (!/^[a-f0-9-]{36}$/.test(lead.requestId)) throw new UserError('Please reload the form.');
  lead.market = ['Alabama', 'Montgomery', 'Prattville'].includes(lead.city) ? 'Alabama' : 'Georgia';
  return lead;
}

export function mappings(config) {
  const fields = config.fields;
  const field = (key, label, kind) => {
    const found =
      fields.find(f => f.uuid === key) ||
      fields.find(f => String(f.name ?? '').trim().toLowerCase() === label.toLowerCase());
    if (!found || found.type !== kind) throw new Error(`Board mapping unavailable: ${label}`);
    return found;
  };
  const option = (f, label) => {
    const match = (f.data ?? []).find(o => String(o.label).toLowerCase() === label.toLowerCase());
    if (!match) throw new Error(`Board option unavailable: ${label}`);
    return match.label;
  };
  const contact = field('contact', 'Contact', 'person');
  const address = field('address', 'Rental Address', 'address');
  const notes = field('description', 'Notes', 'rich-text');
  const stage = field('stage', 'Stage', 'stageselect');
  const source = field('leadSource', 'Referring Source', 'sourceselect');
  const service = field('managementService', 'Management Service', 'singleselect');
  const sourceLabel = (source.data ?? []).some(o => String(o.label).toLowerCase() === 'website') ? 'Website' : 'Other';
  return {
    contact: contact.uuid, address: address.uuid, notes: notes.uuid,
    stage: stage.uuid, stageValue: option(stage, 'New Lead'),
    source: source.uuid, sourceValue: option(source, sourceLabel),
    service: service.uuid, serviceValue: option(service, 'Full Management Services'),
    ownerType: config.options?.defaultContactType,
  };
}

export function payload(lead, config, contactId) {
  const f = mappings(config);
  const details = {
    Request: 'Property management inquiry', Market: lead.market, City: lead.city, 'Rental property': lead.address,
    Name: lead.name, Email: lead.email, Phone: lead.phone || 'Not supplied',
    'Property type': lead.propertyType || 'Not supplied', Bedrooms: lead.bedrooms || 'Not supplied',
    Bathrooms: lead.bathrooms || 'Not supplied', 'Owner goal': lead.goal || 'Not supplied',
    Message: lead.message || 'None', Source: 'Website', 'Form source': lead.formSource,
    Calculator: lead.calculatorType || 'Not included', 'Owner-supplied scenario': lead.calculatorSummary || 'Not included',
    'Page title': lead.pageTitle, 'Page URL': lead.pageUrl, 'Submission ID': lead.requestId,
  };
  const result = {
    name: `${lead.name} — ${lead.address}`,
    [f.contact]: { _id: contactId },
    [f.address]: { formattedAddress: lead.address },
    [f.stage]: f.stageValue,
    [f.source]: f.sourceValue,
    [f.service]: f.serviceValue,
    [f.notes]: Object.entries(details).map(([k, v]) => `<p><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</p>`).join(''),
  };
  for (const [label, value] of [['Bed Count', lead.bedrooms], ['Bath Count', lead.bathrooms]]) {
    const field = config.fields.find(v => String(v.name ?? '').trim().toLowerCase() === label.toLowerCase() && v.type === 'string');
    if (value && field) result[field.uuid] = value;
  }
  return result;
}

export async function submit(env, lead) {
  const { APTLY_OWNER_LEADS_BOARD_ID } = need(env, 'APTLY_API_TOKEN', 'APTLY_OWNER_LEADS_BOARD_ID');
  const board = encodeURIComponent(APTLY_OWNER_LEADS_BOARD_ID);
  const config = (await aptly(env, `board/${board}/configuration`)).data;
  const f = mappings(config);
  payload(lead, config, 'validation-only'); // fail before creating a contact if the board can't take the card
  const found = await aptly(env, 'contacts/by-email', { email: lead.email, limit: 1 });
  let contactId = (found.contacts ?? [])[0]?._id;
  if (!contactId) {
    const parts = lead.name.split(/\s+/);
    const body = { firstname: parts[0], lastname: parts.slice(1).join(' '), email: lead.email };
    if (f.ownerType) body.typeId = f.ownerType;
    else body.contactType = 'Owner';
    if (lead.phone) body.phone = [{ number: lead.phone, type: 'mobile' }];
    contactId = (await aptly(env, 'contacts', body))._id;
    if (!contactId) throw new Error('Contact confirmation missing');
  }
  const result = await aptly(env, `board/${board}`, payload(lead, config, contactId));
  if (!result.data?._id) throw new Error('Lead confirmation missing');
}

export default { path: '/api/owner-lead', validate, submit };
