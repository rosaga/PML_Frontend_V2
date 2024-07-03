import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../../api/utils/headers/headers';
import { groupCreate } from '../group/group'

export async function GetContacts(org_id, page, pageSize, searchParams) {
  let contactsUrl = `${apiUrl.GET_CONTACTS}/${org_id}/contact?eq__is_deleted=false&orderby=created_at DESC`;

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


  export async function fetchContacts(query, org_id) {
    const contactsUrl = `${apiUrl.GET_CONTACTS}/${org_id}/contact?ilike__mobile_no=${query}`;
  
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
  
      const groupResponse = await groupCreate(formValues);
  
      if (groupResponse.errors) {
        return groupResponse;
      }
  
      const groupId = groupResponse.data.id;
  
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
