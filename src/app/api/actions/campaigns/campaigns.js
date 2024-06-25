import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../../api/utils/headers/headers';

export async function CreateCampaign(formValues) {

    const newCampaign = {
        name: formValues.name,
        group_id: formValues.group_id,
        bundle_size: formValues.bundle
    }
    
    const createCampaignUrl = `${apiUrl.GET_CONTACTS}/${formValues.org_id}/campaign`;
    console.log('kkkk',createCampaignUrl,newCampaign )
    try {
    const config = await authHeaders();
  
    return axios
      .post(createCampaignUrl, newCampaign, config)
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
            _error: 'The Campaigns could not be returned.',
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

  export async function GetCampaigns(org_id,campaing_id,page,pageSize) {

    let campaignUrl
    if (page || pageSize) {
      campaignUrl = `${apiUrl.GET_CONTACTS}/${org_id}/campaign?size=${pageSize}&page=${page}`;
    }else{
      campaignUrl = `${apiUrl.GET_CONTACTS}/${org_id}/campaign`;
    }
  
    try {
      const config = await authHeaders();
  
      const res = await axios.get(campaignUrl, config);
  
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
