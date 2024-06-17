export const getToken = () => {
  const token = localStorage.getItem('token');
  const expirationTime = localStorage.getItem('tokenExpiration');
  if (!token || !expirationTime) {
    // alert('Session Expired, Please login again')
    // window.location.href = '/signin';
    return null;
  }

  const now = Date.now();
  if (now > parseInt(expirationTime, 10)) {
    clearToken();
    window.location.href = '/signin';
    return null;
  }

  return token;
};

export const setToken = (token: string) => {
  const expirationTime = Date.now() + 3600000;
  localStorage.setItem('token', token);
  localStorage.setItem('tokenExpiration', expirationTime.toString());
};
export const setOrganisation = (orgId: string,orgName:string) => {
  localStorage.setItem('orgId', orgId);
  localStorage.setItem('orgName', orgName);
}

export const clearToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpiration');
  localStorage.removeItem('orgId');
  localStorage.removeItem('orgName');
};
