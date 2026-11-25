import {mountListingFilters} from './boardui-filters.js?v=chevrons-1';
import {getListings,filterListings,affordableRent,money,PORTAL} from './listing-data.js?v=chevrons-1';
import {el,link,createCard,photoCarousel,shareHome} from './listing-card.js?v=chevrons-1';
import {createRentalMap,mapLibraries} from './listing-map.js?v=chevrons-1';
const $=id=>document.getElementById(id);
const scope=document.querySelector('.rental-search');let homes=[],filtered=[],map,loadVersion=0,view='list',opener=null,compareMaps=[],compareVersion=0;const selected=new Map();
const defaults=()=>({q:'',state:scope.dataset.defaultState,city:'',min:'',max:'',beds:0,baths:0,exact:false,sort:'photos'});
let filterValue=defaults(),board,filterTimer;
function filters(){return filterValue}
function readURL(){
 const p=new URLSearchParams(location.search);filterValue=defaults();
 for(const k of ['q','city','min','max'])filterValue[k]=p.get(k)||'';
 filterValue.sort=['default','price-asc','price-desc','photos'].includes(p.get('sort'))?p.get('sort'):'photos';
 filterValue.beds=[0,1,2,3,4,5].includes(Number(p.get('beds')))?Number(p.get('beds')):0;
 filterValue.baths=[0,1,1.5,2,3,4].includes(Number(p.get('baths')))?Number(p.get('baths')):0;
 filterValue.exact=p.get('exact')==='1';view=p.get('view')==='map'?'map':'list';
 if(homes.length)render(false);else updateBoard();setView(view,false);
}
function writeURL(){const f=filters(),p=new URLSearchParams();for(const k of ['q','city','min','max'])if(f[k]!=='')p.set(k,f[k]);if(f.beds)p.set('beds',f.beds);if(f.baths)p.set('baths',f.baths);if(f.exact)p.set('exact','1');if(f.sort!=='photos')p.set('sort',f.sort);if(view==='map')p.set('view','map');const url=location.pathname+(p.size?'?'+p:'');if(url!==location.pathname+location.search)history.pushState(null,'',url)}
function onFiltersChange(next){const delay=next.q!==filterValue.q?250:next.min!==filterValue.min||next.max!==filterValue.max?80:0;filterValue=next;clearTimeout(filterTimer);updateBoard();if(delay)filterTimer=setTimeout(()=>render(),delay);else render()}
function resetFilters(){clearTimeout(filterTimer);filterValue=defaults();render()}
function changeMarket(state){if(state===filterValue.state)return;const path=state==='GA'?'/georgia-homes-for-rent/':state==='AL'?'/alabama-homes-for-rent/':'/homes-for-rent/';const p=new URLSearchParams(location.search);p.delete('city');location.href=path+(p.size?'?'+p:'')}
function openAfford(button){opener=button;$('afford-dialog').showModal()}
function updateBoard(){board?.update({homes,value:filterValue,count:filtered.length,onChange:onFiltersChange,onMarket:changeMarket,onAfford:openAfford,onReset:resetFilters})}
board=mountListingFilters($('boardui-filter-root'),{homes,value:filterValue,count:0,onChange:onFiltersChange,onMarket:changeMarket,onAfford:openAfford,onReset:resetFilters});
function setView(next,update=true){view=next;$('rental-layout').dataset.view=view;document.querySelectorAll('[data-view]').forEach(b=>{if(b.tagName==='BUTTON')b.setAttribute('aria-pressed',String(b.dataset.view===view))});if(view==='map'){map?.resize();map?.update(filtered)}if(update)writeURL()}
function active(id){document.querySelectorAll('.home-card.active').forEach(c=>c.classList.remove('active'));if(id)$('home-'+id)?.classList.add('active');map?.highlight(id)}
function selectPin(id){setView('list',false);const card=$('home-'+id);if(card){active(id);card.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});card.focus({preventScroll:true})}}
function render(update=true){
 const f=filters();const invalid=[f.min,f.max].some(v=>v!==''&&(!Number.isFinite(Number(v))||Number(v)<0))||(f.min!==''&&f.max!==''&&Number(f.min)>Number(f.max));
 filtered=invalid?[]:filterListings(homes,f);if(update)writeURL();
 $('results-title').textContent=f.city?'Homes in '+f.city:f.state==='GA'?'Homes in Georgia':f.state==='AL'?'Homes in Alabama':'Homes in Georgia & Alabama';
 $('results-count').textContent=filtered.length+' '+(filtered.length===1?'home':'homes');
 $('rental-cards').replaceChildren(...filtered.map(h=>createCard({...h,detailHref:h.detailHref+'?returnTo='+encodeURIComponent(location.pathname+location.search)},{onCompare:toggleCompare,selected:selected.has(h.id),onActive:active})));
 $('rental-empty').hidden=filtered.length>0;updateBoard();map?.update(filtered);
 const missing=filtered.filter(h=>h.lat===null).length;
 if(missing)$('map-message').textContent=missing+' matching '+(missing===1?'home has':'homes have')+' no map location; all remain in the list.';
 else if(!$('map-message').dataset.tileError)$('map-message').textContent='';
}
function toggleCompare(h){if(selected.has(h.id))selected.delete(h.id);else if(selected.size<3)selected.set(h.id,h);else{$('compare-status').textContent='You can compare up to three homes. Remove one to choose another.';return}updateCompare()}
function updateCompare(){$('compare-status').textContent='';$('comparison-bar').hidden=selected.size===0;document.body.classList.toggle('has-comparison',selected.size>0);$('selection-count').textContent=selected.size+' of 3 homes selected';document.querySelectorAll('.home-card').forEach(card=>{const b=card.querySelector('button[aria-pressed]');if(b)b.setAttribute('aria-pressed',String(selected.has(card.dataset.id)))})}
async function compare(){const version=++compareVersion;opener=$('open-compare');const table=$('compare-table');table.replaceChildren();table.style.setProperty('--columns',selected.size);const items=[...selected.values()];
 const row=content=>{items.forEach((h,i)=>{const cell=el('div',null,'compare-cell');cell.append(content(h,i));table.append(cell)})};
 row(h=>{const photo=photoCarousel(h);photo.append(el('span',h.availability,'availability-badge'));return photo});row(h=>{const box=el('div');box.append(el('h3',h.title),el('p',h.fullAddress));return box});
 row(h=>{const box=el('div',null,'compare-actions');const share=el('button','Share');share.type='button';share.setAttribute('aria-label','Share '+h.address);share.addEventListener('click',()=>shareHome(h,share));box.append(link('Schedule tour ›',h.tourUrl||PORTAL,'home-action'),share,link('View details ›',h.detailHref));return box});
 const facts=[['Monthly rent',h=>money(h.price)],['Bedrooms',h=>h.beds??'Contact for details'],['Bathrooms',h=>h.baths??'Contact for details'],['Square feet',h=>h.area?.toLocaleString()??'Contact for details'],['Availability',h=>h.availability],['Lease term',()=> 'Contact for details'],['Pets',h=>h.pets],['Security deposit',h=>h.deposit===null?'Contact for details':money(h.deposit)],['Application fee',h=>h.applicationFee===null?'Contact for details':money(h.applicationFee)],['Laundry',()=> 'Contact for details'],['Parking',()=> 'Contact for details']];
 for(const [label,value] of facts)row(h=>{const box=el('div');box.append(el('small',label),el('strong',String(value(h))));return box});
 row(h=>{const box=el('div');box.append(el('h4','Amenities'));if(h.amenities.length){const list=el('ul');h.amenities.forEach(v=>list.append(el('li',v)));box.append(list)}else box.append(el('p','Contact All 3 Realty for amenity details.'));return box});
 const mapContainers=[];row(h=>{const box=el('div');box.append(el('h4','Location'));const canvas=el('div',null,'comparison-map');box.append(canvas,el('p',h.fullAddress));if(h.lat!==null)mapContainers.push([canvas,h]);else canvas.textContent='Contact for map location';return box});
 $('compare-dialog').showModal();
 try{const L=await mapLibraries();if(!$('compare-dialog').open||version!==compareVersion)return;for(const [canvas,h] of mapContainers){const m=L.map(canvas,{scrollWheelZoom:false}).setView([h.lat,h.lng],13);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(m);L.circleMarker([h.lat,h.lng],{radius:8,color:'#152c4f',fillColor:'#152c4f',fillOpacity:1}).addTo(m);compareMaps.push(m)}}catch{mapContainers.forEach(([canvas])=>canvas.textContent='Map unavailable. See the property address below.')}
}
$('open-compare').addEventListener('click',compare);$('clear-compare').addEventListener('click',()=>{selected.clear();updateCompare()});
for(const dialog of document.querySelectorAll('dialog')){dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{if(dialog.id==='compare-dialog'){compareVersion++;compareMaps.forEach(m=>m.remove());compareMaps=[]}opener?.focus()})}
let ceiling=null;document.querySelector('.afford-trigger').addEventListener('click',e=>{openAfford(e.currentTarget)});$('afford-form').addEventListener('submit',e=>{e.preventDefault();try{const data=new FormData(e.target);ceiling=affordableRent(data.get('income'),data.get('period'));$('afford-result').textContent='Estimated base-rent ceiling: '+money(Math.floor(ceiling*100)/100)+' per month. Based on gross monthly household income ÷ 3.';$('apply-afford').hidden=false}catch(err){$('afford-result').textContent=err.message;$('apply-afford').hidden=true;ceiling=null}});$('apply-afford').addEventListener('click',()=>{if(ceiling===null)return;filterValue={...filterValue,max:String(Math.floor(ceiling*100)/100),min:filterValue.min!==''&&Number(filterValue.min)>ceiling?'':filterValue.min};$('afford-dialog').close();render();$('results-title').scrollIntoView({block:'start'})});
$('show-all-map').addEventListener('click',()=>map?.update(filtered));document.querySelectorAll('button[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));window.addEventListener('popstate',readURL);
async function load(retry=false){const version=++loadVersion;$('rental-loading').hidden=false;$('feed-error').hidden=true;$('rental-layout').hidden=true;try{homes=await getListings(retry);if(version!==loadVersion)return;$('rental-loading').hidden=true;$('rental-layout').hidden=false;render(false);if(!map){try{map=await createRentalMap($('rental-map'),{onSelect:selectPin,onTileError:()=>{$('map-message').dataset.tileError='true';$('map-message').textContent='Map tiles are temporarily unavailable. All matching homes remain in the list.'}});map.update(filtered)}catch{$('rental-map').textContent='The map is unavailable. Browse all matching homes in the list.'}}}catch{$('rental-loading').hidden=true;$('feed-error').hidden=false;$('results-count').textContent='Homes unavailable'}}
$('retry-feed').addEventListener('click',()=>load(true));readURL();load();
new ResizeObserver(entries=>{document.documentElement.style.setProperty('--toolbar-height',(entries[0].borderBoxSize?.[0]?.blockSize||82)+'px')}).observe(document.querySelector('.rental-toolbar'));
