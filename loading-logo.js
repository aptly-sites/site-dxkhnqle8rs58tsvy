// Shared transparent brand animation for asynchronous page content.
export function showLoading(target,message){
 const logo=document.createElement('span');logo.className='loading-logo';
 const image=document.createElement('img');image.src='/assets/loading-logo-still.png';image.alt='';image.width=480;image.height=270;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)logo.append(image);
 else{const video=document.createElement('video');video.autoplay=true;video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.poster=image.src;video.width=480;video.height=270;video.setAttribute('aria-hidden','true');video.src='/assets/loading-logo.webm';video.addEventListener('error',()=>logo.replaceChildren(image),{once:true});logo.append(video)}
 const text=document.createElement('span');text.textContent=message;target.classList.add('branded-loading');target.replaceChildren(logo,text);
}
