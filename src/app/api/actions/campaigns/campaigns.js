import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../../api/utils/headers/headers';

export async function CreateCampaign(formValues) {

    const newCampaign = {
        name: formValues.name,
        group_id: formValues.group_id,
        service_id: formValues.service_id,
        bundle_size: formValues.bundle,
        content: formValues.content,
        description: formValues.description,
        slogan: formValues.slogan,
        scheduled: formValues.scheduled,
        repeat_count: formValues.repeat_count,
        repeat_interval: formValues.repeat_interval
    }
    
    const createCampaignUrl = `${apiUrl.GET_CONTACTS}/${formValues.org_id}/campaign`;
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

  export async function GetCampaigns(org_id,page,pageSize,searchParams ) {

    let campaignUrl = `${apiUrl.GET_CONTACTS}/${org_id}/campaign?orderby=created_at DESC`

    if (page) {
    campaignUrl += `&page=${page}`;
  }
  if (pageSize) {
    campaignUrl += `&size=${pageSize}`;
  }
  if (searchParams) {
    const searchParamsString = new URLSearchParams(searchParams).toString();
    campaignUrl += `&${searchParamsString}`;
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
  export async function GetCampaignDetails(org_id,campaing_id,page,pageSize) {

    let groupUrl
    if (page || pageSize) {
     groupUrl = `${apiUrl.GET_CONTACTS}/${org_id}/reward?orderby=created_at DESC&eq__campaign_id=${campaing_id}&size=${pageSize}&page=${page}`;
    }else{
      groupUrl = `${apiUrl.GET_CONTACTS}/${org_id}/reward?eq__campaign_id=${campaing_id}`;
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
  export async function GetRecentCampaigns(org_id,page,pageSize) {

    let recentCampaignUrl
    if (page || pageSize) {
      recentCampaignUrl = `${apiUrl.GET_CONTACTS}/${org_id}/activecampaigns?orderby=created_at DESCeq__groups.status=ACTIVE&size=${pageSize}&page=${page}`;
    }else{
      recentCampaignUrl = `${apiUrl.GET_CONTACTS}/${org_id}/activecampaigns?orderby=created_at DESCeq__groups.status=ACTIVE`;
    }
  
    try {
      const config = await authHeaders();
  
      const res = await axios.get(recentCampaignUrl, config);
  
      if (res.data && res.status === 200) {
        console.log("THE RESPONSE IS !!!!!!!", res);
      }
  
      return res;
    } catch (error) {
      if (error.response) {
        return {
          errors: {
            _error: 'The campaigns could not be returned.',
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

  export async function CreateAirtimeCampaign(formValues) {
  const payload = {
    name: formValues.name,
    group_id: formValues.group_id,
    airtime_amount: formValues.airtime_amount,
    description: formValues.description,
    content_message: formValues.content_message,
    sender_id: formValues.sender_id,
  };

  if (formValues.scheduled) payload.scheduled = formValues.scheduled;
  if (formValues.repeat_count !== undefined) payload.repeat_count = formValues.repeat_count;
  if (formValues.repeat_interval !== undefined) payload.repeat_interval = formValues.repeat_interval;

  const url = `${apiUrl.GET_CONTACTS}/${formValues.org_id}/airtime/campaign`;

  try {
    const config = await authHeaders();
    const res = await axios.post(url, payload, config);
    return res;
  } catch (error) {
    if (error.response) return error.response;
    throw error;
  }
}

export async function GetAirtimeCampaigns(org_id, page, pageSize, searchParams) {
  let url = `${apiUrl.GET_CONTACTS}/${org_id}/airtime/campaign?orderby=created_at DESC`;
  if (page) url += `&page=${page}`;
  if (pageSize) url += `&size=${pageSize}`;
  if (searchParams) url += `&${new URLSearchParams(searchParams).toString()}`;

  try {
    const config = await authHeaders();
    const res = await axios.get(url, config);
    return res;
  } catch (error) {
    if (error.response) return error.response;
    throw error;
  }
}

export async function GetAirtimeCampaignDetails(org_id, campaign_id, page, pageSize) {
  let url;
  if (page || pageSize) {
    url = `${apiUrl.GET_CONTACTS}/${org_id}/airtime/reward?orderby=created_at DESC&eq__campaign_id=${campaign_id}&size=${pageSize}&page=${page}`;
  } else {
    url = `${apiUrl.GET_CONTACTS}/${org_id}/airtime/reward?eq__campaign_id=${campaign_id}`;
  }

  try {
    const config = await authHeaders();
    const res = await axios.get(url, config);
    return res;
  } catch (error) {
    if (error.response) return error.response;
    throw error;
  }
}
