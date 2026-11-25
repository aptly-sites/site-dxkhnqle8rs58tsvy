import './venue-guide.js?v=chevrons-1';
import {mountCityGuideNav} from './boardui-filters.js?v=site-edge-1';
import './city-schools.js?v=public-directory-1';
const sections=[['living','Living Here'],['local-rentals','Homes'],['market','Market & Demographics'],['transportation','Transportation'],['attractions','Things To Do'],['dining','Dining'],['schools','Schools'],['rental-analysis','For Owners']].map(([id,label])=>({id,label}));
fetch('/data/georgia-cities.json').then(response=>response.json()).then(cities=>{
 mountCityGuideNav(document.getElementById('stockbridge-guide-nav'),{sections,currentRoute:'/stockbridge-property-management/',cities});
});
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const counters=new IntersectionObserver((entries,observer)=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);if(reduce)continue;const e=entry.target,final=e.textContent,started=performance.now(),value=Number(e.dataset.guideValue),decimals=Number(e.dataset.decimals);e.setAttribute('aria-label',final);const tick=now=>{const t=Math.min(1,(now-started)/900);e.textContent=e.dataset.prefix+(value*(1-(1-t)**3)).toLocaleString('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals})+e.dataset.suffix;if(t<1)requestAnimationFrame(tick);else e.textContent=final};requestAnimationFrame(tick)}},{threshold:.5});document.querySelectorAll('[data-guide-value]').forEach(e=>counters.observe(e));
