(function () {
  const API_BASE = `${window.YOP_API_BASE_URL || 'http://localhost:5000'}/api`;
  const SESSION_KEY = 'yopSqliteAuthSession';
  let refreshPromise = null;

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function saveSession(session) {
    if (typeof session?.access_token === 'string'
      && session.access_token.length > 0
      && typeof session.refresh_token === 'string'
      && session.refresh_token.length >= 20) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function expiredSessionError() {
    const error = new Error('Your session has expired. Please sign in again.');
    error.status = 401;
    error.code = 'SESSION_EXPIRED';
    return error;
  }

  function refreshSession(refreshToken) {
    if (!refreshPromise) {
      refreshPromise = request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken })
      }, false).then((result) => {
        if (!result.session?.access_token || typeof result.session.refresh_token !== 'string'
          || result.session.refresh_token.length < 20) {
          throw expiredSessionError();
        }
        saveSession(result.session);
        return result;
      }).catch(() => {
        clearSession();
        throw expiredSessionError();
      }).finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  }

  async function request(path, options = {}, mayRefresh = true) {
    const session = getSession();
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);

    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
      throw new Error(`Network or CORS failure calling ${API_BASE}${path} from ${window.location.origin}. Check that the backend is running and FRONTEND_ORIGIN allows this origin.`);
    }
    const payload = await response.json().catch(() => ({}));

    const canRefresh = !['/auth/login', '/auth/register', '/auth/refresh'].includes(path);
    if (response.status === 401 && mayRefresh && canRefresh) {
      const latestSession = getSession();
      if (latestSession?.access_token && (latestSession.access_token !== session?.access_token
        || latestSession.refresh_token !== session?.refresh_token)) {
        return request(path, options, false);
      }
      if (typeof session?.refresh_token !== 'string' || session.refresh_token.length < 20) {
        clearSession();
        throw expiredSessionError();
      }
      await refreshSession(session.refresh_token);
      return request(path, options, false);
    }

    if (!response.ok) {
      const details = payload.error?.details || [];
      const message = details.length
        ? details.map((item) => `${item.field}: ${item.message}`).join(' ')
        : payload.error?.message || `The API request failed with HTTP ${response.status}.`;
      const error = new Error(message);
      error.status = response.status;
      error.code = payload.error?.code;
      throw error;
    }
    return payload.data;
  }

  window.PortalApi = { clearSession, getSession, request, saveSession };
})();