// Keep display controls independent of the page styles they change.
const key = 'all3.accessibility';
const modes = ['grayscale', 'high', 'negative', 'light'];
const defaults = {size: 0, mode: '', underline: false, readable: false};
let settings = {...defaults};
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved) settings = {
    size: Number.isInteger(saved.size) ? Math.max(-1, Math.min(3, saved.size)) : 0,
    mode: modes.includes(saved.mode) ? saved.mode : '',
    underline: saved.underline === true, readable: saved.readable === true
  };
} catch {}

const host = document.createElement('aside');
host.className = 'display-tools';
host.setAttribute('aria-label', 'Accessibility tools');
const ui = host.attachShadow({mode: 'open'});
ui.innerHTML = `
<style>
:host{position:fixed;bottom:max(16px,env(safe-area-inset-bottom));left:max(16px,env(safe-area-inset-left));z-index:2147483000;color:#142c50;font:16px/1.4 Arial,sans-serif}
*{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer;background:#fff;border:1px solid #bcc7d4;border-radius:10px;min-height:44px;padding:8px 12px}
button:hover{border-color:#255d91}button:focus-visible{outline:3px solid #2473af;outline-offset:2px}button:disabled{opacity:.45;cursor:default}
#toggle,button[aria-pressed=true]{background:#152e52;color:#fff}
#toggle{display:grid;place-items:center;width:52px;height:52px;border:2px solid white;border-radius:50%;padding:8px;box-shadow:0 2px 12px #142c5033}
section{background:white;border:1px solid #ccd5df;border-radius:16px;padding:16px;width:min(320px,calc(100vw - 36px));max-height:calc(100dvh - 92px);overflow:auto;margin-bottom:10px;box-shadow:0 8px 32px #142c5033}
header,.stepper{display:flex;align-items:center;justify-content:space-between;gap:6px}h2{font-size:20px;margin:0}header{border-bottom:1px solid #ddd;padding-bottom:10px}
.stepper{margin:12px 0}.stepper span{margin-right:auto}.stepper button{min-width:44px}output{min-width:42px;text-align:center}
.options{display:grid;grid-template-columns:1fr 1fr;gap:8px}.options button{font-size:15px}#reset{width:100%;margin-top:12px}
</style>
<section id="panel" aria-labelledby="title" hidden>
<header><h2 id="title">Accessibility tools</h2><button id="close" aria-label="Close accessibility tools">×</button></header>
<div class="stepper"><span>Text size</span><button id="decrease" aria-label="Decrease text size">−</button><output aria-live="polite"></output><button id="increase" aria-label="Increase text size">+</button></div>
<div class="options" role="group" aria-label="Display preferences">
<button data-pref="grayscale">Grayscale</button><button data-pref="high">High contrast</button>
<button data-pref="negative">Negative contrast</button><button data-pref="light">Light background</button>
<button data-pref="underline">Underline links</button><button data-pref="readable">Readable font</button>
</div><button id="reset">Reset settings</button></section>
<button id="toggle" aria-label="Accessibility tools" aria-controls="panel" aria-expanded="false"><svg aria-hidden="true" viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="16" cy="5" r="2" fill="currentColor"/><path d="m4 10 12 3 12-3M16 13v6m0 0-7 10m7-10 7 10"/></svg></button>`;
document.body.append(host);
const get = selector => ui.querySelector(selector);
const page = document.documentElement;
const text = 'h1,h2,h3,h4,h5,h6,p,a,button,label,legend,input,select,textarea,li,dt,dd,span,strong,small,summary,td,th,blockquote,figcaption';
let frame;
function sizeText() {
  page.classList.remove('adjust-text');
  if (!settings.size) return;
  const sizes = Array.from(document.querySelectorAll(text), element => [element, parseFloat(getComputedStyle(element).fontSize)]);
  for (const [element, size] of sizes) element.style.setProperty('--all3-text', size * (1 + settings.size * .15) + 'px');
  page.classList.add('adjust-text');
}
function scheduleSize() {
  if (!settings.size || frame) return;
  frame = requestAnimationFrame(() => { frame = 0; sizeText(); });
}
new MutationObserver(scheduleSize).observe(document.body, {childList:true, subtree:true});
window.addEventListener('resize', scheduleSize);
function apply() {
  page.dataset.displayMode = settings.mode;
  page.classList.toggle('underline-links', settings.underline);
  page.classList.toggle('readable-font', settings.readable);
  sizeText();
  get('output').textContent = (100 + settings.size * 15) + '%';
  get('#decrease').disabled = settings.size === -1;
  get('#increase').disabled = settings.size === 3;
  for (const button of ui.querySelectorAll('[data-pref]')) {
    const pref = button.dataset.pref;
    button.setAttribute('aria-pressed', String(settings.mode === pref || settings[pref] === true));
  }
}
function toggle(open) {
  get('#panel').hidden = !open;
  get('#toggle').setAttribute('aria-expanded', String(open));
  get(open ? '#close' : '#toggle').focus();
}
ui.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.id === 'toggle') return toggle(get('#panel').hidden);
  if (button.id === 'close') return toggle(false);
  const pref = button.dataset.pref;
  if (button.id === 'reset') settings = {...defaults};
  else if (button.id === 'increase') settings.size++;
  else if (button.id === 'decrease') settings.size--;
  else if (modes.includes(pref)) settings.mode = settings.mode === pref ? '' : pref;
  else settings[pref] = !settings[pref];
  apply();
  try { localStorage.setItem(key, JSON.stringify(settings)); } catch {}
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !get('#panel').hidden) toggle(false);
});
apply();
