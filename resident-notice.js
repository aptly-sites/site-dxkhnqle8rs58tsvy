const form = document.querySelector('form[data-notice]');
if (form) {
  const status = form.querySelector('[role=status]');
  const submit = form.querySelector('button');
  const endpoint = '/api/resident-notice';
  const kind = form.dataset.notice;
  const requestId = crypto.randomUUID();
  async function checkAvailability() {
    try {
      const response = await fetch(endpoint + '?kind=' + encodeURIComponent(kind));
      if (!response.ok || !(await response.json()).ready) throw new Error();
      submit.disabled = false;
      status.textContent = '';
    } catch {
      status.textContent = 'To give notice today, use the existing notice form below.';
    }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    status.textContent = 'Sending your request…';
    try {
      const response = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...Object.fromEntries(new FormData(form)),kind,requestId})});
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error);
      status.textContent = 'Your request was received by the Georgia team.';
      form.querySelectorAll('input,select,textarea').forEach(field => field.disabled = true);
    } catch (error) {
      status.textContent = error.message || 'Receipt could not be confirmed. Call (678) 782-7447.';
      submit.disabled = false;
    }
  });
  checkAvailability();
}
