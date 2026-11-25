import {mapLibraries} from './listing-map.js';
const container=document.getElementById('owner-service-map');
if(container){
 const buttons=[...document.querySelectorAll('[data-service-market]')];
 const reset=document.querySelector('[data-service-reset]');
 const selection=document.querySelector('[data-service-selection]');
 const status=document.querySelector('[data-service-status]');
 let ready,selected;
 function describe(market){
  selected=market.slug;
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.serviceMarket===selected));
  const title=document.createElement('h4');title.textContent=market.name+', Georgia';
  const link=document.createElement('a');link.className='owners-text-link';link.href=market.route||'#rental-analysis';link.textContent=market.route?'Explore '+market.name+' ›':'Talk about your '+market.name+' property ›';
  selection.replaceChildren(title,link);
 }
 async function initialize(){
  if(ready)return ready;
  ready=(async()=>{
   const response=await fetch('/data/georgia-cities.json');if(!response.ok)throw new Error('Market data unavailable');
   const markets=await response.json();const L=await mapLibraries();
   container.replaceChildren();const map=L.map(container,{scrollWheelZoom:false,maxZoom:16});
   const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
   tiles.on('tileerror',()=>{status.textContent='Map tiles are temporarily unavailable. You can still select any community from the list.'});
   const group=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:65,disableClusteringAtZoom:11,iconCreateFunction:cluster=>L.divIcon({className:'owner-market-cluster',html:`<strong>${cluster.getChildCount()}</strong><span>markets</span>`,iconSize:[68,68]})}).addTo(map);
   const markers=new Map();
   for(const market of markets){
    const name=document.createElement('span');name.textContent=market.name;
    const marker=L.marker([market.lat,market.lng],{title:market.name,keyboard:true,icon:L.divIcon({className:'owner-market-pin',html:name.outerHTML,iconSize:[142,38],iconAnchor:[71,19]})});
    const popup=document.createElement('div');const title=document.createElement('strong');title.textContent=market.name+', Georgia';const link=document.createElement('a');link.href=market.route||'#rental-analysis';link.textContent=market.route?'Explore the community ›':'Get a rental analysis ›';popup.append(title,link);marker.bindPopup(popup);
    marker.on('click',()=>describe(market));markers.set(market.slug,marker);group.addLayer(marker);
   }
   const fit=()=>{map.closePopup();map.fitBounds(group.getBounds(),{padding:[80,55],maxZoom:9})};fit();reset.hidden=false;reset.addEventListener('click',fit);
   new ResizeObserver(()=>map.invalidateSize()).observe(container);
   return {map,group,markets,markers};
  })().catch(()=>{ready=null;container.replaceChildren();const message=document.createElement('p');message.textContent='The map could not load. Select a community below or try again.';const retry=document.createElement('button');retry.type='button';retry.textContent='Retry map';retry.addEventListener('click',()=>initialize());container.append(message,retry);return null});
  return ready;
 }
 for(const button of buttons)button.addEventListener('click',async()=>{
  const context=await initialize();
  if(context){const market=context.markets.find(m=>m.slug===button.dataset.serviceMarket);if(!market)return;describe(market);const marker=context.markers.get(market.slug);context.group.zoomToShowLayer(marker,()=>marker.openPopup());}
  else{const market={name:button.querySelector('.city-name').textContent,slug:button.dataset.serviceMarket};describe(market);}
 });
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();initialize()}},{rootMargin:'250px'});observer.observe(container)}else initialize();
}
