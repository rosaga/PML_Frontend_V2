import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../utils/headers/headers';

export async function GetThreshold(org_id,page,pageSize) {

    const balanceUrl = `${apiUrl.GET_BALANCE}/organization/balance/${org_id}`;
  
    try {
      const config = await authHeaders();
  
      const res = await axios.get(balanceUrl, config);
  
      if (res.data && res.status === 200) {
        console.log("THE RESPONSE IS !!!!!!!", res);
      }
  
      return res;
    } catch (error) {
      if (error.response) {
        return {
          errors: {
            _error: 'The threshold could not be returned.',
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

export async function CreateThreshold(formValues) {
    const formData = {
        bundle_size: formValues.bundle_size,
        threshold_value: parseInt(formValues.threshold_value),
    }
    const CreateThresholdUrl = `${apiUrl.getNotifiations}/${formValues.org_id}/threshold`;

    try {
        const config = await authHeaders();
      
        return axios
          .post(CreateThresholdUrl, formData, config)
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
                _error: 'The Threshold could not be returned.',
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