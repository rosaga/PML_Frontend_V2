import axios from "axios";
import { airtimePayload, apiErrorMessage } from "@/lib/airtime/result";
import { getActiveOrganizationId, refreshOrganization, resolveAirtimeOrganization } from "@/lib/airtime/organization";
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from "../../../api/utils/headers/headers";

export async function sendAirtimeReward({ org_id, newReward }) {
  const payload = airtimePayload(newReward);
  const externalId = await resolveAirtimeOrganization(org_id);
  const config = await authHeaders();
  if (getActiveOrganizationId() !== org_id) throw new Error("The active organization changed. Review the selected account.");
  try {
    return await axios.post(`${apiUrl.GET_AIRTIME}/${encodeURIComponent(externalId)}/airtime`, payload, config);
  } catch (error) {
    // Preserve the parsed JSON on HTTP errors. Never retry a potentially delivered send.
    return error.response ?? { status: 0, data: { message: "Network error. Airtime delivery could not be confirmed." } };
  } finally {
    refreshOrganization(org_id);
  }
}

export async function GetAirtimeRewards(org_id, page = 1, pageSize = 20, searchParams) {
  const externalId = await resolveAirtimeOrganization(org_id);
  let airtimeRewardsUrl = `${apiUrl.GET_AIRTIME}/${encodeURIComponent(externalId)}/airtime?orderby=created_at%20desc`;

  if (page) {
    airtimeRewardsUrl += `&page=${page}`;
  }
  if (pageSize) {
    airtimeRewardsUrl += `&size=${pageSize}`;
  }
  if (searchParams) {
    const searchParamsString = new URLSearchParams(searchParams).toString();
    airtimeRewardsUrl += `&${searchParamsString}`;
  }

  try {
    const config = await authHeaders();
    const res = await axios.get(airtimeRewardsUrl, config);

    return res;
  } catch (error) {
    console.error("Failed to fetch airtime rewards:", error.message);
    
    if (error.response) {
      return {
        errors: {
          _error: apiErrorMessage(error, "The airtime rewards could not be returned."),
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

export async function batchAirtimeReward({ org_id, newReward }) {
    try {
      if (!newReward.rewards || newReward.rewards.length === 0) {
        throw new Error("No rewards provided in the batch.");
      }
  
      const formattedRewards = newReward.rewards.map((reward) => ({
        request_id: crypto.randomUUID(), 
        airtime_amount: reward.airtime_amount,
        msisdn: reward.msisdn.startsWith("0") ? reward.msisdn : `0${reward.msisdn}`,
        sender_id: reward.sender_id,
        message: reward.message,
        postpay: reward.postpay,
      }));
  
      const batchPayload = {
        request_id: newReward.request_id,
        rewards: formattedRewards,
      };
  
      console.log("Final Batch Payload:", JSON.stringify(batchPayload, null, 2));
  
      const sendAirtimeUrl = `${apiUrl.GET_AIRTIME}/${org_id}/airtime`;
      const config = await authHeaders();
  
      const response = await axios.post(sendAirtimeUrl, batchPayload, config);
  
      if (response.data && response.status === 200) {
        console.log("BATCH AIRTIME RESPONSE:", response);
      }
  
      return response;
    } catch (error) {
      console.error("Batch reward failed:", error.response?.data || error.message);
      return {
        errors: {
          _error: error.response?.data?.error || "Batch reward request failed.",
        },
      };
    }
  }

  export async function GetAirtimeRecharges(org_id, page, pageSize, searchParams = {}) {
    const airtimeSearchParams = {
        ...searchParams,
        'eq__service': 'AIRTIME'
    };

    const externalId = await resolveAirtimeOrganization(org_id);
    let rechargeUrl = `${apiUrl.GET_BALANCE}/recharge/data/${encodeURIComponent(externalId)}?page=${page}&size=${pageSize}&orderby=created_at%20desc`;

    // Convert search params to URL string
    const searchParamsString = new URLSearchParams(airtimeSearchParams).toString();
    rechargeUrl += `&${searchParamsString}`;
  
    try {
      const config = await authHeaders();
  
      const res = await axios.get(rechargeUrl, config);
  
      if (res.data && res.status === 200) {
        console.log("Airtime Recharges Response:", res);
      }
  
      return res;
    } catch (error) {
      if (error.response) {
        return {
          errors: {
            _error: 'The airtime recharges could not be returned.',
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
  
