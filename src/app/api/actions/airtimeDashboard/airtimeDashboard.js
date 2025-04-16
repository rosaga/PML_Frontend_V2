import axios from "axios";
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from "../../../api/utils/headers/headers";
import { GetAirtimeRewards } from "../airtimeReward/airtimeReward"; 
import { GetAirtimeRecharges } from "../airtimeReward/airtimeReward";



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
  const config = await authHeaders();

  try {
    let airtimeRewardsUrl = `${apiUrl.GET_AIRTIME}/${org_id}/airtime?size=10000`;
    
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
    let receipientsreachedUrl = `${apiUrl.GET_AIRTIME}/${org_id}/airtime?size=10000`;

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
  let unitsBoughtUrl = `${apiUrl.GET_CONTACTS}/${org_id}/rechargegroup?eq__status=APPROVED&eq__service=AIRTIME`;
  let unitBalanceUrl = `${apiUrl.GET_ACCOUNTS}/balance/${org_id}`;

  try {
    const config = await authHeaders();

    const requests = [
      axios.get(unitsBoughtUrl, config),
      axios.get(unitBalanceUrl, config),
    ];

    const [unitsBoughtRes, unitsBalanceRes] = await Promise.all(requests);

    const unitsBalanceData = unitsBalanceRes.data.data.filter(
      (account) => account.service && account.service === "AIRTIME"
    );

    const unitsBoughtData = unitsBoughtRes.data;

    console.log("Units Bought: ", unitsBoughtData)

    const dashboardSummary = unitsBalanceData.map(unitBalanceItem => {
      const bundleModule = unitBalanceItem.module;
      const id = unitBalanceItem.id;
      const unitsBoughtItem = unitsBoughtData.find(
        (item) => item.package && item.package.toLowerCase() === bundleModule.toLowerCase()
      );
      const unitsBought = unitsBoughtItem ? parseFloat(unitsBoughtItem.total) : 0;
      const unitBalance = parseFloat(unitBalanceItem.units);
      const progress = unitsBought > 0 ? ((unitsBought - unitBalance) / unitsBought) * 100 : 0;
      return {
        id: id,
        module: bundleModule,
        units_bought: unitsBought,
        unit_balance: unitBalance,
        progress: parseFloat(progress.toFixed(0)), 
      };
    });

    if (dashboardSummary.length > 0) {
      return dashboardSummary[0].unit_balance;
    }
    return 0;
  } catch (error) {
    if (error.response) {
      return {
        errors: {
          _error: 'Airtime Balance could not be found.',
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







