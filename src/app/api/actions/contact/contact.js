import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../../api/utils/headers/headers';
import { groupCreate } from '../group/group'

export async function GetContacts(org_id, page, pageSize, searchParams) {
  let contactsUrl = `${apiUrl.GET_CONTACTS}/${org_id}/contact?orderby=created_at DESC`;

  if (page) {
    contactsUrl += `&page=${page}`;
  }
  if (pageSize) {
    contactsUrl += `&size=${pageSize}`;
  }
  if (searchParams) {
    const searchParamsString = new URLSearchParams(searchParams).toString();
    contactsUrl += `&${searchParamsString}`;
  }

  try {
    const config = await authHeaders();
    const res = await axios.get(contactsUrl, config);

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

export async function GetFlowbuilderContacts(org_id, page, pageSize, searchParams) {
  let contactsUrl = `https://flowbot-1048592730476.europe-west4.run.app/api/v2/contacts?eq__organization_id=${org_id}&orderby=created_at DESC`;

  if (page) {
    contactsUrl += `&page=${page}`;
  }
  if (pageSize) {
    contactsUrl += `&size=${pageSize}`;
  }
  if (searchParams) {
    const searchParamsString = new URLSearchParams(searchParams).toString();
    contactsUrl += `&${searchParamsString}`;
  }

  try {
    const config = await authHeaders();
    const res = await axios.get(contactsUrl, config);

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

export async function fetchContacts(filterQuery, org_id) {
  const qs = filterQuery ? `?${filterQuery}` : "";
  const contactsUrl = `${apiUrl.GET_CONTACTS}/${org_id}/contact${qs}`;
  try {
    const config = await authHeaders();
    const res = await axios.get(contactsUrl, config);
    return res.data.data;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
}


export async function contactCreate(formValues) {
  const contactCreateUrl = `${apiUrl.GET_CONTACTS}/${formValues.org_id}/contact`;

  try {
    const config = await authHeaders();

    return axios
      .post(contactCreateUrl, formValues.newContact, config)
      .then((res) => {
        if (res.data && res.status === 200) {
          console.log("THE RESPONSE IS !!!!!!!", res)
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

export async function attachContactToGroup(org_id, group_id, contactGroupData) {
  const attachUrl = `${apiUrl.GET_CONTACTS.replace('/contacts', '/organization')}/${org_id}/group/${group_id}/contact/attach`;

  try {
    const config = await authHeaders();
    
    const response = await axios.put(attachUrl, contactGroupData, config);
    
    if (response.status === 200) {
      console.log("Contacts attached to group successfully:", response.data);
    }
    
    return response;
  } catch (error) {
    console.error('Error attaching contacts to group:', error);
    if (error.response) {
      return {
        errors: {
          _error: 'The contacts could not be attached to the group.',
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

export async function attachGroupToGroup(org_id, group_id, formData) {
  const attachUrl = `${apiUrl.GET_CONTACTS.replace('/contacts', '/organization')}/${org_id}/group/${group_id}/contact/attach`;

  try {
    const cfg = await authHeaders();
    const authHeader = cfg?.headers?.Authorization || cfg?.Authorization;

    const response = await axios.put(attachUrl, formData, {
      headers: authHeader ? { Authorization: authHeader } : undefined,
      // Do NOT set Content-Type; the browser will add the multipart boundary.
    });

    if (response.status === 200 || response.status === 201) {
      console.log("CSV contacts uploaded successfully:", response.data);
    }

    return response;
  } catch (error) {
    console.error("Error uploading CSV contacts:", error);
    if (error.response) {
      return {
        errors: {
          _error:
            error.response.data?.msg ||
            error.response.data?.error ||
            "The CSV contacts could not be uploaded.",
        },
      };
    }
    return {
      errors: { _error: "Network error. Please try again." },
    };
  }
}


export async function removeContactFromGroup(org_id, group_id, contact_id) {
  const url = `${apiUrl.GET_CONTACTS}/${org_id}/groups/${group_id}/contacts/${contact_id}`;
  try {
    const config = await authHeaders();
    const response = await axios.delete(url, config);

    if (response.status === 204) {
      console.log(
        `Contact ${contact_id} removed from group ${group_id} successfully`
      );
    }

    return response;
  } catch (error) {
    console.error("Error removing contact from group:", error);
    if (error.response) {
      return {
        errors: {
          _error: "The contact could not be removed from the group.",
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

export async function getGroupContacts(org_id, groupId, page, pageSize, searchParams) {
  if (!org_id || !groupId) {
    return {
      errors: { _error: 'org_id and groupId are required.' },
    };
  }

  const baseUrl = `${apiUrl.GET_CONTACTS}/${org_id}/groups/${groupId}/contacts`;

  // Build query params safely
  const params = new URLSearchParams();
  if (page !== undefined && page !== null) params.set('page', page);
  if (pageSize !== undefined && pageSize !== null) params.set('size', pageSize);

  if (searchParams) {
    const sp = new URLSearchParams(searchParams);
    for (const [k, v] of sp.entries()) params.set(k, v);
  }

  const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

  try {
    const config = await authHeaders();
    const response = await axios.get(url, config);

    if (response.status === 200) {
      console.log('Group contacts fetched successfully:', response.data);
    }

    return response;
  } catch (error) {
    console.error('Error fetching group contacts:', error);
    if (error.response) {
      return {
        errors: { _error: 'The group contacts could not be fetched.' },
      };
    }
    return {
      errors: { _error: 'Network error. Please try again.' },
    };
  }
}


export async function contactsUploadBatch(formValues) {
  const uploadContactsUrl = `${apiUrl.GET_CONTACTS}/${formValues.org_id}/contact/upload`;
  try {
    const selectedFile = formValues.contacts;

    const authHeaderObject = await authHeaders();
    const headers = authHeaderObject.headers;

    const formData = new FormData();
    formData.append("contacts", selectedFile);

    return axios.post(uploadContactsUrl, formData, {
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

export async function contactsUpload(formValues) {
  const uploadContactsUrl = `${apiUrl.GET_CONTACTS}/${formValues.org_id}/contact/upload`;
  try {
    const selectedFile = formValues.contacts;

    let groupId = formValues.groupId;
    
    if (!groupId) {
      const groupResponse = await groupCreate(formValues);

      if (groupResponse.errors) {
        return groupResponse;
      }

      groupId = groupResponse.data.id;
    }

    const authHeaderObject = await authHeaders();
    const headers = authHeaderObject.headers;

    const formData = new FormData();
    formData.append("contacts", selectedFile);
    formData.append("group_id", groupId);

    return axios.post(uploadContactsUrl, formData, {
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