import axios from "axios";
import { authHeaders } from "../../utils/headers/headers";
import apiUrl from "../../utils/apiUtils/apiUrl";

const BASE_PAYMENT_URL = apiUrl.MAKE_PAYMENT;
const SMS_BASE_PAYMENT_URL = apiUrl.SMS_MAKE_PAYMENT;
const AIRTIME_PAYMENT_URL = apiUrl.AIRTIME_PAYMENT;

export async function getPayments(
  org_id,
  page               = 1,
  perPage            = 10,
  extraSearchParams  = {},
) {
  const searchParams = {
    page: page.toString(),
    per_page: perPage.toString(),
    order_by: 'created_at',
    order: 'desc',
    ...extraSearchParams,
  };

  const query = new URLSearchParams(searchParams).toString();
  const url = `${BASE_PAYMENT_URL}/${org_id}?${query}`;

  try {
    const config = await authHeaders();
    const res    = await axios.get(url, config);
    return { data: res.data.data, count: res.data.count };
  } catch (err) {
    console.error("Error fetching payments:", err);
    return { errors: { _error: "Failed to fetch payments" } };
  }
}

export async function getSmsPayments(
  org_id,
  page               = 1,
  perPage            = 10,
  extraSearchParams  = {},
) {
  const searchParams = {
    page: page.toString(),
    per_page: perPage.toString(),
    order_by: 'created_at',
    order: 'desc',
    ...extraSearchParams,
  };

  const query = new URLSearchParams(searchParams).toString();
  const url = `${SMS_BASE_PAYMENT_URL}/${org_id}?${query}`;

  try {
    const config = await authHeaders();
    const res    = await axios.get(url, config);
    return { data: res.data.data, count: res.data.count };
  } catch (err) {
    console.error("Error fetching payments:", err);
    return { errors: { _error: "Failed to fetch payments" } };
  }
}

export async function makePayment(org_id, payload) {
  const url = `${BASE_PAYMENT_URL}/${org_id}`;
  try {
    const config = await authHeaders();
    const res = await axios.post(url, payload, config);
    if (res.status === 200 && res.data) {
      console.log("Payment initiated:", res.data);
      return res.data;
    }
    throw new Error("Unexpected response from payment API");
  } catch (err) {
    console.error("Payment initiation failed:", err);
    if (err.response?.data) {
      return { errors: { _error: err.response.data.error || "Payment initiation failed." } };
    }
    return { errors: { _error: "Network error. Please try again." } };
  }
}

export async function checkPreviousPayments(org_id) {
  const url = `${BASE_PAYMENT_URL}/${org_id}`;
  try {
    const config = await authHeaders();
    const res = await axios.get(url, config);
    const payments = res.data?.data || [];
    return payments.length > 0;
  } catch (err) {
    console.error("Error checking previous payments:", err);
    throw new Error("Failed to check payment history");
  }
}


export async function processFreeTrialRequest( 
  org_id,
  phoneNumber,
  selectedPackage,
  bundles = [],
  amount = 0
) {
  if (!selectedPackage) throw new Error("No package selected.");
  if (!org_id) throw new Error("Organization ID missing.");

  const usedBefore = await checkPreviousPayments(org_id);
  if (usedBefore) throw new Error("This account is not eligible for a free trial.");

  const MSISDN = phoneNumber.startsWith("+") ? phoneNumber.slice(1) : phoneNumber;

  const bundlesToProcess = bundles.length > 0 ? bundles : [{}];

  const formattedBundles = bundlesToProcess.map(item => ({
    bundle_type: "20",
    units: 5,
    amount: 0
  }));

  const payload = {};
  payload.bundles = formattedBundles;
  payload.amount = amount || 0;
  payload.MSISDN = MSISDN;
  payload.package = selectedPackage;

  return makePayment(org_id, payload);
}

export async function checkPaymentStatus(org_id, paymentId) {
  const url = `${BASE_PAYMENT_URL}/${org_id}?eq__id=${paymentId}`;
  try {
    const config = await authHeaders();
    const res = await axios.get(url, config);
    const payments = res.data?.data || [];
    if (payments.length === 0) {
      throw new Error("Payment not found");
    }
    return payments[0];
  } catch (err) {
    console.error("Error checking payment status:", err);
    throw new Error("Failed to check payment status");
  }
}

export async function checkSmsPaymentStatus(org_id, paymentId) {
  const url = `${SMS_BASE_PAYMENT_URL}/${org_id}?eq__id=${paymentId}`;
  try {
    const config = await authHeaders();
    const res = await axios.get(url, config);
    const payments = res.data?.data || [];
    if (payments.length === 0) {
      throw new Error("Payment not found");
    }
    return payments[0];
  } catch (err) {
    console.error("Error checking payment status:", err);
    throw new Error("Failed to check payment status");
  }
}


export async function processPaidPackageRequest(
  org_id,
  phoneNumber,
  selectedPackage,
  bundles = [],
  amount = null
) {
  if (!selectedPackage) throw new Error("No package selected.");
  if (!org_id)          throw new Error("Organization ID missing.");
  if (!Array.isArray(bundles) || bundles.length === 0) {
    throw new Error("Invalid bundles array.");
  }

  const MSISDN = phoneNumber.startsWith("+")
    ? phoneNumber.slice(1)
    : phoneNumber;

  const formattedBundles = bundles.map(item => ({
    bundle_type: item.bundle_type
               || item.code
               || "",
    units:        Number(item.units) || 0,
    amount:       Number(item.amount) || 0
  }));

  const computedAmount =
    typeof amount === "number" && !isNaN(amount)
      ? amount
      : formattedBundles.reduce((sum, b) => sum + b.amount, 0);

  const payload = {};
  payload.bundles  = formattedBundles;
  payload.amount   = computedAmount;
  payload.MSISDN   = MSISDN;
  payload.package  = selectedPackage;

  return makePayment(org_id, payload);
}

