import axios from "axios";
import { authHeaders } from "../../utils/headers/headers";
import apiUrl from "../../utils/apiUtils/apiUrl";

export async function makePayment(org_id, paymentData) {
  const paymentUrl = `${apiUrl.GET_BALANCE}/payment/${org_id}`;

  try {
    const config = await authHeaders();
    return axios
      .post(paymentUrl, paymentData, config)
      .then((res) => {
        if (res.data && res.status === 200) {
          console.log("Payment successful:", res);
        }
        return res;
      });
  } catch (error) {
    console.error("Payment initiation failed:", error.message);
    if (error.response) {
      return {
        errors: {
          _error: "Payment initiation failed.",
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

export async function checkPreviousPayments(org_id) {
  const rechargeUrl = `${apiUrl.GET_BALANCE}/payment/${org_id}`;

  try {
    const config = await authHeaders();
    const response = await axios.get(rechargeUrl, config);

    return !!(response.data && response.data.data && response.data.data.length > 0);
  } catch (error) {
    console.error("Error checking previous payments:", error);
    throw new Error("Failed to check eligibility for free trial");
  }
}

export async function processFreeTrialRequest(org_id, phoneNumber, selectedPackage) {
  if (!selectedPackage) {
    throw new Error("No package selected. Please choose a package from the available options.");
  }

  if (!org_id) {
    throw new Error("Organization ID not found. Please log in again.");
  }

  try {
    const hasPreviousRecharges = await checkPreviousPayments(org_id);
    
    if (hasPreviousRecharges) {
      throw new Error("This account is not eligible for a free trial.");
    }
    
    const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;
    const request_id = `req_${Date.now()}`;
    
    const paymentData = {
      bundles: [{
        "bundle_type": "20",
        "units": 5,
        "amount": 0
      }],
      amount: 0,
      MSISDN: normalizedPhone,
      request_id: request_id,
      package: selectedPackage,
    };
    
    const result = await makePayment(org_id, paymentData);
    return result;
  } catch (error) {
    console.error("Free trial process failed:", error);
    throw error;
  }
}