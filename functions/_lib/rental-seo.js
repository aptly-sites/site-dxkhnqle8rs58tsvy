import { money } from '../../listing-data.js';

export const origin = 'https://www.all3realty.com';
export function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[char]);
}

export function listingHtml(template, home) {
  const url = origin + home.detailHref;
  const title = home.fullAddress + ' for Rent | All 3 Realty';
  const facts = [home.beds === null ? '' : home.beds + ' bedrooms', home.baths === null ? '' : home.baths + ' bathrooms', home.price === null ? '' : money(home.price) + ' per month'].filter(Boolean).join(' · ');
  const summary = [home.fullAddress, facts].filter(Boolean).join(' — ');
  const schema = {'@context':'https://schema.org', '@type':'RealEstateListing', url, name:title, description:summary, mainEntity:{
    '@type':'Residence', address:{'@type':'PostalAddress',streetAddress:home.address,addressLocality:home.city,addressRegion:home.state,postalCode:home.zip,addressCountry:'US'}
  }};
  const head = '<title>' + escape(title) + '</title><link rel="canonical" href="' + escape(url) + '"><meta name="description" content="' + escape(summary) + '"><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g,'\\u003c') + '</script>';
  const content = '<h1>' + escape(home.fullAddress) + '</h1><p>' + escape(facts) + '</p><p>' + escape(home.description) + '</p><a href="/homes-for-rent/">Browse available homes</a>';
  return template.replace(/<title>.*?<\/title>/, () => head)
    .replace(/id="rental-detail">.*?<\/div><\/div><dialog/s, () => 'id="rental-detail" data-listing-id="' + escape(home.id) + '">' + content + '</div><dialog');
}
