import './city-schools.js?v=mcdonough';
import {mountCityGuideNav} from './boardui-filters.js?v=site-edge-1';

const root = document.getElementById('stockbridge-guide-nav');
const sections = Array.from(root.querySelectorAll('.city-guide-links a'), link => ({
  id: link.hash.slice(1),
  label: link.textContent
}));
const response = await fetch('/data/georgia-cities.json');
if (response.ok) {
  const cities = await response.json();
  mountCityGuideNav(root, {sections, cities, currentRoute: root.querySelector('.guide-current-city').getAttribute('href')});
}
