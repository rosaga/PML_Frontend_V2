import axios from 'axios';
import { authHeaders } from '../../../api/utils/headers/headers';

const MESSAGING_API_BASE_URL = 'https://messaging-peak-1048592730476.europe-west4.run.app/api/v2';

export async function fetchAllCampaigns(baseParams) {
  let page  = 1;
  const limit = 100;
  const all  = [];

  while (true) {
    const res = await GetSmsCampaigns({ ...baseParams, page, limit, orderby: "id DESC" });
    all.push(...(res.data ?? []));

    if (all.length >= (res.count ?? all.length) || (res.data?.length ?? 0) < limit) {
      break;
    }
    page += 1;
  }

  return { data: all, count: all.length };
}

export async function GetSmsCampaigns(params = {}) {
  const {
    org_id,
    page,
    limit,
    status,
    year,
    month,
    day,
    orderby,

    // Server-side filter parameters
    like__name,
    like__description,
    like__content,
    eq__id,
    eq__service_id,
    eq__group_id,
    gte__createdat,
    lte__createdat,
    gte__scheduled,
    lte__scheduled,

    // Keep these here so old callers do not break,
    // but do not send them to the backend.
    email,
    eq__org_id,

    ...additionalParams
  } = params;

  let campaignUrl = `${MESSAGING_API_BASE_URL}/campaign/list`;
  const queryParams = new URLSearchParams();

  // Campaign ownership is now resolved by backend using:
  // org_id -> application_services_v.application_id -> campaigns.application_services_id
  if (org_id) {
    queryParams.append('org_id', org_id);
  }

  if (page != null) {
    queryParams.append('page', page);
  }

  if (limit != null) {
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

  if (orderby) {
    queryParams.append('orderby', orderby);
  }

  // Server filters
  if (like__name) {
    queryParams.append('like__name', like__name);
  }

  if (like__description) {
    queryParams.append('like__description', like__description);
  }

  if (like__content) {
    queryParams.append('like__content', like__content);
  }

  if (eq__id) {
    queryParams.append('eq__id', eq__id);
  }

  if (eq__service_id) {
    queryParams.append('eq__service_id', eq__service_id);
  }

  if (eq__group_id) {
    queryParams.append('eq__group_id', eq__group_id);
  }

  if (gte__createdat) {
    queryParams.append('gte__createdat', gte__createdat);
  }

  if (lte__createdat) {
    queryParams.append('lte__createdat', lte__createdat);
  }

  if (gte__scheduled) {
    queryParams.append('gte__scheduled', gte__scheduled);
  }

  if (lte__scheduled) {
    queryParams.append('lte__scheduled', lte__scheduled);
  }

  Object.entries(additionalParams).forEach(([key, val]) => {
    if (val != null && val !== '') {
      queryParams.append(key, val);
    }
  });

  if (queryParams.toString()) {
    campaignUrl += `?${queryParams.toString()}`;
  }

  console.log('API Request URL:', campaignUrl);

  try {
    const config = await authHeaders();
    const res = await axios.get(campaignUrl, config);

    if (res.status === 200 && res.data) {
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