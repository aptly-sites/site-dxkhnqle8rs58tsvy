export const PORTAL='https://portal.getaptly.com/search/DXKHnQLE8RS58tSvy/';
export const FEED='https://app.getaptly.com/api/portal/listings/DXKHnQLE8RS58tSvy';
export const normalizeText=v=>String(v??'').trim().toLowerCase();
export function httpsUrl(value){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null}catch{return null}}
export function number(value){return value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))&&Number(value)>=0?Number(value):null}
export function moneyAmount(value){return value?.currency&&value.currency!=='USD'?null:number(value?.amount)===null?null:Number(value.amount)/100}
export function money(value){return value===null?'Contact for rent':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(value)}
export function dateLabel(value){if(!value)return 'Contact for availability';const date=new Date(value);if(!Number.isFinite(date.getTime()))return 'Contact for availability';return date<=new Date()?'Available now':'Available '+date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})}
function slug(value, fallback) {
 return String(value || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fallback;
}
export function listingPath(row) {
 const address = row.address || {};
 const street = [address.address || address.formattedAddress, address.address2].filter(Boolean).join(' ');
 return ['/rentals', slug(address.city, 'city'), slug(address.stateCode, 'state'), slug(street, 'home'), encodeURIComponent(row._id), ''].join('/');
}
export function normalizeListings(rows){
 const seen=new Set();return rows.filter(r=>r&&r._id&&r.publishedForRent!==false&&!seen.has(r._id)&&seen.add(r._id)).map(r=>{
  const a=r.address||{},photos=[...(Array.isArray(r.photo)?r.photo:[]),...(Array.isArray(r.marketingFiles)?r.marketingFiles:[])].map(v=>httpsUrl(typeof v==='string'?v:v?.url)).filter(Boolean);
  const coords=a.geopoint;const lng=Array.isArray(coords)?Number(coords[0]):NaN,lat=Array.isArray(coords)?Number(coords[1]):NaN;
  const geo=Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180&&lat!==0&&lng!==0;
  const title=String(r.marketingName||r.postingTitle||a.address||a.formattedAddress||'Home for rent').trim();
  const market=a.stateCode==='AL'?'alabama':a.stateCode==='GA'?'georgia':null;
  return {id:String(r._id),title,address:String(a.address||a.formattedAddress||'Contact for address'),fullAddress:String(a.formattedAddress||[a.address,a.city,a.stateCode,a.postalCode].filter(Boolean).join(', ')),city:String(a.city||''),state:String(a.stateCode||''),zip:String(a.postalCode||''),market,price:moneyAmount(r.marketRent),beds:number(r.beds),baths:number(r.baths),area:number(r.totalArea),photos:[...new Set(photos)],lat:geo?lat:null,lng:geo?lng:null,availableDate:r.availableDate||null,availability:dateLabel(r.availableDate),description:String(r.marketingDescription||''),amenities:Array.isArray(r.unitAmenities)?r.unitAmenities.filter(v=>typeof v==='string'):[],pets:Array.isArray(r.petRestrictions)&&r.petRestrictions.length?r.petRestrictions.join(' · '):typeof r.petsAllowed==='boolean'?(r.petsAllowed?'Contact for pet conditions':'Pets not allowed'):'Contact for pet policy',deposit:moneyAmount(r.deposit),applicationFee:moneyAmount(r.applicationFee),tourUrl:httpsUrl(r.showingUrl),applicationUrl:r.aptlyScreening?.active?httpsUrl(r.aptlyScreening.link):null,virtualTourUrl:httpsUrl(r.virtualTourUrl),detailHref:listingPath(r)};
 });
}
let request;
export function getListings(retry=false){if(retry)request=null;if(!request)request=fetch('/api/listings',{signal:AbortSignal.timeout(45000)}).then(async r=>{if(!r.ok)throw Error('Feed unavailable');const data=await r.json();if(!Array.isArray(data.data))throw Error('Invalid feed');return normalizeListings(data.data)}).catch(e=>{request=null;throw e});return request}
export function filterListings(rows,f={}){
 const q=normalizeText(f.q);return rows.filter(l=>(!f.state||l.state===f.state)&&(!f.city||normalizeText(l.city)===normalizeText(f.city))&&(!q||normalizeText([l.address,l.city,l.zip,l.title].join(' ')).includes(q))&&((f.min===''||f.min===undefined)||(l.price!==null&&l.price>=Number(f.min)))&&((f.max===''||f.max===undefined)||(l.price!==null&&l.price<=Number(f.max)))&&(!f.beds||l.beds!==null&&(f.exact?l.beds===Number(f.beds):l.beds>=Number(f.beds)))&&(!f.baths||l.baths!==null&&l.baths>=Number(f.baths))).sort((a,b)=>{
  if(f.sort==='price-asc'||f.sort==='price-desc'){if(a.price===null)return b.price===null?a.id.localeCompare(b.id):1;if(b.price===null)return -1;return (f.sort==='price-desc'?-1:1)*(a.price-b.price)||a.id.localeCompare(b.id)}
  if(f.sort==='photos')return b.photos.length-a.photos.length||a.id.localeCompare(b.id);
  return 0;
 });
}
export function histogram(rows){const prices=rows.map(l=>l.price).filter(v=>v!==null);const low=prices.length?Math.floor(Math.min(...prices)/25)*25:0;const high=prices.length?Math.max(low+25,Math.ceil(Math.max(...prices)/25)*25):5000;const bins=Array(16).fill(0);for(const p of prices)bins[Math.min(15,Math.floor((p-low)/(high-low)*16))]++;return {low,high,bins}}
export function affordableRent(income,period){const n=Number(income);if(income===''||!Number.isFinite(n)||n<=0||n>100000000||!['monthly','annual'].includes(period))throw Error('Enter a positive household income and choose monthly or annual.');return (period==='annual'?n/12:n)/3}
