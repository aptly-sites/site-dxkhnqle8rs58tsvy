const list = document.querySelector('.resident-tabs');
const tabs = [...list.querySelectorAll('a')];
list.setAttribute('role', 'tablist');
function selectTab() {
  const selected = location.hash === '#future' ? 'future' : 'existing';
  tabs.forEach(tab => {
    const panel = document.querySelector(tab.hash);
    const active = panel.id === selected;
    panel.hidden = !active;
    panel.setAttribute('role', 'tabpanel');
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', event => {
    event.preventDefault();
    history.pushState(null, '', tab.hash);
    selectTab();
  });
  tab.addEventListener('keydown', event => {
    const next = {ArrowLeft: 1-index, ArrowRight: 1-index, Home: 0, End: 1}[event.key];
    if (next === undefined) return;
    event.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });
});
window.addEventListener('hashchange', selectTab);
selectTab();
const benefitsDialog = document.getElementById('benefits-dialog');
const benefitsLink = document.getElementById('benefits-open');
benefitsLink.addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  benefitsDialog.showModal();
  benefitsDialog.scrollTop = 0;
});
benefitsDialog.addEventListener('close', () => benefitsLink.focus({preventScroll:true}));

function openLinkedBenefits(){
  if(location.hash==='#benefits-package' && !benefitsDialog.open){
    benefitsLink.scrollIntoView({block:'center'});
    benefitsLink.focus({preventScroll:true});
    benefitsDialog.showModal();
  }
}
window.addEventListener('hashchange',openLinkedBenefits);
benefitsDialog.addEventListener('close',()=>{
  if(location.hash==='#benefits-package') history.replaceState(null,'',location.pathname+location.search+'#handbook');
});
openLinkedBenefits();
