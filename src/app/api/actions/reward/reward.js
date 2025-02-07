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
  


// Get authentication token
async function getAuthToken() {
  const username = "edwinaringo32@gmail.com";
  const password = "Ferrari812Superfast";

  try {
    const response = await axios.post(
      `${apiUrl.SIGN_IN}`,
      new URLSearchParams({ Username: username, Password: password }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("Auth Response Data:", response.data);

    if (response.status === 200 && response.data.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
      return response.data.access_token;
    } else {
      throw new Error("Authentication failed: No token received");
    }
  } catch (error) {
    if (error.response) {
      console.error("Error Response:", error.response.data);
    } else {
      console.error("Error Fetching Token:", error.message);
    }
    throw new Error("Failed to authenticate admin");
  }
}

export async function sendBrandReward(formValues) {
  let accessToken;

  // Attempt to retrieve the token from the URL query parameters
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    accessToken = params.get("token");
  }

  // Fallback to using the token from localStorage via getToken()
  if (!accessToken) {
    accessToken = getToken();
  }

  // If there's still no token, alert the user and exit
  if (!accessToken) {
    alert("No valid token found. Please log in.");
    return;
  }

  const sendRewardUrl = `${apiUrl.GET_CONTACTS}/${formValues.org_id}/reward`;

  try {
    const response = await axios.post(sendRewardUrl, formValues.newReward, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 200) {
      console.log("THE RESPONSE IS !!!!!!", response);
    }
    return response;
  } catch (error) {
    // Handle token expiration (HTTP 401)
    if (error.response && error.response.status === 401) {
      console.log("Token expired. Please log in again.");
      alert("Token expired. Please log in again.");
      // Optionally, you might redirect the user to a sign-in page here.
      return;
    }

    // Handle other errors
    if (error.response) {
      return {
        errors: {
          _error: "The contacts could not be returned.",
        },
      };
    }
    return {
      errors: {
        _error: "Network error. Please try again.",
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
      formData.append("slogan", formValues.newReward.slogan);
      formData.append("postpay", formValues.newReward.postpay);

  
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

