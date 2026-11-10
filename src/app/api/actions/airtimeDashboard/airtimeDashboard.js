import { GetAirtimeAccounts } from "../airtimeReward/airtimeSettings";
import { sendAirtimeReward } from "../airtimeReward/airtimeReward";
import { interpretAirtimeResult } from "@/lib/airtime/result";
import { resolveAirtimeOrganization } from "@/lib/airtime/organization";
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from "../../../api/utils/headers/headers";



export async function SendAirtimeReward(org_id, payload) {
  const response = await sendAirtimeReward({ org_id, newReward: payload });
  const result = interpretAirtimeResult(response);
  if (result.outcome !== "success") throw new Error(result.message);
  return response.data;
}

export async function GetAirtimeConsumed(org_id, dateQuery = "") {
  const config = await authHeaders();

  try {
    const externalId = await resolveAirtimeOrganization(org_id);
    let airtimeRewardsUrl = `${apiUrl.GET_AIRTIME}/${encodeURIComponent(externalId)}/airtime?size=10000`;
    
    if (dateQuery) {
      airtimeRewardsUrl += `&${dateQuery}`;
    }
    
    const response = await fetch(airtimeRewardsUrl, config);
    const rewardsResponse = await response.json();
    
    if (rewardsResponse && rewardsResponse.data && Array.isArray(rewardsResponse.data)) {
      const totalConsumed = rewardsResponse.data
        .filter((airtime_reward) => airtime_reward.status === "SUCCESS")
        .reduce((sum, airtime_reward) => {
          const amount = parseFloat(airtime_reward.airtime_amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
      return totalConsumed.toString();
    }
    return "0";
  } catch (error) {
    console.error("Failed to fetch airtime consumed:", error.message);
    return "0";
  }
}

export async function GetAirtimeReached(org_id, dateQuery = ""){
  const config = await authHeaders();

  try{
    const externalId = await resolveAirtimeOrganization(org_id);
    let receipientsreachedUrl = `${apiUrl.GET_AIRTIME}/${encodeURIComponent(externalId)}/airtime?size=10000`;

    if (dateQuery) {
      receipientsreachedUrl += `&${dateQuery}`;
    }

    const response = await fetch(receipientsreachedUrl, config);
    const rewardsResponse = await response.json();

  if (rewardsResponse && rewardsResponse.data && Array.isArray(rewardsResponse.data)) {
    const successesCount = rewardsResponse.data.filter((airtime_reward) => airtime_reward.status === "SUCCESS").length;
    return successesCount.toString();
  }
  return "0";

  } catch (error) {
    console.error("Failed to get recipients:", error.message);
    return "0"
  }

}

export async function GetAirtimeBalance(org_id) {
  const accounts = await GetAirtimeAccounts(org_id);
  return accounts[0]?.units ?? "0";
}
