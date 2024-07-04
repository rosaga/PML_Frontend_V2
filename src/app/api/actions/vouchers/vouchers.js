import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../../api/utils/headers/headers';

export async function CreateVouchers(formValues) {

    const newVouchers = {
      total: formValues.total,
      request_id: formValues.request_id,
      bundle_size: formValues.bundle_size
    }
    
    const createVouchersUrl = `${apiUrl.GET_CONTACTS}/${formValues.org_id}/reward/voucher`; 
      try {
    const config = await authHeaders();
  
    return axios
      .post(createVouchersUrl, newVouchers, config)
      .then((res) => {
      
        if (res.data && res.status === 201) {

            console.log("THE RESPONSE IS !!!!!!!",res)
          
        }
        return res;
      })
    } catch (error) {
      if (error.response) {
        return {
          errors: {
            _error: 'The voucher could not be returned.',
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

  export async function GetVouchers(org_id,page,pageSize, searchParams) {

    let vouchersUrl = `${apiUrl.GET_CONTACTS}/${org_id}/reward/voucher?orderby=created_at DESC`;
    // console.log("SEARCH PARAMS", searchParams)
    if (page) {
      vouchersUrl += `&page=${page}`;
    }
    if (pageSize) {
      vouchersUrl += `&size=${pageSize}`;
    }

    if (searchParams) {
      const searchParamsString = new URLSearchParams(searchParams).toString();
      vouchersUrl += `&${searchParamsString}`;
    }
  
    try {
      const config = await authHeaders();
  
      const res = await axios.get(vouchersUrl, config);
  
      if (res.data && res.status === 200) {
        console.log("THE RESPONSE IS !!!!!!!", res);
      }
  
      return res;
    } catch (error) {
      if (error.response) {
        return {
          errors: {
            _error: 'The Groups could not be returned.',
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

  export async function GetCampaignDetails(org_id,page,pageSize) {

    let groupUrl
    if (page || pageSize) {
     groupUrl = `${apiUrl.GET_CONTACTS}/${org_id}/group/contact?eq__group_id=${group_id}&size=${pageSize}&page=${page}`;
    }else{
      groupUrl = `${apiUrl.GET_CONTACTS}/${org_id}/group/contact`;
    }
  
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
