const profiles=[...document.querySelectorAll('.team-dialog')];
let opener=null;
function closeProfile(dialog){if(dialog.open)dialog.close()}
function openProfile(id,trigger){
 const dialog=document.getElementById('profile-'+id);if(!dialog)return;
 for(const other of profiles)if(other!==dialog&&other.open)other.close();
 opener=trigger||document.querySelector(`[data-team-profile="${id}"]`);
 dialog.showModal();dialog.scrollTop=0;document.body.classList.add('team-profile-open');dialog.querySelector('.team-close').focus({preventScroll:true});
}
for(const trigger of document.querySelectorAll('[data-team-profile]')){
 trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','profile-'+trigger.dataset.teamProfile);
 trigger.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();openProfile(trigger.dataset.teamProfile,trigger)});
}
for(const dialog of profiles){
 dialog.querySelector('.team-close').addEventListener('click',()=>closeProfile(dialog));
 let backdropDown=false;
 const outside=e=>{const box=dialog.getBoundingClientRect();return e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom};
 dialog.addEventListener('pointerdown',event=>{backdropDown=outside(event)});
 dialog.addEventListener('click',event=>{if(event.target===dialog&&backdropDown&&outside(event))closeProfile(dialog);backdropDown=false});
 dialog.addEventListener('close',()=>{document.body.classList.remove('team-profile-open');opener?.focus({preventScroll:true})});
}
// Direct profile links are also readable when JavaScript is unavailable.
function openHash(){if(location.hash.startsWith('#profile-'))openProfile(decodeURIComponent(location.hash.slice(9)))}
openHash();window.addEventListener('hashchange',openHash);
