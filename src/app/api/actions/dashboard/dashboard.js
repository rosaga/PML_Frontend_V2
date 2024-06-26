import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../../api/utils/headers/headers';


export async function GetDashboardSummary(org_id) {
  let recipientsReachedUrl = `${apiUrl.GET_CONTACTS}/${org_id}/receipientsreached?eq__rewards.status=SUCCESS`;
  let consumedDataUrl = `${apiUrl.GET_CONTACTS}/${org_id}/consumedata?eq__rewards.status=SUCCESS`;
  let activeCampaignsUrl = `${apiUrl.GET_CONTACTS}/${org_id}/activecampaigns?eq__groups.status=ACTIVE`;

  try {
    const config = await authHeaders();

    const requests = [
      axios.get(recipientsReachedUrl, config),
      axios.get(consumedDataUrl, config),
      axios.get(activeCampaignsUrl, config),
    ];

    const [recipientsReachedRes, consumedDataRes, activeCampaignsRes] = await Promise.all(requests);

 
    const dashboardSummary = {
      recipientsReached: recipientsReachedRes.data,
      consumedData: consumedDataRes.data,
      activeCampaigns: activeCampaignsRes.data[0].count,
    };
    console.log("THE RESPONSE IS1111111111111 !!!!!!!",  activeCampaignsRes)

    return dashboardSummary;
  } catch (error) {
    if (error.response) {
      return {
        errors: {
          _error: 'The dashboard summary could not be returned.',
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


export async function GetDataBalance(org_id) {
  let unitsBoughtUrl = `${apiUrl.GET_CONTACTS}/${org_id}/rechargegroup?eq__status=APPROVED`;
  let unitBalanceUrl = `${apiUrl.GET_ACCOUNTS}/balance/${org_id}`;
 

  try {
    const config = await authHeaders();

    const requests = [
      axios.get(unitsBoughtUrl, config),
      axios.get(unitBalanceUrl, config),
    ];

    const [unitsBoughtRes, unitsBalanceRes] = await Promise.all(requests);

    
    const unitsBalanceData =  unitsBalanceRes.data.data;
    const unitsBoughtData = unitsBoughtRes.data;
    
    const dashboardSummary = unitsBalanceData.map(unitBalanceItem => {
      const module =  unitBalanceItem.module;
      const id = unitBalanceItem.id;

      // Filter the corresponding items in unitsBought array
      const unitsBoughtItem = unitsBoughtData.find(unitsBoughtItem => unitsBoughtItem.package === module);

      const unitsBought = unitsBoughtItem ? parseInt(unitsBoughtItem.total) : 0;
      const unitBalance = parseInt(unitBalanceItem.units);
      const progress = unitsBought > 0 ? (unitsBought - unitBalance) / unitsBought * 100 : 0;
      return {
        id: id,
        data_bundle: module + 'MB',
        units_bought: unitsBought,
        unit_balance: unitBalance,
        progress: parseInt(progress.toFixed(0)), 
      };
    });
    console.log({dashboardSummary})

    return dashboardSummary;
  } catch (error) {
    if (error.response) {
      return {
        errors: {
          _error: 'The dashboard summary could not be returned.',
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

 