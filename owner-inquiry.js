const form=document.querySelector('#city-owner-form');
if(form){
 const alabama=form.dataset.market==='alabama';
 const phone=alabama?'334-593-3130':'678-782-7447';
 let requestId=crypto.randomUUID();let pending=false;
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(pending||!form.reportValidity())return;if(!form.dispatchEvent(new CustomEvent('owner:prepare',{cancelable:true})))return;pending=true;
  const button=form.querySelector('button[type=submit]'),status=document.querySelector('#form-status');button.disabled=true;status.textContent='Sending your inquiry…';
  const lead=Object.fromEntries(new FormData(form));form.setAttribute('aria-busy','true');form.querySelectorAll('fieldset').forEach(f=>f.disabled=true);Object.assign(lead,{city:form.dataset.city,pageTitle:document.title,pageUrl:location.href,formSource:form.dataset.city+' City Owner Lead Form',requestId});
  try{const response=await fetch('/api/owner-lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead),signal:AbortSignal.timeout(65000)});const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||`We could not confirm your inquiry. Please call ${phone}.`);form.dispatchEvent(new CustomEvent('owner:success'));status.dataset.state='success';status.textContent=`Thank you. Your inquiry has been received by All 3 Realty. Our ${alabama?'Alabama':'Georgia'} team will be in touch.`;form.reset();requestId=crypto.randomUUID()}
  catch(error){status.dataset.state='error';status.textContent=error.name==='TimeoutError'?`We could not confirm your inquiry. Please call ${phone} before retrying.`:error.message.includes('JSON')?`We could not send your inquiry. Please call ${phone}.`:error.message}
  finally{pending=false;form.setAttribute('aria-busy','false');const received=status.dataset.state==='success';form.querySelectorAll('fieldset').forEach(f=>f.disabled=received);button.disabled=received;if(received)button.textContent='Inquiry received';}
 });
}
