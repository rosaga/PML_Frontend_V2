import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../../api/utils/headers/headers';

export async function GetNotifications(org_id,page,pageSize) {

  let notificationsUrl
  if (page || pageSize) {
    notificationsUrl = `${apiUrl.getNotifiations}/${org_id}/notification?orderby=created_at DESC&size=${pageSize}&page=${page}`;
  }else{
    notificationsUrl = `${apiUrl.getNotifiations}/${org_id}/notification?orderby=created_at DESC`;
  }

  try {
    const config = await authHeaders();

    const res = await axios.get(notificationsUrl, config);

    if (res.data && res.status === 200) {
      console.log("THE RESPONSE IS !!!!!!!", res);
    }

    return res;
  } catch (error) {
    if (error.response) {
      return {
        errors: {
          _error: 'The Notifications could not be returned.',
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