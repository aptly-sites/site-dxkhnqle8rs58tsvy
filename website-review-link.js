/* All 3 review checklist. Drafts stay in this browser until submission. */
(()=>{'use strict';
 if(window.__all3ReviewMounted)return;window.__all3ReviewMounted=true;
 const storageKey='all3-website-review-draft-v1';
 const canSubmit=document.currentScript?.dataset.submissionReady==='true';
 const plan={
  "checklist": [
    {
      "id": "brand",
      "title": "Homepage and navigation",
      "instructions": [
        "Check the logo, headline, imagery and mobile menu."
      ],
      "links": [
        {
          "label": "Homepage and navigation",
          "url": "https://site-dxkhnqle8rs58tsvy.pages.dev/"
        }
      ]
    },
    {
      "id": "owners",
      "title": "Owner services",
      "instructions": [
        "Confirm the service description and owner inquiry destination."
      ],
      "links": [
        {
          "label": "Owner services",
          "url": "https://site-dxkhnqle8rs58tsvy.pages.dev/property-management-services/"
        }
      ]
    },
    {
      "id": "rentals",
      "title": "Rental search",
      "instructions": [
        "Review listings and follow a listing to its details."
      ],
      "links": [
        {
          "label": "Rental search",
          "url": "https://site-dxkhnqle8rs58tsvy.pages.dev/homes-for-rent/"
        }
      ]
    },
    {
      "id": "criteria",
      "title": "Application criteria",
      "instructions": [
        "Confirm the published qualification requirements."
      ],
      "links": [
        {
          "label": "Application criteria",
          "url": "https://site-dxkhnqle8rs58tsvy.pages.dev/application-qualification/"
        }
      ]
    },
    {
      "id": "residents",
      "title": "Resident resources",
      "instructions": [
        "Review the resident support and portal destinations."
      ],
      "links": [
        {
          "label": "Resident resources",
          "url": "https://site-dxkhnqle8rs58tsvy.pages.dev/current-residents/"
        }
      ]
    },
    {
      "id": "regions",
      "title": "Service areas",
      "instructions": [
        "Confirm the Georgia and Alabama markets shown in the navigation."
      ],
      "links": [
        {
          "label": "Georgia",
          "url": "https://site-dxkhnqle8rs58tsvy.pages.dev/markets/georgia/"
        },
        {
          "label": "Alabama",
          "url": "https://site-dxkhnqle8rs58tsvy.pages.dev/markets/alabama/"
        }
      ]
    },
    {
      "id": "team",
      "title": "Team and contact details",
      "instructions": [
        "Check the team names, phone numbers and office details."
      ],
      "links": [
        {
          "label": "Team and contact details",
          "url": "https://site-dxkhnqle8rs58tsvy.pages.dev/contact/"
        },
        {
          "label": "Our team",
          "url": "https://site-dxkhnqle8rs58tsvy.pages.dev/company/"
        }
      ]
    },
    {
      "id": "policies",
      "title": "Privacy policy",
      "instructions": [
        "Review the published privacy terms for this website."
      ],
      "links": [
        {
          "label": "Privacy policy",
          "url": "https://site-dxkhnqle8rs58tsvy.pages.dev/privacy-policy/"
        }
      ]
    }
  ]
};
 const privacy=document.createElement('meta');privacy.name='referrer';privacy.content='no-referrer';document.head.append(privacy);
 const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e};
 const button=(text,fn)=>{const e=make('button',text);e.type='button';e.addEventListener('click',fn);return e};
 function setOpen(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));document.documentElement.classList.toggle('aptly-private-review-open',open);if(open){close.focus({preventScroll:true});if(!state&&!busy)void load()}else toggle.focus({preventScroll:true})}
 const toggle=button('Review this website',()=>setOpen(true));toggle.id='aptly-review-toggle';toggle.setAttribute('aria-controls','aptly-review-panel');toggle.setAttribute('aria-expanded','true');document.body.append(toggle);
 const panel=make('aside');panel.id='aptly-review-panel';panel.setAttribute('aria-label','Website review');
 const header=make('header'),close=button('×',()=>setOpen(false));close.setAttribute('aria-label','Close review panel');header.append(make('h2','Aptly Website Studio Review'),close);panel.append(header);
 const viewport=()=>{const v=window.visualViewport;panel.style.setProperty('--review-height',(v?.height||window.innerHeight)+'px');panel.style.setProperty('--review-top',(v?.offsetTop||0)+'px')};viewport();window.visualViewport?.addEventListener('resize',viewport);window.visualViewport?.addEventListener('scroll',viewport);window.addEventListener('resize',viewport);
 panel.append(make('p','Your website is almost ready to launch. Review the items below and sign off at the bottom. Add feedback to any task, or submit general feedback.'));
 // Customer review never links to the private owner Studio.
 const generalLink=button('Submit general feedback',()=>{feedbackOpen=true;itemId='general';render();document.getElementById('private-review-question')?.focus()});generalLink.className='review-text-link';panel.append(generalLink);
 const status=make('p','Opening your review…');status.className='review-status';status.setAttribute('role','status');panel.append(status);
 const body=make('div');panel.append(body);document.body.append(panel);
 const entryParams=new URLSearchParams(location.search);
 const startsClosed=entryParams.get('reviewPanel')==='closed'||!entryParams.has('privateReview');
 panel.hidden=startsClosed;toggle.setAttribute('aria-expanded',String(!startsClosed));document.documentElement.classList.toggle('aptly-private-review-open',!startsClosed);
 let activeCard=null,feedbackOpen=false;
 let state=null,busy=false,question='',itemId='',name='',outcome='changes_requested',confirmed=false,feedbackId=null;
 const normal=path=>path.replace(/\.html$/,'').replace(/\/$/,'')||'/';
 function report(text){status.classList.remove('review-status-quiet');status.textContent=text;}
 function persist(){
   try {
     localStorage.setItem(storageKey,JSON.stringify({draft:state.draft,submission:state.submission,id:state.id,name,outcome,question,itemId,confirmed}));
     return true;
   } catch { report('Browser storage is unavailable. Keep this page open to preserve your notes.');return false; }
 }
 function load(){
   let saved;
   try {saved=JSON.parse(localStorage.getItem(storageKey)||'null');} catch {}
   state={version:plan,draft:saved?.draft||{checks:[],feedback:[]},submission:saved?.submission||null,id:saved?.id||crypto.randomUUID()};
   name=saved?.name||'';outcome=saved?.outcome||'changes_requested';question=saved?.question||'';itemId=saved?.itemId||'general';confirmed=!!saved?.confirmed;
   feedbackOpen=!!question;
   report(state.submission?'Submitted for Aptly verification.':'Your draft stays in this browser until you submit it.');
   render();
 }
 function saveDraft(draft,after){
   if(busy||state.submission)return;
   state.draft=draft;after?.();
   if(persist())report('Draft saved on this device.');
   render();
 }
 async function submitReview(){
   if(busy||state.submission||!canSubmit)return;
   busy=true;persist();render();
   try{
     const review={name:name.trim(),outcome,confirmed,checks:state.draft.checks,feedback:state.draft.feedback.map(({itemId,text})=>({itemId,text}))};
     const response=await fetch('/api/website-review/feedback',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:state.id,company:trap.value,review})});
     const result=await response.json();
     if(response.status!==202||result.receipt!==state.id)throw Error(result.message||'Receipt could not be confirmed.');
     state.submission={id:result.receipt,claimedName:name,outcome};if(persist())report('Submitted for Aptly verification.');
   }catch(error){report(error.message+' Your draft is still here.');}
   finally{busy=false;render();}
 }
 const trap=make('input');trap.hidden=true;trap.tabIndex=-1;trap.autocomplete='off';trap.name='company';panel.append(trap);
 function render(){const active=document.activeElement,focus=body.contains(active)?active.id:'',cursor=active.selectionStart;body.replaceChildren();if(!state)return;
  const locked=!!state.submission||!!state.closed,plan=state.version,checks=state.draft.checks;generalLink.hidden=locked;
  body.append(make('p',checks.length+' of '+plan.checklist.length+' items reviewed'));
  if(state.submission){const receipt=make('section');receipt.append(make('h3','Pending Aptly verification'),make('p','Your submission was received. Aptly will verify it with you before treating it as an approval or taking launch action.'),make('p','Reference: '+state.submission.id),make('p','Submitted name (not yet verified): '+state.submission.claimedName),make('p','Requested outcome: '+(state.submission.outcome==='changes_requested'?'Changes requested':'Ready for Aptly verification')));body.append(receipt)}
  const here=item=>item.links.some(link=>normal(new URL(link.url).pathname)===normal(location.pathname));
  const ordered=[...plan.checklist].sort((a,b)=>Number(checks.includes(a.id))-Number(checks.includes(b.id))||Number(here(b))-Number(here(a)));
  if(activeCard===null)activeCard=ordered.find(item=>!checks.includes(item.id))?.id||'';
  for(const item of ordered){
   const card=make('details');card.setAttribute('name','website-review-checklist');card.className='review-card'+(checks.includes(item.id)?' is-reviewed':'');card.open=activeCard===item.id;
   const summary=make('summary');summary.id='review-card-'+item.id;const rowText=make('span');rowText.className='review-row-text';rowText.append(make('span',item.title));const more=make('small',checks.includes(item.id)?'Reviewed · View more':'View more');rowText.append(more);summary.append(rowText);card.append(summary);
   card.addEventListener('toggle',()=>{if(!card.isConnected)return;more.textContent=(checks.includes(item.id)?'Reviewed · ':'')+(card.open?'View less':'View more');if(card.open){activeCard=item.id;for(const other of body.querySelectorAll('.review-card'))if(other!==card)other.open=false}else if(activeCard===item.id)activeCard=''});
   const section=make('div');section.className='review-card-content';if(here(item))section.append(make('small','ON THIS PAGE'));section.append(make('strong','What to check'));const list=make('ul');for(const text of item.instructions)list.append(make('li',text));section.append(list);
   for(const link of item.links){let url;try{url=new URL(link.url)}catch{continue}if(url.origin!==location.origin)continue;url.searchParams.set('reviewPanel','closed');const a=make('a',link.label+' →');a.href=url.href;a.addEventListener('click',e=>{if(busy||question.trim()){e.preventDefault();status.classList.remove('review-status-quiet');status.textContent=busy?'Wait for your review to finish saving before opening a page.':'Save or clear your feedback before opening a page.';status.scrollIntoView({block:'nearest'});return}setOpen(false)});section.append(a)}
   const label=make('label'),check=make('input');check.type='checkbox';check.checked=checks.includes(item.id);check.disabled=busy||locked;check.setAttribute('aria-label','Reviewed: '+item.title);check.addEventListener('change',()=>{const next=check.checked?[...checks,item.id]:checks.filter(id=>id!==item.id);void saveDraft({...state.draft,checks:next},()=>{activeCard=check.checked?(ordered.find(x=>!next.includes(x.id))?.id||''):item.id;requestAnimationFrame(()=>{const target=document.getElementById('review-card-'+(activeCard||item.id));target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest',behavior:'smooth'})})})});label.className='review-row-check';label.append(check);label.addEventListener('click',e=>e.stopPropagation());summary.prepend(label);
   if(!locked)section.append(button('Add feedback',()=>{feedbackOpen=true;itemId=item.id;render();document.getElementById('private-review-question').focus()}));card.append(section);body.append(card);
  }
  const feedback=make('section');feedback.hidden=!state.draft.feedback.length;if(state.draft.feedback.length)feedback.append(make('h3',locked?'Submitted feedback':'Saved feedback'));
  for(const f of state.draft.feedback){const entry=make('div');entry.append(make('strong',plan.checklist.find(x=>x.id===f.itemId)?.title||'General website feedback'),make('p',f.text));if(!locked){const remove=button('Remove draft feedback',()=>void saveDraft({...state.draft,feedback:state.draft.feedback.filter(x=>x.id!==f.id)}));remove.disabled=busy;entry.append(remove)}feedback.append(entry)}
  body.append(feedback);
  if(!locked){
   const form=make('form'),topicLabel=make('label','Checklist item'),select=make('select');select.id='private-review-item';const general=make('option','General website feedback');general.value='general';select.append(general);for(const item of plan.checklist){const option=make('option',item.title);option.value=item.id;select.append(option)}if(!itemId)itemId='general';select.value=itemId;select.addEventListener('change',()=>{itemId=select.value;persist()});topicLabel.append(select);
   const detailLabel=make('label','Feedback'),text=make('textarea');text.id='private-review-question';text.rows=4;text.maxLength=4000;text.required=true;text.value=question;text.addEventListener('input',()=>{question=text.value;persist()});detailLabel.append(text);const save=make('button',busy?'Saving…':'Save draft feedback');save.type='submit';save.disabled=busy;form.hidden=!feedbackOpen;form.append(make('h3',itemId==='general'?'General feedback':'Task feedback'),topicLabel,detailLabel,save);for(const f of state.draft.feedback.filter(f=>f.itemId===itemId)){form.append(make('p','Saved: '+f.text))}form.addEventListener('submit',e=>{e.preventDefault();void saveDraft({...state.draft,feedback:[...state.draft.feedback,{id:feedbackId||(feedbackId=crypto.randomUUID()),itemId,text:question}]},()=>{question='';feedbackId=null;feedbackOpen=false})});body.insertBefore(form,body.querySelector('.review-card'));
   const final=make('form');final.append(make('h3','Submit your review once'),make('p','After submission, this review is locked. Your name and browser access are not identity verification. Aptly will verify the submission with you. This does not launch the website.'));
   const nameLabel=make('label','Your name'),nameInput=make('input');nameInput.id='private-review-name';nameInput.value=name;nameInput.required=true;nameInput.maxLength=100;nameInput.addEventListener('input',()=>{name=nameInput.value;persist()});nameLabel.append(nameInput);
   const outcomeLabel=make('label','Review outcome'),choice=make('select');choice.id='private-review-outcome';for(const [value,text] of [['changes_requested','I have requested changes'],['ready_for_verification','Ready for Aptly to verify with me']]){const option=make('option',text);option.value=value;choice.append(option)}choice.value=outcome;choice.addEventListener('change',()=>{outcome=choice.value;persist()});outcomeLabel.append(choice);
   const confirmation=make('label'),check=make('input');check.type='checkbox';check.checked=confirmed;check.required=true;check.addEventListener('change',()=>{confirmed=check.checked;persist()});confirmation.append(check,document.createTextNode('I understand this submits the saved draft once and locks it for Aptly verification.'));
   const submit=make('button',busy?'Saving…':'Submit review for verification');submit.type='submit';submit.disabled=!canSubmit||busy||checks.length!==plan.checklist.length;final.append(nameLabel,outcomeLabel,confirmation,submit);if(!canSubmit)final.append(make('p','Final submission is temporarily unavailable. You can review every item and save notes on this device.'));if(checks.length!==plan.checklist.length)final.append(make('p','Review every checklist item first. You can still request changes.'));final.addEventListener('submit',e=>{e.preventDefault();if(question.trim()){status.classList.remove('review-status-quiet');status.textContent='Save or clear the feedback you are typing before submitting.';return}void submitReview()});body.append(final);
  }
  if(focus){const next=document.getElementById(focus);next?.focus({preventScroll:true});if(typeof cursor==='number'&&next?.setSelectionRange)next.setSelectionRange(cursor,cursor)}
 }
 window.addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue=''}});
 panel.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
 if(!startsClosed)void load();
})();
