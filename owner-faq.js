const root=document.querySelector('.owner-faq-explorer');
if(root){
 const search=document.getElementById('owner-faq-search'),clear=document.getElementById('owner-faq-clear'),count=document.getElementById('owner-faq-count'),browser=document.getElementById('owner-faq-browser'),empty=document.getElementById('owner-faq-empty'),topics=[...root.querySelectorAll('[data-faq-topic]')];
 const normalize=text=>text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'");
 const records=[...root.querySelectorAll('[data-faq-question]')].map(button=>({button,id:button.dataset.faqQuestion,category:button.dataset.faqCategory,panel:document.getElementById('faq-answer-'+button.dataset.faqQuestion)}));
 records.forEach(row=>row.search=normalize(row.panel.textContent));
 const params=new URLSearchParams(location.search);let topic=topics.some(t=>t.dataset.faqTopic===params.get('faqTopic'))?params.get('faqTopic'):'all',selected=params.get('faq')||records[0].id;search.value=(params.get('faqSearch')||'').slice(0,300);let visible=[];
 function sync(){const url=new URL(location.href);url.searchParams.set('faq',selected);if(topic==='all')url.searchParams.delete('faqTopic');else url.searchParams.set('faqTopic',topic);if(search.value.trim())url.searchParams.set('faqSearch',search.value.trim());else url.searchParams.delete('faqSearch');url.hash=root.closest('section').id;history.replaceState({},'',url.pathname+url.search+url.hash)}
 function render(updateURL=false){
  const words=normalize(search.value.trim()).split(/\s+/).filter(Boolean);visible=records.filter(row=>(topic==='all'||row.category===topic)&&words.every(word=>row.search.includes(word)));
  if(!visible.some(r=>r.id===selected))selected=visible[0]?.id||'';
  for(const row of records){const show=visible.includes(row),active=show&&row.id===selected;row.button.hidden=!show;row.button.setAttribute('aria-selected',String(active));row.button.tabIndex=active?0:-1;row.panel.hidden=!active}
  for(const tab of topics){tab.querySelector('span').textContent=records.filter(row=>(tab.dataset.faqTopic==='all'||row.category===tab.dataset.faqTopic)&&words.every(word=>row.search.includes(word))).length;const active=tab.dataset.faqTopic===topic;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1}
  browser.setAttribute('aria-labelledby','faq-topic-'+topic);browser.hidden=!visible.length;empty.hidden=!!visible.length;clear.hidden=!search.value;count.textContent=visible.length+' '+(visible.length===1?'question':'questions')+(search.value.trim()?' matching “'+search.value.trim()+'”':'');if(updateURL)sync();
 }
 function select(row,focus=false){selected=row.id;render(true);if(focus)row.button.focus({preventScroll:true});else if(innerWidth<=950)row.panel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}
 records.forEach(row=>{row.button.addEventListener('click',()=>select(row));row.button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowDown')next=(visible.indexOf(row)+1)%visible.length;if(event.key==='ArrowUp')next=(visible.indexOf(row)+visible.length-1)%visible.length;if(event.key==='Home')next=0;if(event.key==='End')next=visible.length-1;if(next!==undefined){event.preventDefault();select(visible[next],true)}})});
 topics.forEach((tab,index)=>{const choose=()=>{topic=tab.dataset.faqTopic;render(true)};tab.addEventListener('click',choose);tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%topics.length;if(event.key==='ArrowLeft')next=(index+topics.length-1)%topics.length;if(event.key==='Home')next=0;if(event.key==='End')next=topics.length-1;if(next!==undefined){event.preventDefault();topic=topics[next].dataset.faqTopic;render(true);topics[next].focus()}})});
 search.maxLength=300;search.addEventListener('input',()=>render(true));clear.addEventListener('click',()=>{search.value='';render(true);search.focus()});document.getElementById('owner-faq-reset').addEventListener('click',()=>{topic='all';search.value='';render(true);search.focus()});
 document.querySelectorAll('[data-open-owner-faq]').forEach(link=>link.addEventListener('click',()=>{topic='all';search.value='';selected=link.dataset.openOwnerFaq;render(true)}));
 render();
}
