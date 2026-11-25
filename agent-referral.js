const form = document.querySelector('#agent-referral');
const status = form.querySelector('[role=status]');
const button = form.querySelector('button');
const requestId = crypto.randomUUID();

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (button.disabled) return;
  const fields = Object.fromEntries(new FormData(form));
  if (!fields.clientEmail.trim() && !fields.clientPhone.trim()) {
    status.textContent = 'Enter an email address or phone number for your client.';
    form.elements.clientEmail.focus();
    return;
  }
  button.disabled = true;
  status.textContent = 'Sending your referral…';
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...fields, requestId})
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error);
    form.reset();
    status.textContent = 'Thank you. Your referral has been sent to the Georgia team.';
  } catch (error) {
    status.textContent = error.message || 'We could not confirm delivery. Please call 678-782-7447.';
    button.disabled = false;
  }
});
