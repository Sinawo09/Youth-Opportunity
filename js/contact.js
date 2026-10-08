// ===== CONTACT FORM VALIDATION =====
function validateField(input) {
  const error = document.getElementById(`${input.id}-error`);
  let msg = '';
  if (input.required && !input.value.trim()) msg = 'This field is required.';
  else if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) msg = 'Please enter a valid email address.';
  else if (input.minLength && input.value.length < input.minLength) msg = `Minimum ${input.minLength} characters required.`;
  if (error) { error.textContent = msg; error.classList.toggle('show', !!msg); }
  input.classList.toggle('input-error', !!msg);
  return !msg;
}

function initForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => input.addEventListener('blur', () => validateField(input)));
  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    inputs.forEach(input => { if (!validateField(input)) valid = false; });
    if (!valid) return;
    const success = document.getElementById(`${formId}-success`);
    if (success) { success.classList.add('show'); form.reset(); setTimeout(() => success.classList.remove('show'), 5000); }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initForm('enquiry-form');
  initForm('report-form');
  initForm('suggest-form');
});
