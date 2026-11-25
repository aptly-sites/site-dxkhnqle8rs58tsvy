// Shared section rail for every public page, including registered city-guide stops.
const LABELS={'our-story':'About Us','meet-the-team':'Our Team','office-greeters':'Office Greeters','say-hello':'Our Offices','welcome':'Welcome','next-chapter':'Choose Your Market','local-team':'Local Expertise','owner-calculators':'Owner Calculators','community-reviews':'Reviews','owner-services':'Services','owner-markets':'Communities','owner-faq':'Owner FAQs','rental-analysis':'Rental Analysis','georgia-communities':'Communities','local-rentals':'Homes','nearby-communities':'Nearby Communities'};
const CLASSES=[['owners-hero','Welcome'],['hero','Welcome'],['city-hero','Welcome'],['rental-intro','Find a Home'],['rental-search','Available Homes'],['calculator-page','Owner Calculators'],['city-context','Living Here'],['city-numbers','Market & Demographics'],['city-care','Property Care'],['city-faq','Common Questions'],['city-nearby','Nearby Communities'],['guide-directory','Dining Guide']];
const slug=text=>text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function initSectionNavigation(){
 const main=document.querySelector('main');if(!main||document.querySelector('.site-section-nav'))return;
 const nav=document.createElement('nav');nav.className='site-section-nav';nav.setAttribute('aria-label','Page sections');
 const toggle=document.createElement('button');toggle.type='button';toggle.className='site-section-toggle';toggle.setAttribute('aria-label','Choose a page section');toggle.setAttribute('aria-expanded','false');toggle.innerHTML='<span aria-hidden="true">☰</span>';
 const list=document.createElement('div');list.className='site-section-links';list.id='site-section-links';toggle.setAttribute('aria-controls',list.id);nav.append(toggle,list);document.body.append(nav);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let sections=[],active='',peak=null,frame=0,discoverFrame=0,signature='',pendingHash=location.hash;
 function visible(el){return !el.closest('[hidden],dialog,[aria-hidden="true"]')&&getComputedStyle(el).display!=='none'}
 function register(el,label,preferred){
  if(!el.id){const base=preferred||slug(label)||'page-section';let id=base,n=2;while(document.getElementById(id)&&document.getElementById(id)!==el)id=base+'-'+n++;el.id=id}
  el.dataset.siteSection='true';return {id:el.id,label,el};
 }
 function discover(){
  discoverFrame=0;const next=[];
  const cityGuide=main.querySelector('.city-guide-nav');
  if(cityGuide){
   const welcome=main.querySelector('#welcome,.hero,.city-hero');if(welcome)next.push(register(welcome,'Welcome','welcome'));
   for(const a of cityGuide.querySelectorAll('.city-guide-links a')){const target=document.getElementById(a.hash.slice(1));if(target&&!next.some(s=>s.id===target.id))next.push(register(target,a.textContent.trim()))}
  }else if(main.querySelector('#rental-detail .detail-content')){
   const entries=[['.detail-gallery','Photos','listing-photos'],['.detail-content h1','Overview','listing-overview'],['.detail-virtual','Virtual Tour','virtual-tour']];
   for(const [selector,label,id]of entries){const el=main.querySelector(selector);if(el&&visible(el))next.push(register(el,label,id))}
   for(const h of main.querySelectorAll('.detail-content>h2'))if(visible(h))next.push(register(h,h.textContent.includes('extras')?'Amenities':'Description',h.textContent.includes('extras')?'listing-amenities':'listing-description'));
   for(const [selector,label]of [['#nearby-schools','Nearby Schools'],['.detail-related','More Homes']]){const el=main.querySelector(selector);if(el&&visible(el))next.push(register(el,label,slug(label)))}
  }else{
   for(const el of main.querySelectorAll('section')){
    if(el.parentElement.closest('section')||!visible(el))continue;
    const known=CLASSES.find(([cls])=>el.classList.contains(cls)),heading=el.querySelector('h1,h2');let label=LABELS[el.id]||known?.[1]||heading?.textContent.trim()||el.getAttribute('aria-label');
    if(!label)continue;if(el.id==='next-chapter'&&el.classList.contains('market-audience-section'))label='Owners & Renters';
    if(label.length>46)label=label.slice(0,43).trim()+'…';next.push(register(el,label,label==='Welcome'?'welcome':slug(label)));
    if(el.classList.contains('calculator-page')){const calculator=el.querySelector('#calculator-content');if(calculator&&visible(calculator)&&calculator.querySelector('h2'))next.push(register(calculator,calculator.querySelector('h2').textContent,'calculator-content'))}
   }
  }
  if(!next.length){const h=main.querySelector('h1');if(h&&visible(h))next.push(register(h,'Overview','overview'))}
  sections=next;const key=sections.map(s=>s.id+'|'+s.label).join(';');nav.hidden=!sections.length;
  if(key!==signature){signature=key;list.replaceChildren();for(const [index,s]of sections.entries()){
   const a=document.createElement('a');a.href='#'+s.id;a.setAttribute('aria-label',s.label);a.innerHTML='<span class="site-section-tick" aria-hidden="true"></span><span class="site-section-label"></span>';a.lastChild.textContent=s.label;
   a.addEventListener('pointerenter',()=>{peak=index;paint()});a.addEventListener('focus',()=>{peak=index;paint()});
   a.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();history.pushState({},'',location.pathname+location.search+'#'+encodeURIComponent(s.id));nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');s.el.scrollIntoView({block:'start',behavior:reduced.matches?'auto':'smooth'});queue()});list.append(a);
  }}
  update();if(pendingHash){const id=decodeURIComponent(pendingHash.slice(1)),target=document.getElementById(id);if(target&&main.contains(target)){pendingHash='';requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}))}}
 }
 function paint(){
  const links=[...list.querySelectorAll('a')];for(const [index,a]of links.entries()){
   const current=sections[index]?.id===active;if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
   const tick=a.firstChild;tick.style.width=(peak===null?(current?30:16):Math.max(16,52-Math.abs(index-peak)*12))+'px';tick.style.opacity=current||index===peak?'1':'.4';
   const box=a.getBoundingClientRect(),behind=document.elementsFromPoint(2,box.top+box.height/2).find(el=>!nav.contains(el));
   const dark=behind?.closest('.site-footer,.owner-inquiry-aside,[data-guide-theme="dark"],[data-section-theme="dark"],.city-hero');a.style.color=dark?'#fff':'#152c4f';
  }
 }
 function update(){
  frame=0;const header=document.querySelector('.header'),bottom=header?.getBoundingClientRect().bottom||100,guide=main.querySelector('.city-guide-nav'),clearance=guide?bottom+8+guide.getBoundingClientRect().height+24:bottom+24;document.documentElement.style.setProperty('--site-section-clearance',clearance+'px');
  nav.style.setProperty('--section-rail-top',Math.max(innerHeight/2,clearance+sections.length*17+12)+'px');
  const compact=sections.length*34>innerHeight-clearance-26;nav.classList.toggle('is-compact',compact);nav.style.setProperty('--section-menu-top',Math.min(innerHeight-70,Math.max(bottom+20,innerHeight/2))+'px');
  active=sections[0]?.id||'';for(const s of sections)if(s.el.getBoundingClientRect().top<=clearance+16)active=s.id;paint();
 }
 function queue(){if(!frame)frame=requestAnimationFrame(update)}
 function queueDiscover(){if(!discoverFrame)discoverFrame=requestAnimationFrame(discover)}
 nav.addEventListener('pointerleave',()=>{if(!nav.contains(document.activeElement)){peak=null;paint()}});nav.addEventListener('focusout',event=>{if(!nav.contains(event.relatedTarget)){peak=null;paint()}});
 toggle.addEventListener('click',()=>{const open=!nav.classList.contains('is-open');nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open))});
 document.addEventListener('click',event=>{if(!nav.contains(event.target)){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false')}});
 nav.addEventListener('keydown',event=>{if(event.key==='Escape'){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.focus()}});
 const mutations=new MutationObserver(queueDiscover);mutations.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});const resize=new ResizeObserver(queue);resize.observe(main);const header=document.querySelector('.header');if(header)resize.observe(header);
 window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);window.addEventListener('hashchange',()=>{pendingHash=location.hash;queueDiscover()});window.addEventListener('popstate',()=>{pendingHash=location.hash;queueDiscover()});
 discover();
}
