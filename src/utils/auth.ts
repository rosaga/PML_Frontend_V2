export const getToken = () => {
  const token = localStorage.getItem('token');
  const expirationTime = localStorage.getItem('tokenExpiration');

  if (!token || !expirationTime) {
    alert('Session Expired, Please login again')
    window.location.href = '/signin';
    return null;
  }

  const now = Date.now();
  if (now > parseInt(expirationTime, 10)) {
    // Token is expired, clear it
    clearToken();
    // Redirect to login page
    window.location.href = '/login';
    return null;
  }

  return token;
};

export const setToken = (token: string) => {
  console.log('setting token')
  const expirationTime = Date.now() + 3600000; // 1 hour in milliseconds
  localStorage.setItem('token', token);
  localStorage.setItem('tokenExpiration', expirationTime.toString());
};

export const clearToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpiration');
};
