// middleware.js
import { NextResponse } from 'next/server';
import { getToken } from './src/utils/auth';

export function middleware(req) {
  if (req.url === '/') {
    const token = getToken();

    if (token && isValidToken(token)) {
      return NextResponse.redirect(`/apps/${process.env.NEXT_PUBLIC_APP_ID}/dashboard`);
    } else {
      return NextResponse.redirect('/signin');
    }
  }

  // Allow requests to other routes to proceed
  return NextResponse.next();
}

function isValidToken(token) {
    let expirationTime = localStorage.getItem('tokenExpiration');
    if (!token) {
        return false; 
      }
    if (parseInt(expirationTime, 10) < Date.now()) {
        alert('Session expired. Please sign in again.');
        return false;
     }
    return true;
}

