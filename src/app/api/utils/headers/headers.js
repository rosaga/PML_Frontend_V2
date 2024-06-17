import { getSession } from 'next-auth/react';

export async function authHeaders() {
    if (typeof window !== 'undefined') {
      try {
        const session = await getSession();
        const token = session.accessToken;
        console.log("THE TOKEN BEING SENT IS!!!!!!!!!!", token);
        const authToken = `Bearer ${token}`;
        return {
          headers: {
            Accept: 'application/json',
            'content-type': 'application/json',
            Authorization: authToken,
          },
        };
      } catch (error) {
        console.error('Error fetching session:', error);
        // Handle error case: return headers without Authorization if token retrieval fails
        return {
          headers: {
            Accept: 'application/json',
            'content-type': 'application/json',
          },
        };
      }
    }
  }