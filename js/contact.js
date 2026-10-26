function validateField(input) {
  const error = document.getElementById(`${input.id}-error`);
  let msg = '';
  if (input.required && !input.value.trim()) msg = 'This field is required.';
  else if (input.value && !input.validity.valid) msg = input.validationMessage || 'Please check this value.';
  else if (input.minLength && input.value.length < input.minLength) msg = `Minimum ${input.minLength} characters required.`;
  if (error) { error.textContent = msg; error.classList.toggle('show', !!msg); }
  input.classList.toggle('input-error', !!msg);
  return !msg;
}

function showFormNotice(formId, message, isError = false) {
  const notice = document.getElementById(`${formId}-success`);
  if (!notice) return;
  notice.textContent = message;
  notice.classList.toggle('is-error', isError);
  notice.classList.add('show');
}

function requestFromContactForm(formId, values) {
  if (formId === 'enquiry-form') {
    return { title: `General enquiry: ${values.subject}`, description: values.message, category: 'enquiry' };
  }
  if (formId === 'report-form') {
    return { title: `Report: ${values.opportunity}`, description: `${values.issue}: ${values.details}`, category: 'opportunity_report' };
  }
  return {
    title: `Opportunity suggestion: ${values['opp-title']}`,
    description: `Organisation: ${values.org}\nOfficial link: ${values.url || 'Not provided'}\nDetails: ${values.details}`,
    category: 'opportunity_suggestion'
  };
}

function initForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => input.addEventListener('blur', () => validateField(input)));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;
    inputs.forEach(input => { if (!validateField(input)) valid = false; });
    if (!valid) return;
    if (!PortalApi.getSession()?.access_token) {
      showFormNotice(formId, 'Sign in to your account before submitting this request.', true);
      return;
    }

    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(form));
      const result = await PortalApi.request('/requests', {
        method: 'POST',
        body: JSON.stringify(requestFromContactForm(formId, values))
      });
      if (result.request) {
        showFormNotice(formId, 'Your request has been submitted. You can view its status from your account.', false);
        form.reset();
      }
    } catch (error) {
      showFormNotice(formId, error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initForm('enquiry-form');
  initForm('report-form');
  initForm('suggest-form');
});
