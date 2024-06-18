import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../../api/utils/headers/headers';

export async function groupCreate(formValues) {

    const newGroup = {
        name: formValues.name,
        description: formValues.description
    }
    
    const groupCreateUrl = `${apiUrl.GET_CONTACTS}/${formValues.org_id}/group`;

    try {
    const config = await authHeaders();
  
    return axios
      .post(groupCreateUrl, newGroup, config)
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

  export async function GetGroups(org_id) {
    
    const groupUrl = `${apiUrl.GET_CONTACTS}/${org_id}/group`;
  
    try {
      const config = await authHeaders();
  
      const res = await axios.get(groupUrl, config);
  
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