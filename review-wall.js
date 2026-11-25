export function initReviewWalls(){
 document.querySelectorAll('.review-wall').forEach(wall=>{
  const pause=wall.querySelector('[data-review-pause]');
  const expand=wall.querySelector('[data-review-expand]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 650px)');
  const reviewCount=wall.querySelectorAll('.review-group:not(.review-copy) .review-card').length;
  if(!reviewCount){wall.hidden=true;return}
  let paused=false,expanded=false,inView=true;
  function update(){
   const compact=mobile.matches||window.innerHeight<600;
   const staticMode=reduced.matches||compact||reviewCount<6;
   const open=expanded||staticMode;
   wall.classList.toggle('is-expanded',open);
   wall.classList.toggle('is-animated',!open);
   wall.classList.toggle('is-paused',paused||!inView||document.hidden);
   pause.hidden=open;
   expand.hidden=staticMode;
   pause.setAttribute('aria-pressed',String(paused));
   pause.textContent=paused?'Resume reviews ▷':'Pause reviews Ⅱ';
   expand.setAttribute('aria-expanded',String(open));
   expand.textContent=open?'Return to scrolling wall':'Read all reviews';
  }
  pause.addEventListener('click',()=>{paused=!paused;update()});
  expand.addEventListener('click',()=>{expanded=!expanded;update()});
  reduced.addEventListener('change',update);mobile.addEventListener('change',update);
  document.addEventListener('visibilitychange',update);
  const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;update()});observer.observe(wall);
  let resizeFrame;
  window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(update)});
  update();
 });
}
