export const MARKET_STORAGE_KEY='all3.market.v1';
export const MARKETS={
 georgia:{label:'Georgia',state:'GA',logo:'/assets/logo-georgia-white.png',phone:'678-782-7447',tel:'6787827447'},
 alabama:{label:'Alabama',state:'AL',logo:'/assets/logo-horizontal.png',phone:'334-593-3130',tel:'3345933130'}
};
export function validMarket(value){return Object.hasOwn(MARKETS,value)?value:null}
export function marketFromUrl(url){
 const state=url.pathname.match(/^\/rentals\/[^/]+\/(al|ga)\//)?.[1];
 if(state)return state==='al'?'alabama':'georgia';
 const path=url.pathname.match(/^\/markets\/(georgia|alabama)(?:\/|$)/);
 if(/^\/(?:montgomery|prattville)-property-management(?:\/|$)/.test(url.pathname))return 'alabama';
 const city=/^\/(atlanta|stockbridge|mcdonough|fayetteville|lithonia)-property-management(?:\/|$)/.test(url.pathname);
 const rental=url.pathname.match(/^\/(georgia|alabama)-homes-for-rent(?:\/|$)/);
 return path?.[1]||rental?.[1]||(city?'georgia':null)||validMarket(url.searchParams.get('market'));
}
export function resolveMarket(url,saved){return marketFromUrl(url)||validMarket(saved)}
export function switchMarketUrl(url,market){
 if(!validMarket(market))throw new Error('Choose Georgia or Alabama');
 const next=new URL(url);
 if(/^\/(?:georgia-|alabama-)?homes-for-rent(?:\/|$)/.test(next.pathname)){next.pathname=`/${market}-homes-for-rent/`;next.searchParams.delete('city');next.searchParams.delete('market');return next.pathname+next.search;}
 if(next.pathname.startsWith('/markets/georgia/residents/notice/')&&market==='alabama')return '/markets/alabama/';
 if(next.pathname==='/rental/'||next.pathname.startsWith('/rentals/')){return `/${market}-homes-for-rent/`}
 if(/^\/(prattville|montgomery|atlanta|stockbridge|mcdonough|fayetteville|lithonia)-property-management(?:\/|$)/.test(next.pathname))return `/markets/${market}/`;
 if(['/markets/georgia/owners','/markets/georgia/residents','/calculators'].includes(next.pathname.replace(/\/$/,''))&&market==='alabama')return '/markets/alabama/';
 if(/^\/markets\/(georgia|alabama)(?:\/|$)/.test(next.pathname)){
  next.pathname=next.pathname.replace(/^\/markets\/(georgia|alabama)/,`/markets/${market}`);
  if(next.searchParams.has('market'))next.searchParams.set('market',market);
 }else if(next.pathname==='/'){
  next.pathname=`/markets/${market}/`;next.searchParams.delete('market');next.hash='';
 }else next.searchParams.set('market',market);
 return next.pathname+next.search+next.hash;
}
export function marketDestination(kind,market){
 if(kind==='team')return '/company/'+(validMarket(market)?'?market='+market:'');
 if(!validMarket(market))return '/#next-chapter';
 const residentRoot='/markets/'+market+'/residents/';
 const routes={
 current:residentRoot+(market==='georgia'?'#existing':''),
 future:residentRoot+'#future',
 qualifications:'/application-qualification/?market='+market,
 criteria:'/resident-selection-criteria/?market='+market,
 handbook:residentRoot+'#handbook',
 benefits:residentRoot+'#benefits-package',
 pets:residentRoot+'pet-policy/', notice:residentRoot+'notice/',
 maintenance:residentRoot+'maintenance/',residents:residentRoot,home:`/markets/${market}/`,listings:`/${market}-homes-for-rent/`,management:market==='georgia'?'/markets/georgia/owners/':'/markets/alabama/#owner-services',team:`/company/?market=${market}`,contact:`/company/?market=${market}#say-hello`};
 if(!Object.hasOwn(routes,kind))throw new Error('Unknown market destination');
 return routes[kind];
}
const residentGroups = [
 ['Current Residents', [
  ['current','Overview'], ['handbook','Resident Handbook'], ['benefits','Benefits Package'],
  ['pets','Pet Policy'], ['notice','Give Notice'], ['maintenance','Maintenance']
 ]],
 ['Future Residents', [
  ['future','Overview'], ['listings','Find a Home'], ['qualifications','Application Process'],
  ['criteria','Resident Selection Criteria'], ['pets','Pet Policy']
 ]]
];

const ownerGroups = [
 ['Owner Resources', [
  ['management','Overview'],
  ['/markets/georgia/owners/#owner-faq','Georgia Owner FAQs'],
  ['/markets/georgia/owners/#rental-analysis','Free Georgia Rental Analysis']
 ]],
 ['Owner Calculators', [
  ['/calculators/?market=georgia#rent-vs-sell','Rent vs. Sell'],
  ['/calculators/?market=georgia#management-fee-roi','Management Fee ROI'],
  ['/calculators/?market=georgia#eviction-cost','Eviction Cost'],
  ['/calculators/?market=georgia#rent-reduction','Rent Reduction']
 ]]
];

function installNavigationMenu(parentRoute,groups){
 for(const link of document.querySelectorAll(`.header a[data-market-route="${parentRoute}"]`)){
  const group=document.createElement('div');
  group.className='resident-nav-group';
  const menu=document.createElement('details');
  const toggle=document.createElement('summary');
  toggle.textContent=link.textContent.trim();
  const chevron=document.createElement('span');
  chevron.setAttribute('aria-hidden','true');
  toggle.append(chevron);
  const links=document.createElement('div');
  links.className='resident-nav-links';
  for(const [title,resources] of groups){
   const column=document.createElement('div');
   column.setAttribute('role','group');
   column.setAttribute('aria-label',title);
   const heading=document.createElement('strong');
   heading.textContent=title;
   column.append(heading);
   for(const [route,label] of resources){
    const item=document.createElement('a');
    if(route.startsWith('/'))item.href=route;
    else item.dataset.marketRoute=route;
    item.textContent=label;
    if(label==='Overview')item.setAttribute('aria-label',title+' Overview');
    column.append(item);
   }
   links.append(column);
  }
  menu.append(toggle,links);
  link.replaceWith(group);
  group.append(menu);
  menu.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&menu.open){event.stopPropagation();menu.open=false;toggle.focus()}
  });
  group.addEventListener('focusout',event=>{if(!group.contains(event.relatedTarget))menu.open=false});
  document.addEventListener('click',event=>{if(!group.contains(event.target)||event.target.closest('.resident-nav-links a'))menu.open=false});
 }
}

