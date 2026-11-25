import {money,PORTAL} from './listing-data.js?v=chevrons-1';
export function el(tag,text,className){const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=text;if(className)n.className=className;return n}
export function link(text,href,className){const a=el('a',text,className);a.href=href;return a}
export function photoCarousel(home){
 const frame=el('div',null,'home-photo');let index=0;
 if(!home.photos.length){const placeholder=el('div',null,'photo-placeholder');const img=el('img');img.src='/assets/logo.svg';img.alt='';placeholder.append(img,el('span','Photos coming soon'));frame.append(placeholder);return frame}
 const img=el('img');img.src=home.photos[0];img.alt=home.fullAddress;img.loading='lazy';img.decoding='async';frame.append(link('',home.detailHref,'home-photo-link'));frame.firstChild.append(img);
 img.addEventListener('error',()=>{img.hidden=true;let fail=frame.querySelector('.photo-error');if(!fail){fail=el('span','Photo unavailable','photo-error');frame.append(fail)}});
 const count=el('span','1 / '+home.photos.length,'photo-count');frame.append(count);
 if(home.photos.length>1){for(const [label,step,glyph] of [['Previous photo',-1,'‹'],['Next photo',1,'›']]){const b=el('button',glyph,'photo-arrow '+(step<0?'prev':'next'));b.type='button';b.setAttribute('aria-label',label+' of '+home.address);b.addEventListener('click',()=>{index=(index+step+home.photos.length)%home.photos.length;img.src=home.photos[index];img.hidden=false;frame.querySelector('.photo-error')?.remove();count.textContent=(index+1)+' / '+home.photos.length});frame.append(b)}}
 return frame;
}
export async function shareHome(home,button){const original=button.textContent;const canonical=new URL(home.detailHref,location.origin);canonical.searchParams.delete('returnTo');const url=canonical.href;try{await navigator.clipboard.writeText(url);button.textContent='Copied';setTimeout(()=>button.textContent=original,1800)}catch{let field=button.parentElement.querySelector('.share-fallback');if(!field){field=el('input',null,'share-fallback');field.setAttribute('aria-label','Copy home link');field.readOnly=true;button.parentElement.append(field)}field.value=url;field.focus();field.select()}}
export function createCard(home,{onCompare,selected=false,onActive}={}){
 const card=el('article',null,'home-card');card.addEventListener('click',e=>{if(!e.target.closest('a,button,input'))location.href=home.detailHref});card.id='home-'+home.id;card.tabIndex=-1;card.dataset.id=home.id;card.setAttribute('aria-label',home.title);
 const photo=photoCarousel(home);const badge=el('span',home.availability,'availability-badge');photo.append(badge);
 const tools=el('div',null,'home-tools');const share=el('button','Share');share.type='button';share.setAttribute('aria-label','Share '+home.address);share.addEventListener('click',()=>shareHome(home,share));tools.append(share);
 if(onCompare){const compare=el('button','Compare');compare.type='button';compare.setAttribute('aria-label','Compare '+home.address);compare.setAttribute('aria-pressed',String(selected));compare.addEventListener('click',()=>onCompare(home));tools.append(compare)}
 photo.append(tools);card.append(photo);
 const body=el('div',null,'home-card-body');const rent=el('p',null,'home-price');rent.append(el('strong',money(home.price)));if(home.price!==null)rent.append(el('span',' / month'));body.append(rent);
 const facts=[home.beds===null?null:home.beds+' beds',home.baths===null?null:home.baths+' baths',home.area===null?null:home.area.toLocaleString()+' sq ft'].filter(Boolean).join(' · ');body.append(el('p',facts,'home-facts'));
 const h=el('h3');h.append(link(home.title,home.detailHref));body.append(h,el('p',home.fullAddress,'home-address'));
 const actions=el('div',null,'home-card-actions');actions.append(link('Schedule tour ›',home.tourUrl||PORTAL,'home-action'),link('Apply ›',home.applicationUrl||PORTAL,'home-action home-action-outline'));body.append(actions);card.append(body);
 if(onActive){card.addEventListener('mouseenter',()=>onActive(home.id));card.addEventListener('focusin',()=>onActive(home.id));card.addEventListener('mouseleave',()=>onActive(null));card.addEventListener('focusout',()=>onActive(null))}
 return card;
}
