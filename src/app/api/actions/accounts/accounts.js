import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../../api/utils/headers/headers';

export async function GetAccounts() {
    const accountsUrl = `${apiUrl.GET_ACCOUNTS}`;
  
    try {
      const config = await authHeaders();
  
      const res = await axios.get(accountsUrl, config);
  
      if (res.data && res.status === 200) {
        console.log("THE RESPONSE IS !!!!!!!", res);
      }
  
      return res;
    } catch (error) {
      if (error.response) {
        return {
          errors: {
            _error: 'The contacts could not be returned.',
          },
        };
      }
      return {
        errors: {
          _error: 'Network error. Please try again.',
        },
      };
    }
  }