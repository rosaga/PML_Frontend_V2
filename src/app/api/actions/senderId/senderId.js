import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../utils/headers/headers';

export async function GetSenderId(org_id,page,pageSize) {

  let senderIDUrl
  if (page || pageSize) {
    senderIDUrl = `${apiUrl.peakSMSAPP}/${org_id}/service/list?orderby=created_at DESC&size=${pageSize}&page=${page}`;
  }else{
    senderIDUrl = `${apiUrl.peakSMSAPP}/${org_id}/service/list?orderby=created_at DESC`;
  }

  try {
    const config = await authHeaders();

    const res = await axios.get(senderIDUrl, config);

    if (res.data && res.status === 200) {
      console.log("THE RESPONSE IS !!!!!!!", res);
    }

    return res;
  } catch (error) {
    if (error.response) {
      return {
        errors: {
          _error: 'The SenderID could not be returned.',
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

export async function CreateSenderID(formValues) {
  const createSenderIDUrl = `${apiUrl.peakSMS}/${formValues.org_id}/create/`;
  try {
    const authorizationLetter = formValues.authorizationLetter;
    const businessCertificate = formValues.businessCertificate;
    const senderName = formValues.senderName;

   

    const authHeaderObject = await authHeaders();
    const headers = authHeaderObject.headers;

    const formData = new FormData();
    formData.append("authorizationLetter", authorizationLetter);
    formData.append("businessCertificate", businessCertificate);
    formData.append("senderName", senderName);

    return axios.post(createSenderIDUrl, formData, {
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
          _error: 'The SenderID could not be created.',
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