export function toMsisdn(input) {
  if (!input) return "";
  const digits = String(input).replace(/[^\d]/g, "");

  if (digits.startsWith("2547") && digits.length === 12) return digits;
  if (digits.startsWith("07") && digits.length === 10)  return `254${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 9)    return `254${digits}`;
  if (digits.startsWith("254") && digits.length === 12) return digits;

  if (digits.startsWith("0") && digits.length >= 10)    return `254${digits.slice(1)}`;

  return digits;
}

export async function makeSmsPayment(org_id, payload) {
  const url = `${SMS_BASE_PAYMENT_URL}/${org_id}`;
  try {
    const config = await authHeaders();
    const res = await axios.post(url, payload, config);
    if (res.status === 200 && res.data) {
      console.log("Payment initiated:", res.data);
      return res.data;
    }
    throw new Error("Unexpected response from payment API");
  } catch (err) {
    console.error("Payment initiation failed:", err);
    if (err.response?.data) {
      return { errors: { _error: err.response.data.error || "Payment initiation failed." } };
    }
    return { errors: { _error: "Network error. Please try again." } };
  }
}

export async function processMpesaSmsPayment(
  org_id,
  {
    units,
    amount,
    phoneNumber,
    packageCode,
  }
) {
  if (!org_id)               throw new Error("Organization ID missing.");
  if (!units || units <= 0)  throw new Error("Units must be greater than 0.");
  if (!amount || amount <= 0) throw new Error("Amount must be greater than 0.");
  if (!phoneNumber)          throw new Error("Phone number is required.");

  const msisdn = toMsisdn(phoneNumber);
  const payload = {
    units:   Number(units),
    amount:  Number(amount),
    msisdn,
    package: packageCode || "BUILD_PACKAGE",
    service: "SMS",
  };

  return makeSmsPayment(org_id, payload);
}

export async function initiateAirtimePayment(amount, phoneNumber) {
  if (!amount || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }

  const msisdn = formatMSISDN(phoneNumber);

  const payload = {
    amount: Number(amount),
    msisdn: msisdn
  };

  try {
    const response = await axios.post(AIRTIME_PAYMENT_URL, payload);
    
    if (response.status === 200 && response.data) {
      console.log("Airtime payment initiated:", response.data);
      return {
        success: true,
        data: response.data,
        payment: response.data.payment,
        message: response.data.message
      };
    }
    
    throw new Error("Unexpected response from payment API");
  } catch (err) {
    console.error("Airtime payment initiation failed:", err);
    
    if (err.response?.data) {
      return {
        success: false,
        errors: {
          _error: err.response.data.error || "Payment initiation failed."
        }
      };
    }
    
    return {
      success: false,
      errors: {
        _error: "Network error. Please try again."
      }
    };
  }
}

export async function getAirtimePayments(msisdn = null) {
  try {
    let url = AIRTIME_PAYMENT_URL;
    
    if (msisdn) {
      const formattedMsisdn = formatMSISDN(msisdn);
      url += `?msisdn=${formattedMsisdn}`;
    }

    const response = await axios.get(url);
    
    if (response.status === 200 && response.data) {
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0
      };
    }
    
    throw new Error("Failed to fetch payments");
  } catch (err) {
    console.error("Error fetching airtime payments:", err);
    return {
      success: false,
      errors: {
        _error: "Failed to fetch payment history"
      }
    };
  }
}

export async function checkAirtimePaymentStatus(requestId) {
  try {
    const response = await axios.get(AIRTIME_PAYMENT_URL);
    
    if (response.status === 200 && response.data) {
      const payments = response.data.data || [];
      const payment = payments.find(p => p.request_id === requestId);
      
      if (payment) {
        return {
          success: true,
          data: payment,
          status: payment.status
        };
      }
      
      return {
        success: false,
        errors: {
          _error: "Payment not found"
        }
      };
    }
    
    throw new Error("Failed to check payment status");
  } catch (err) {
    console.error("Error checking payment status:", err);
    return {
      success: false,
      errors: {
        _error: "Failed to check payment status"
      }
    };
  }
}

export function formatMSISDN(input) {
  if (!input) return "";
  
  const digits = String(input).replace(/[^\d]/g, "");

  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }
  
  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  
  if (digits.length === 9 && !digits.startsWith("0")) {
    return `254${digits}`;
  }
  
  if (digits.startsWith("254")) {
    return digits;
  }

  if (digits.startsWith("7") && digits.length === 9) {
    return `254${digits}`;
  }

  return digits;
}

export async function pollPaymentStatus(requestId, maxAttempts = 30, interval = 2000) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const result = await checkAirtimePaymentStatus(requestId);
    
    if (result.success && result.data) {
      const status = result.data.status;
      
      if (status !== "PENDING") {
        return result;
      }
    }
    
    attempts++;
    
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  return {
    success: false,
    errors: {
      _error: "Payment status check timed out. Please check your payment history."
    }
  };
}


