import axios from "axios";
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from "../../../api/utils/headers/headers";
import { GetAirtimeRewards } from "../airtimeReward/airtimeReward"; 


export async function GetAirtimeRewardsList(org_id, dateQuery = "") {
    const airtimeListUrl = `${apiUrl.GET_AIRTIME}/${org_id}/airtime${dateQuery}`;
    const config = await authHeaders();
  
    try {
      const res = await axios.get(airtimeListUrl, config);
  
      if (res && res.status === 200 && res.data && Array.isArray(res.data.data)) {
        console.log("THE AIRTIME RESPONSE IS !!!!!!!", res.data);
        return {
          data: res.data.data, 
        };
      } else {
        console.error("Unexpected API response structure:", res);
        return { data: [], count: 0 };
      }
    } catch (error) {
      console.error("Failed to fetch airtime rewards:", error.message);
      return { data: [], count: 0 }; 
    }
}


  
export async function SendAirtimeReward(org_id, payload) {
  const airtimeSendUrl = `${apiUrl.GET_AIRTIME}/${org_id}/airtime`;
  const config = await authHeaders();

  try {
    const res = await axios.post(airtimeSendUrl, payload, config);
    return res.data;
  } catch (error) {
    console.error("Failed to send airtime reward:", error.message);
    throw error;
  }
}

export async function GetAirtimeConsumed(org_id, dateQuery = "") {
  try {
    const rewardsResponse = await GetAirtimeRewards(org_id, dateQuery);
    
    if (rewardsResponse && rewardsResponse.data && Array.isArray(rewardsResponse.data)) {
      const totalConsumed = rewardsResponse.data
        .filter((reward) => reward.status === "SUCCESS")
        .reduce((sum, reward) => {
          return sum + Number(reward.airtime_amount);
        }, 0);
      return totalConsumed;
    }
    return 0;
  } catch (error) {
    console.error("Failed to fetch airtime consumed:", error.message);
    return 0;
  }
}

