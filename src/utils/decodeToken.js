// utils/auth.js
import jwt from 'jsonwebtoken';

export function hasRole(token, role) {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.realm_access && decoded.realm_access.roles) {
      return decoded.realm_access.roles.includes(role);
    }
  } catch (error) {
    console.error('Failed to decode token', error);
  }
  return false;
}

export function getUserInfo(token) {
  try {
    const decoded = jwt.decode(token);
    if (decoded) {
      const name = decoded.name;
      const email = decoded.email;
      return { name, email };
    }
  } catch (error) {
    console.error('Failed to decode token', error);
  }
  return null;
}