function showAccountMessage(message, isError = false) {
  const region = document.getElementById('account-message');
  region.textContent = message;
  region.classList.toggle('is-error', isError);
  region.hidden = false;
}

function validateAccountForm(form) {
  let valid = true;
  for (const input of form.querySelectorAll('input, select')) {
    const error = document.getElementById(`${input.id}-error`);
    const message = input.validity.valid ? '' : input.validationMessage;
    if (error) {
      error.textContent = message;
      error.classList.toggle('show', Boolean(message));
    }
    input.classList.toggle('input-error', Boolean(message));
    valid = valid && !message;
  }
  return valid;
}

function showAccountForm(formName) {
  const registerPanel = document.getElementById('register-panel');
  const loginPanel = document.getElementById('login-panel');
  const showingLogin = formName === 'login';
  registerPanel.hidden = showingLogin;
  loginPanel.hidden = !showingLogin;
  document.getElementById('account-message').hidden = true;
  document.getElementById(showingLogin ? 'login-email' : 'register-name').focus();
}

async function submitAccountForm(form, endpoint) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateAccountForm(form)) return;

    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const body = Object.fromEntries(new FormData(form));
      const result = await PortalApi.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
      if (result.session) PortalApi.saveSession(result.session);
      if (result.session && result.user) {
        window.location.replace(result.user.role === 'admin' ? 'admin/dashboard.html' : 'dashboard.html');
        return;
      }
      showAccountMessage(result.message || 'Signed in successfully.');
      form.reset();
    } catch (error) {
      showAccountMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  submitAccountForm(document.getElementById('register-form'), '/auth/register');
  submitAccountForm(document.getElementById('login-form'), '/auth/login');

  document.getElementById('show-login').addEventListener('click', (event) => {
    event.preventDefault();
    showAccountForm('login');
  });
  document.getElementById('show-register').addEventListener('click', (event) => {
    event.preventDefault();
    showAccountForm('register');
  });

  document.querySelectorAll('[data-password-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.passwordTarget);
      const showingPassword = input.type === 'password';
      input.type = showingPassword ? 'text' : 'password';
      button.setAttribute('aria-label', showingPassword ? 'Hide password' : 'Show password');
      button.title = showingPassword ? 'Hide password' : 'Show password';
      button.querySelector('.material-symbols-outlined').textContent = showingPassword ? 'visibility_off' : 'visibility';
    });
  });

  if (PortalApi.getSession()?.access_token) {
    try {
      const result = await PortalApi.request('/auth/me');
      window.location.replace(result.user.role === 'admin' ? 'admin/dashboard.html' : 'dashboard.html');
    } catch (error) {
      PortalApi.clearSession();
      showAccountMessage(error.message, true);
    }
  }
});