(() => {
  if (document.getElementById('all3-feedback')) return;
  const form = document.createElement('form');
  form.id = 'all3-feedback';
  form.innerHTML = '<button type="button" aria-expanded="false">Review this website</button><section hidden><label>Website feedback<textarea required minlength="5" maxlength="3000" rows="4"></textarea></label><label hidden>Company<input tabindex="-1" autocomplete="off"></label><button type="submit">Send feedback</button><p role="status"></p></section>';
  document.body.append(form);
  const [toggle,send] = form.querySelectorAll('button');
  const section = form.querySelector('section'), input = form.querySelector('textarea'), status = form.querySelector('[role=status]');
  let id = crypto.randomUUID();
  input.oninput = () => { id = crypto.randomUUID(); status.textContent = ''; };
  toggle.onclick = () => { section.hidden = !section.hidden; toggle.setAttribute('aria-expanded',String(!section.hidden)); if (!section.hidden) input.focus(); };
  form.onsubmit = async e => {
    e.preventDefault(); if (send.disabled) return;
    send.disabled = true; input.readOnly = true;
    try {
      const response = await fetch('/api/website-review/feedback',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,message:input.value,company:form.querySelector('input').value})});
      const result = await response.json(); status.textContent = result.message;
      if (response.status === 202) { input.value = ''; id = crypto.randomUUID(); }
    } catch { status.textContent = 'Receipt could not be confirmed. Keep your feedback and retry.'; }
    finally { send.disabled = false; input.readOnly = false; }
  };
})();
