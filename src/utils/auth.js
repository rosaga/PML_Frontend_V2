export const getToken = () => {
  if (typeof window === 'undefined') return null;

  const { pathname } = window.location;
  // do not run on sign in page 
  if (pathname.startsWith('/signin')) {
    return null;
  }

  const token           = localStorage.getItem('token');
  const expiry          = localStorage.getItem('tokenExpiration');
  const now             = Date.now();
  const isExpired       = !token || !expiry || now > parseInt(expiry, 10);

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
    const expirationTime = Date.now() + 3600000;
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
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('orgId');
    localStorage.removeItem('orgName');
    localStorage.removeItem('selectedAccountId');
    localStorage.removeItem('selectedAccountName');
    localStorage.removeItem('sideTourActive');
  }
};
