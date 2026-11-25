import './owner-inquiry.js?v=chevrons-1';
import {showLoading} from './loading-logo.js?v=chevrons-1';
import {getListings,filterListings} from './listing-data.js?v=chevrons-1';
import {createCard} from './listing-card.js?v=chevrons-1';
const section=document.querySelector('[data-rental-city]');
function node(tag,text,className){const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el}
function ownerInvitation(city) {
 const card=node('article', '', 'city-owner-invitation');
 const image=node('img');
 image.src='/assets/owner-management-still.png';
 image.alt='';
 image.loading='lazy';
 const copy=node('div');
 const action=node('a','Ask about property management ›','city-button');
 action.href='#'+document.querySelector('#city-owner-form').closest('section[id]').id;
 copy.append(node('h3','Your property'),node('p',`Own a rental in ${city}? Let All 3 Realty help you price, lease, and manage your home.`),action);
 card.append(image,copy);
 return card;
}
async function loadRentals(){
 const status=section.querySelector('[role=status]'),grid=section.querySelector('.city-rental-grid'),retry=section.querySelector('.rental-retry');
 showLoading(status,'Loading local homes…');retry.hidden=true;
 try{
  const homes=await getListings();const listings=filterListings(homes,{state:section.dataset.rentalState||'GA',city:section.dataset.rentalCity,sort:'photos'});const cards=listings.slice(0,3).map(h=>createCard(h));
  if(cards.length<3)cards.push(ownerInvitation(section.dataset.rentalCity));
  grid.replaceChildren(...cards);
  status.textContent=listings.length?'':'No available properties. Search all our listings for more homes.';
 }catch{status.textContent='We couldn’t load local rentals right now. Please try again, or search all our listings.';retry.hidden=false}
}
if(section){loadRentals();section.querySelector('.rental-retry').addEventListener('click',loadRentals)}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const statObserver=new IntersectionObserver((entries,observer)=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);if(reduce)continue;const el=entry.target,final=el.textContent,value=Number(el.dataset.value);el.setAttribute('aria-label',final);const start=performance.now();function frame(now){const t=Math.min((now-start)/850,1);el.textContent=(el.dataset.money==='true'?'$':'')+Math.round(value*(1-(1-t)**3)).toLocaleString('en-US');if(t<1)requestAnimationFrame(frame);else el.textContent=final}requestAnimationFrame(frame)}},{threshold:.5});
document.querySelectorAll('.city-stat').forEach(el=>statObserver.observe(el));
