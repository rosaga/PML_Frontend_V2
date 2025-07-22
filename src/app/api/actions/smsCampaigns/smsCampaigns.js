import axios from 'axios';
import { authHeaders } from '../../../api/utils/headers/headers';

const MESSAGING_API_BASE_URL = 'https://messaging-peak-1048592730476.europe-west4.run.app/api/v2';

export async function fetchAllCampaigns(baseParams) {
  let page  = 1;
  const limit = 100;
  const all  = [];

  while (true) {
    const res = await GetSmsCampaigns({ ...baseParams, page, limit });
    all.push(...(res.data ?? []));

    if (all.length >= (res.count ?? all.length) || (res.data?.length ?? 0) < limit) {
      break;
    }
    page += 1;
  }

  return { data: all, count: all.length };
}

export async function GetSmsCampaigns(params) {
  const {
    org_id,
    page,
    limit,
    status,
    year,
    month,
    day,
    ...additionalParams
  } = params;

  let campaignUrl = `${MESSAGING_API_BASE_URL}/campaign/list`;
  
  const queryParams = new URLSearchParams();
  
  if (org_id) {
    queryParams.append('org_id', org_id);
  }
  
  if (page) {
    queryParams.append('page', page);
  }
  if (limit) {
    queryParams.append('limit', limit);
  }
  
  if (status) {
    queryParams.append('status', status);
  }
  
  if (year) {
    queryParams.append('year', year);
  }
  if (month) {
    queryParams.append('month', month);
  }
  if (day) {
    queryParams.append('day', day);
  }
  
  Object.keys(additionalParams).forEach(key => {
    if (additionalParams[key]) {
      queryParams.append(key, additionalParams[key]);
    }
  });
  
  if (queryParams.toString()) {
    campaignUrl += `?${queryParams.toString()}`;
  }

  try {
    const config = await authHeaders();
    
    const res = await axios.get(campaignUrl, config);
    
    if (res.data && res.status === 200) {
      console.log("SMS Campaigns Response:", res.data);
      return {
        data: res.data.data || [],
        count: res.data.count || 0,
        total: res.data.count || 0
      };
    }
    
    return res.data;
  } catch (error) {
    console.error("Error fetching SMS campaigns:", error);
    
    if (error.response) {
      return {
        errors: {
          _error: 'The SMS campaigns could not be returned.',
          status: error.response.status,
          message: error.response.data?.msg || error.response.statusText
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

export async function CreateSmsCampaign(formValues) {
  const newCampaign = {
    name: formValues.name,
    group_id: formValues.group_id,
    bundle_size: formValues.bundle,
    sender_id: formValues.sender_id,
    content_message: formValues.content_message,
    description: formValues.description,
    slogan: formValues.slogan,
    scheduled: formValues.schedule ? formValues.schedule : null,
    org_id: formValues.org_id
  };
  
  const createCampaignUrl = `${MESSAGING_API_BASE_URL}/campaign/create`;
  
  try {
    const config = await authHeaders();
    
    const res = await axios.post(createCampaignUrl, newCampaign, config);
    
    if (res.data && res.status === 200) {
      console.log("Campaign created successfully:", res.data);
    }
    
    return res.data;
  } catch (error) {
    console.error("Error creating SMS campaign:", error);
    
    if (error.response) {
      return {
        errors: {
          _error: 'The SMS campaign could not be created.',
          status: error.response.status,
          message: error.response.data?.msg || error.response.statusText
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

export async function GetSmsCampaignDetails(org_id, campaign_id, page, pageSize) {
  let campaignUrl = `${MESSAGING_API_BASE_URL}/campaign/${campaign_id}`;
  
  const queryParams = new URLSearchParams();
  
  if (org_id) {
    queryParams.append('org_id', org_id);
  }
  if (page) {
    queryParams.append('page', page);
  }
  if (pageSize) {
    queryParams.append('size', pageSize);
  }
  
  if (queryParams.toString()) {
    campaignUrl += `?${queryParams.toString()}`;
  }
  
  try {
    const config = await authHeaders();
    
    const res = await axios.get(campaignUrl, config);
    
    if (res.data && res.status === 200) {
      console.log("Campaign details:", res.data);
    }
    
    return res.data;
  } catch (error) {
    console.error("Error fetching campaign details:", error);
    
    if (error.response) {
      return {
        errors: {
          _error: 'The campaign details could not be returned.',
          status: error.response.status,
          message: error.response.data?.msg || error.response.statusText
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

export async function UpdateSmsCampaign(campaign_id, formValues) {
  const updatedCampaign = {
    name: formValues.name,
    group_id: formValues.group_id,
    bundle_size: formValues.bundle,
    sender_id: formValues.sender_id,
    content_message: formValues.content_message,
    description: formValues.description,
    slogan: formValues.slogan,
    scheduled: formValues.schedule ? formValues.schedule : null,
    org_id: formValues.org_id
  };
  
  const updateCampaignUrl = `${MESSAGING_API_BASE_URL}/campaign/${campaign_id}`;
  
  try {
    const config = await authHeaders();
    
    const res = await axios.put(updateCampaignUrl, updatedCampaign, config);
    
    if (res.data && res.status === 200) {
      console.log("Campaign updated successfully:", res.data);
    }
    
    return res.data;
  } catch (error) {
    console.error("Error updating SMS campaign:", error);
    
    if (error.response) {
      return {
        errors: {
          _error: 'The SMS campaign could not be updated.',
          status: error.response.status,
          message: error.response.data?.msg || error.response.statusText
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

export async function DeleteSmsCampaign(campaign_id, org_id) {
  const deleteCampaignUrl = `${MESSAGING_API_BASE_URL}/campaign/${campaign_id}`;
  
  try {
    const config = await authHeaders();
    
    const urlWithOrgId = org_id ? `${deleteCampaignUrl}?org_id=${org_id}` : deleteCampaignUrl;
    
    const res = await axios.delete(urlWithOrgId, config);
    
    if (res.data && res.status === 200) {
      console.log("Campaign deleted successfully:", res.data);
    }
    
    return res.data;
  } catch (error) {
    console.error("Error deleting SMS campaign:", error);
    
    if (error.response) {
      return {
        errors: {
          _error: 'The SMS campaign could not be deleted.',
          status: error.response.status,
          message: error.response.data?.msg || error.response.statusText
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

const MESSAGING_API_BASE_URL2 =
  'https://messaging-peak-1048592730476.europe-west4.run.app/api/v1';

export async function GetSmsCampaignMessages({
  org_id,
  page = 1,
  size = 10000,
  ...filters
}) {
  if (!org_id) return { data: [], count: 0 };

  const qs = new URLSearchParams({ page, size });
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      qs.append(key, val);
    }
  });

  const url = `${MESSAGING_API_BASE_URL2}/message/${org_id}/list?${qs.toString()}`;
  console.log('Fetching messages from:', url);

  try {
    const config = await authHeaders();
    const res    = await axios.get(url, config);

    if (res.status === 200) {
      if (Array.isArray(res.data)) {
      return { data: res.data, count: res.data.length };
           }
          return {
            data : res.data.data  || [],
            count: res.data.count || 0,
          };
    }
    return { data: [], count: 0 };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { errors: { _error: 'Could not load messages' } };
  }
}
