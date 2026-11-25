let libraries;
function script(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.append(s)})}
export function mapLibraries(){if(!libraries)libraries=(async()=>{if(!window.L)await script('/vendor/leaflet/leaflet.js');if(!window.L.markerClusterGroup)await script('/vendor/leaflet-markercluster/leaflet.markercluster.js');return window.L})().catch(e=>{libraries=null;throw e});return libraries}
export async function createRentalMap(container,{onSelect,onTileError}={}){
 const L=await mapLibraries();container.replaceChildren();const map=L.map(container,{scrollWheelZoom:false,maxZoom:18}).setView([33,-85],6);
 let failed=false;const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
 tiles.on('tileerror',()=>{if(!failed){failed=true;onTileError?.()}});
 const group=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:55,spiderfyOnMaxZoom:true,iconCreateFunction:cluster=>L.divIcon({className:'rental-cluster',html:`<span>${cluster.getChildCount()}</span><small>HOMES</small>`,iconSize:[56,56],iconAnchor:[28,28]})}).addTo(map);
 const markers=new Map();let activeId=null;
 function highlight(id){if(activeId){const previous=markers.get(activeId);previous?.getElement()?.classList.remove('active');if(previous)group.getVisibleParent(previous)?.getElement()?.classList.remove('active')}activeId=id;const marker=markers.get(id);marker?.getElement()?.classList.add('active');if(marker)group.getVisibleParent(marker)?.getElement()?.classList.add('active')}
 group.on('animationend',()=>highlight(activeId));
 const resize=new ResizeObserver(()=>map.invalidateSize());resize.observe(container);
 return {highlight,resize:()=>map.invalidateSize(),destroy(){resize.disconnect();map.remove()},update(homes){group.clearLayers();markers.clear();for(const h of homes){if(h.lat===null||h.lng===null)continue;const price=h.price===null?'View home':'$'+Math.round(h.price).toLocaleString('en-US');const marker=L.marker([h.lat,h.lng],{title:h.address,keyboard:true,icon:L.divIcon({className:'rental-pin',html:`<span>${price}</span>`,iconSize:[84,34],iconAnchor:[42,17]})});marker.on('click',()=>onSelect?.(h.id));marker.on('keypress',event=>{if(event.originalEvent?.key==='Enter')onSelect?.(h.id)});markers.set(h.id,marker);group.addLayer(marker)}if(markers.size)map.fitBounds(group.getBounds(),{padding:[50,50],maxZoom:14});else map.setView([33,-85],6);highlight(activeId)}};
}
