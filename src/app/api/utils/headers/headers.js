import { getToken } from "../../../../utils/auth"

export async function authHeaders() {
    if (typeof window !== 'undefined') {
      try {
        let token = getToken();
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
        return {
          headers: {
            Accept: 'application/json',
            'content-type': 'application/json',
          },
        };
      }
    }
  }