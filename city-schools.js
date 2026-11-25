import {mountSchoolSelect} from './boardui-filters.js?v=school-selects';
import {mapLibraries} from './listing-map.js';
import {showLoading} from './loading-logo.js?v=chevrons-1';
export function initSchoolFinder(root,{endpoint='/api/schools/stockbridge',home=null}={}){
if(!root)return;
 const status=document.getElementById('school-status'),retry=document.getElementById('school-retry'),filters=root.querySelector('.school-filters'),layout=root.querySelector('.school-layout'),list=document.getElementById('school-list'),type=document.getElementById('school-type'),level=document.getElementById('school-level');
 let publicDirectory=false;
 const credit=root.querySelector(".school-credit");
 let schools=[],partial=false,map,markers,loading=false,center=[33.5443,-84.2338];
 const node=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e};
 const safeURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&['greatschools.org','www.greatschools.org'].includes(u.hostname)&&!u.username&&!u.password?u.href:null}catch{return null}};
 function schoolMarkers(L){
  return L.markerClusterGroup({
   animate:false,showCoverageOnHover:false,maxClusterRadius:55,
   iconCreateFunction(group){
    const label=group.getChildCount()+' schools';
    return L.divIcon({className:'school-group-pin',html:label,iconSize:[68,30],iconAnchor:[34,15]});
   }
  });
 }
 async function render(){
  const visible=schools.filter(s=>(type.value==='all'||s.type===type.value)&&(level.value==='all'||s.levels.includes(level.value)));list.replaceChildren();
  status.textContent=publicDirectory ? visible.length+' nearby public schools · NCES school directory, 2024–25.' : visible.length+' nearby schools'+(partial?' · partial results':'');
  visible.forEach((school,i)=>{const item=node('li'),number=node('button',String(i+1));number.type='button';number.className='school-number';number.setAttribute('aria-label','Show '+school.name+' on the map');number.addEventListener('click',()=>{const marker=markers?.getLayers().find(layer=>layer.options.title===school.name);if(marker){map.setView(marker.getLatLng(),Math.max(15,map.getZoom()),{animate:false});if(home)marker.openPopup();else markers.zoomToShowLayer(marker,()=>marker.openPopup())}});const content=node('div'),url=safeURL(school.url),title=node(url?'a':'strong',school.name);if(url){title.href=url;title.target='_blank';title.rel='noopener noreferrer nofollow'}content.append(title,node('p',publicDirectory?'Public school':school.type+' · Grades '+(school.grades||'not supplied')),node('p',school.address));if(school.distance!==null&&school.distance!==undefined)content.append(node('p',school.distance+' miles away'));if(school.lat===null||school.lon===null)content.append(node('p','Map location unavailable'));item.append(number,content);list.append(item)});
  try{const L=await mapLibraries();if(!map){map=L.map('school-map',{scrollWheelZoom:false}).setView(center,12);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:18}).addTo(map);markers=(home?L.layerGroup():schoolMarkers(L)).addTo(map);new ResizeObserver(()=>map.invalidateSize()).observe(document.getElementById('school-map'))}markers.clearLayers();const bounds=[];if(home){const popup=node('strong',home.fullAddress);L.marker(center,{title:'This home: '+home.fullAddress,zIndexOffset:1000,icon:L.divIcon({className:'school-home-pin',html:'⌂',iconSize:[38,38],iconAnchor:[19,19]})}).addTo(markers).bindPopup(popup);bounds.push(center)}visible.forEach((s,i)=>{if(s.lat===null||s.lon===null)return;const point=[s.lat,s.lon],popup=node('div'),url=safeURL(s.url),link=node(url?'a':'strong',s.name);if(url){link.href=url;link.target='_blank';link.rel='noopener noreferrer nofollow'}popup.append(link,node('p',publicDirectory?'Public school':s.type+' · Grades '+(s.grades||'not supplied')));L.marker(point,{title:s.name,icon:L.divIcon({className:'school-pin',html:String(i+1),iconSize:[30,30],iconAnchor:[15,15]})}).addTo(markers).bindPopup(popup);bounds.push(point)});if(bounds.length)map.fitBounds(bounds,{padding:[25,25],maxZoom:14,animate:false});else map.setView(center,12);map.invalidateSize()}
  catch{document.getElementById('school-map').textContent='The map could not load. Use the school list to explore nearby schools.'}
 }
 async function load(){if(loading)return;loading=true;retry.hidden=true;showLoading(status,'Loading nearby schools…');try{const response=await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(65000)});if(!response.ok)throw Error();const data=await response.json();if(!Array.isArray(data.schools))throw Error();publicDirectory=false;if(credit)credit.hidden=false;schools=data.schools;partial=data.partial;center=[data.center.lat,data.center.lon];filters.hidden=false;layout.hidden=false;await render()}catch{status.textContent='School information is temporarily unavailable. Please retry or visit GreatSchools.org.';retry.hidden=false;
   if(['/api/schools/atlanta','/api/schools/stockbridge','/api/schools/fayetteville','/api/schools/mcdonough'].includes(endpoint)){
    try{
     const directory=await fetch('/data/'+endpoint.split('/').pop()+'-public-schools.json');
     if(!directory.ok)throw Error();
     schools=await directory.json();publicDirectory=true;
     type.value=level.value='all';filters.hidden=true;layout.hidden=false;
     if(credit)credit.hidden=true;
     await render();retry.hidden=true;
    }catch{status.textContent='School information is temporarily unavailable. Please retry.'}
   }
  }finally{loading=false}}
 type.addEventListener('change',render);level.addEventListener('change',render);retry.addEventListener('click',load);
 mountSchoolSelect(type,'School type');
 mountSchoolSelect(level,'Grade level');
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();load()}},{rootMargin:'300px'});observer.observe(root);
}

const cityFinder=document.getElementById("nearby-schools");
if(cityFinder)initSchoolFinder(cityFinder,{endpoint:"/api/schools/"+(cityFinder.dataset.schoolCity||"stockbridge")});
