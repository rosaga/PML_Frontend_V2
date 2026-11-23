const SESSION_IDLE_MS = 60 * 60 * 1000;
const activeProcesses = new Map();

export const isSessionExpired = () => {
  if (typeof window === 'undefined') return true;

  const token = localStorage.getItem('token');
  const expiry = Number(localStorage.getItem('tokenExpiration'));
  const processing = [...activeProcesses.values()].some((process) => process.token === token);
  return !token || !Number.isFinite(expiry) || expiry <= 0 || (Date.now() >= expiry && !processing);
};

export const keepSessionAlive = () => {
  if (isSessionExpired()) return;

  const expirationTime = Date.now() + SESSION_IDLE_MS;
  // Limit storage writes from frequent pointer/scroll events to once per second.
  if (expirationTime - Number(localStorage.getItem('tokenExpiration')) >= 1000) {
    localStorage.setItem('tokenExpiration', expirationTime.toString());
  }
};

// Call the returned cleanup in finally so failed or completed work stops keeping the session alive.
export const startSessionProcess = () => {
  if (isSessionExpired()) return () => {};

  const token = localStorage.getItem('token');
  const id = Symbol();
  const finish = () => {
    const process = activeProcesses.get(id);
    if (!process) return;
    if (localStorage.getItem('token') === token) keepSessionAlive();
    window.clearInterval(process.interval);
    activeProcesses.delete(id);
  };
  const interval = window.setInterval(() => {
    if (localStorage.getItem('token') !== token) return finish();
    keepSessionAlive();
  }, 30 * 1000);
  activeProcesses.set(id, { token, interval });
  keepSessionAlive();
  return finish;
};

const clearSessionProcesses = () => {
  activeProcesses.forEach(({ interval }) => window.clearInterval(interval));
  activeProcesses.clear();
};

export const getToken = () => {
  if (typeof window === 'undefined') return null;

  const { pathname } = window.location;
  // do not run on sign in page 
  if (pathname.startsWith('/signin')) {
    return null;
  }

  const token           = localStorage.getItem('token');
  const isExpired       = isSessionExpired();

  // if session has expired and no alert shown
  if (isExpired && !sessionStorage.getItem('expiredAlertShown')) {
    sessionStorage.setItem('expiredAlertShown', '1');
    clearToken();
    alert('Session expired. Please log in again.');
    window.location.replace('/signin');
    return null;
  }

  // if session has expired and the alert already shown then redirect
  if (isExpired) {
    clearToken();
    window.location.replace('/signin');
    return null;
  }

  return token;
};



export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    clearSessionProcesses();
    const expirationTime = Date.now() + SESSION_IDLE_MS;
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expirationTime.toString());

    sessionStorage.removeItem('expiredAlertShown');
  }
};


export const setOrganisation = (orgId, orgName) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('orgId', orgId);
    localStorage.setItem('orgName', orgName);
  }
}

export const clearToken = () => {
  if (typeof window !== 'undefined') {
    clearSessionProcesses();
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('orgId');
    localStorage.removeItem('orgName');
    localStorage.removeItem('selectedAccountId');
    localStorage.removeItem('selectedAccountName');
    localStorage.removeItem('sideTourActive');
  }
};

export const signOutUser = () => {
  if (typeof window === 'undefined') return;

  clearToken();
  window.location.replace('/signin');
};
