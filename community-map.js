const container=document.querySelector('#community-map');
if(container){
 let loaded=false;
 new IntersectionObserver(async(entries,observer)=>{
  if(!entries.some(e=>e.isIntersecting)||loaded)return;loaded=true;observer.disconnect();
  try{
   const cities=Array.from(container.closest('section').querySelectorAll('a[data-city][data-lat][data-lng]'),card=>({
    card,lat:Number(card.dataset.lat),lng:Number(card.dataset.lng),
    name:card.querySelector('strong').textContent,route:card.getAttribute('href')
   }));
   await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/vendor/leaflet/leaflet.js';s.onload=resolve;s.onerror=reject;document.head.append(s)});
   container.textContent='';const L=window.L;const map=L.map(container,{scrollWheelZoom:false}).fitBounds(cities.map(c=>[c.lat,c.lng]),{padding:[65,65]});
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
   for(const c of cities){
    const marker=L.marker([c.lat,c.lng],{keyboard:false,icon:L.divIcon({className:'community-pin',html:`<a href="${c.route}">${c.name}</a>`})}).addTo(map);
    const card=c.card;
    for(const event of ['mouseenter','focus'])card.addEventListener(event,()=>marker.getElement()?.classList.add('active'));
    for(const event of ['mouseleave','blur'])card.addEventListener(event,()=>marker.getElement()?.classList.remove('active'));
   }
   new ResizeObserver(()=>map.invalidateSize()).observe(container);
  }catch{container.innerHTML='<p>The map is temporarily unavailable. Explore the communities using the links below.</p>'}
 },{rootMargin:'250px'}).observe(container);
}
