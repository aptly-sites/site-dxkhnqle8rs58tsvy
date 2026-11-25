import './accessibility.js';
import {initSectionNavigation} from './section-navigation.js?v=team-1';
import {initReviewWalls} from './review-wall.js?v=chevrons-1';
import {initMarketContext} from './market-context.js?v=team-1';
initMarketContext();
initSectionNavigation();
const video=document.querySelector('#street-film');
if(video){
const motion=document.querySelector('#motion');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduce.matches,visible=true;
function setMotion(){
 motion.setAttribute('aria-pressed',String(paused));
 motion.innerHTML=paused?'Play motion <span>▷</span>':'Pause motion <span>Ⅱ</span>';
 if(paused||!visible||document.hidden){video.pause();return;}
 video.play().then(()=>{video.classList.add('ready')}).catch(()=>{paused=true;video.pause();motion.setAttribute('aria-pressed','true');motion.innerHTML='Play motion <span>▷</span>'});
}
video.addEventListener('loadeddata',()=>{video.classList.add('ready');setMotion()});
video.addEventListener('error',()=>{video.classList.remove('ready');paused=true;setMotion()});
motion.addEventListener('click',()=>{paused=!paused;setMotion()});
reduce.addEventListener('change',()=>{paused=reduce.matches;setMotion()});
document.addEventListener('visibilitychange',setMotion);
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;setMotion()},{threshold:0}).observe(document.querySelector('.hero'));
setMotion();
}
const menu=document.querySelector('#mobile-menu');const toggle=document.querySelector('.menu-toggle');
function closeMenu(){menu.hidden=true;toggle.setAttribute('aria-expanded','false')}
toggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden))});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!menu.hidden){closeMenu();toggle.focus()}document.querySelectorAll('details[open]').forEach(el=>{el.open=false;el.querySelector('summary').focus()})}});
document.addEventListener('click',e=>{document.querySelectorAll('details[open]').forEach(el=>{if(!el.contains(e.target))el.open=false});if(!e.target.closest('.header'))closeMenu()});
document.querySelectorAll('#mobile-menu a').forEach(a=>a.addEventListener('click',closeMenu));

initReviewWalls();
