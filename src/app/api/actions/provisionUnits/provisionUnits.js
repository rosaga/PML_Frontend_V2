import axios from "axios";
import { authHeaders } from "../../utils/headers/headers";
import apiUrl from "../../utils/apiUtils/apiUrl";


export async function autoProvisionUnits({ org_id, newRequest, orgUnitId = null }) {
  const provisionUrl = `${apiUrl.APPROVE_UNITS}`;

  try {
    const config = await authHeaders();
    
    const payload = {
      package: newRequest.package,
      units: newRequest.units,
      service: newRequest.service,
      org_id: org_id
    };
    
    if (orgUnitId) {
      payload.org_unit_id = orgUnitId;
    }

    return axios
      .post(provisionUrl, payload, config)
      .then((res) => {
        return {
          status: res.status,
          data: res.data
        };
      });
  } catch (error) {
    console.error("Auto-provisioning units failed:", error.message);
    if (error.response) {
      return {
        status: error.response.status,
        error: error.response.data,
      };
    }
    return {
      status: 500,
      error: {
        message: "Network error. Please try again."
      }
    };
  }
}

export async function getBalance(org_id) {
  const balanceUrl = `${apiUrl.GET_BALANCE}/organization/${org_id}/balance`;

  try {
    const config = await authHeaders();
    const response = await axios.get(balanceUrl, config);
    
    return {
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error("Error getting balance:", error.message);
    if (error.response) {
      return {
        status: error.response.status,
        error: error.response.data,
      };
    }
    return {
      status: 500,
      error: {
        message: "Network error while fetching balance. Please try again."
      }
    };
  }
}

export async function getAllOrgUnits(org_id) {
  const unitsUrl = `${apiUrl.GET_BALANCE}/organization/${org_id}/units`;

  try {
    const config = await authHeaders();
    const response = await axios.get(unitsUrl, config);
    
    return {
      status: response.status,
      data: response.data.data || []
    };
  } catch (error) {
    console.error("Error getting organization units:", error.message);
    if (error.response) {
      return {
        errors: {
          _error: "Failed to retrieve organization units."
        }
      };
    }
    return {
      errors: {
        _error: "Network error while fetching units. Please try again."
      }
    };
  }
}