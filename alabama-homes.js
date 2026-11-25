import { filterListings, getListings, money } from './listing-data.js';

const section = document.querySelector('#alabama-rentals');
const cities = section.querySelector('.al-cities');
const featured = section.querySelector('.al-featured');
const status = section.querySelector('.al-status');

function element(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function homeCard(home) {
  const card = document.createElement('a');
  card.href = home.detailHref;
  if (home.photos.length) {
    const photo = document.createElement('img');
    photo.src = home.photos[0];
    photo.alt = '';
    photo.loading = 'lazy';
    card.append(photo);
  }
  const copy = document.createElement('div');
  const facts = [
    home.beds !== null && home.beds + ' beds',
    home.baths !== null && home.baths + ' baths'
  ].filter(Boolean);
  copy.append(element('strong', money(home.price) + (home.price === null ? '' : ' / month')),
    element('h3', home.address), element('p', [home.city, ...facts].filter(Boolean).join(' · ')));
  card.append(copy);
  return card;
}

async function loadHomes() {
  try {
    const homes = filterListings(await getListings(), {state: 'AL', sort: 'photos'});
    const counts = new Map();
    for (const home of homes) {
      const city = home.city.trim();
      if (city) counts.set(city, (counts.get(city) || 0) + 1);
    }
    const ranked = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    cities.replaceChildren(...ranked.slice(0, 3).map(([city, count]) => {
      const link = element('a', city + ' · ' + count + (count === 1 ? ' home' : ' homes') + ' ›');
      link.href = '/alabama-homes-for-rent/?' + new URLSearchParams({city});
      return link;
    }));
    featured.replaceChildren(...homes.slice(0, 3).map(homeCard));
    status.textContent = homes.length ? '' : 'There are currently no published Alabama rentals.';
  } catch {
    status.textContent = 'Featured rentals are temporarily unavailable. ';
    const retry = element('button', 'Try again');
    retry.type = 'button';
    retry.onclick = () => { status.textContent = 'Loading available homes…'; loadHomes(); };
    status.append(retry);
  }
}
loadHomes();
