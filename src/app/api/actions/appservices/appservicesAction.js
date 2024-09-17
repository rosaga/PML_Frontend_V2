import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../../api/utils/headers/headers';

export async function appservicesAction(formValues) {

  let appServicesUrl = ""

  if (formValues.selectedChannel){
    appServicesUrl = `${apiUrl.LIST_APP_SERVICES}/${formValues.org_id}/service/list?eq__channel=${formValues.selectedChannel}`;
  }
  else{
    appServicesUrl = `${apiUrl.LIST_APP_SERVICES}/${formValues.org_id}/service/list`;

  }
  
  try {
    const config = await authHeaders();
  
    return axios
      .get(appServicesUrl, config)
      .then((res) => {
      
        if (res.data && res.status === 200) {

            console.log("THE RESPONSE IS !!!!!!!",res)
          
        }
        return res;
      })
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