export function initMarketContext(){
 installNavigationMenu('management',ownerGroups);
 installNavigationMenu('residents',residentGroups);
 let stored=null;
 try{stored=localStorage.getItem(MARKET_STORAGE_KEY)}catch{}
 let market=resolveMarket(new URL(location.href),stored);
 function save(value){try{localStorage.setItem(MARKET_STORAGE_KEY,value)}catch{}}
 function render(persist=true){
  if(market&&persist)save(market);
  document.documentElement.dataset.market=market||'';
  const config=MARKETS[market];
  document.querySelectorAll('[data-market-label]').forEach(el=>el.textContent=config?.label||'Markets');
  document.querySelectorAll('.market-switcher>summary').forEach(el=>el.setAttribute('aria-label',`Choose market. Current market: ${config?.label||'not selected'}`));
  const logo=document.querySelector('.header .brand img');
  if(logo){logo.src=config?.logo||'/assets/logo-horizontal.png';logo.alt=config?`All 3 Realty — ${config.label}`:'All 3 Realty'}
  document.querySelectorAll('[data-market-route]').forEach(el=>el.href=marketDestination(el.dataset.marketRoute,market));
  document.querySelectorAll('[data-select-market]').forEach(el=>{
   const target=el.dataset.selectMarket;
   if(el.closest('.market-switcher')){
    el.href=switchMarketUrl(new URL(location.href),target);
    if(target===market)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');
   }
  });
  // Future shared-page links can opt into the same market context without
  // duplicating their page template or changing unrelated/external links.
  document.querySelectorAll('[data-shared-page]').forEach(el=>{
   const url=new URL(el.getAttribute('href'),location.origin);
   if(market&&url.origin===location.origin){url.searchParams.set('market',market);el.href=url.pathname+url.search+url.hash}
  });
  window.dispatchEvent(new CustomEvent('all3:marketchange',{detail:{market}}));
 }
 document.addEventListener('click',event=>{
  const choice=event.target.closest('[data-select-market]');
  if(!choice||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const value=validMarket(choice.dataset.selectMarket);
  if(value){market=value;save(value)}
 });
 window.addEventListener('pageshow',()=>{market=resolveMarket(new URL(location.href),market);render()});
 window.addEventListener('storage',event=>{if(event.key===MARKET_STORAGE_KEY){market=resolveMarket(new URL(location.href),event.newValue);render(false)}});
 render();
 return {getMarket:()=>market};
}
