import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../../api/utils/headers/headers';

export async function GetRewards(org_id,page,pageSize, searchParams) {

    let rewardsUrl = `${apiUrl.GET_CONTACTS}/${org_id}/reward?orderby=created_at DESC`

    if (page) {
    rewardsUrl += `&page=${page}`;
  }
  if (pageSize) {
    rewardsUrl += `&size=${pageSize}`;
  }
  if (searchParams) {
    const searchParamsString = new URLSearchParams(searchParams).toString();
    rewardsUrl += `&${searchParamsString}`;
  }
  
    try {
      const config = await authHeaders();
  
      const res = await axios.get(rewardsUrl, config);
  
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

  export async function sendReward(formValues) {
    
    const sendRewardUrl = `${apiUrl.GET_CONTACTS}/${formValues.org_id}/reward`;

    try {
    const config = await authHeaders();
  
    return axios
      .post(sendRewardUrl, formValues.newReward, config)
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

  export async function requestUnits(formValues) {
    
    const requestUnitsUrl = `${apiUrl.GET_BALANCE}/recharge/data/${formValues.org_id}`;

    try {
    const config = await authHeaders();
  
    return axios
      .post(requestUnitsUrl, formValues.newRequest, config)
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

  export async function requestSmsUnits(formValues) {
    
    const requestSmsUnits = `${apiUrl.SMS_URL}/recharge/${formValues.org_id}/requests/create`;

    try {
    const config = await authHeaders();
  
    return axios
      .post(requestSmsUnits, formValues.newRequest, config)
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

  export async function batchReward(formValues) {
    const sendRewardUrl = `${apiUrl.GET_CONTACTS}/${formValues.org_id}/batchreward`;
    try {
      const selectedFile = formValues.newReward.contacts;
  
      const authHeaderObject = await authHeaders();
      const headers = authHeaderObject.headers;
  
      const formData = new FormData();
      formData.append("contacts", selectedFile);
      formData.append("message", formValues.newReward.message);
      formData.append("bundle", formValues.newReward.bundle);
  
      return axios.post(sendRewardUrl, formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      })
        .then((res) => {
          console.log("Response:", res.data);
          return res;
        });
    } catch (error) {
      if (error.response) {
        return {
          errors: {
            _error: 'The contacts could not be uploaded.',
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



  export async function GetBalance(org_id) {
    
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

  export async function GetRecharges(org_id,page,pageSize, searchParams) {
    
    let rechargeUrl = `${apiUrl.GET_BALANCE}/recharge/data/${org_id}?page=${page}&size=${pageSize}&orderby=created_at DESC`;

    if (searchParams) {
      const searchParamsString = new URLSearchParams(searchParams).toString();
      rechargeUrl += `&${searchParamsString}`;
    }
  
    try {
      const config = await authHeaders();
  
      const res = await axios.get(rechargeUrl, config);
  
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

  export async function GetSmsRecharges(org_id,page,pageSize, searchParams) {
    
    let rechargeUrl = `${apiUrl.GET_BALANCE}/recharge/data/${org_id}?page=${page}&size=${pageSize}&orderby=created_at DESC`;

    if (searchParams) {
      const searchParamsString = new URLSearchParams(searchParams).toString();
      rechargeUrl += `&${searchParamsString}`;
    }
  
    try {
      const config = await authHeaders();
  
      const res = await axios.get(rechargeUrl, config);
  
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

