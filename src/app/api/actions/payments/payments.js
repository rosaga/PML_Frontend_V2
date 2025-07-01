import axios from "axios";
import { authHeaders } from "../../utils/headers/headers";
import apiUrl from "../../utils/apiUtils/apiUrl";

const BASE_PAYMENT_URL = apiUrl.MAKE_PAYMENT;

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

export async function processFreeTrialRequest(org_id, phoneNumber, selectedPackage) {
  if (!selectedPackage) throw new Error("No package selected.");
  if (!org_id) throw new Error("Organization ID missing.");

  const usedBefore = await checkPreviousPayments(org_id);
  if (usedBefore) throw new Error("This account is not eligible for a free trial.");

  const MSISDN = phoneNumber.startsWith("+") ? phoneNumber.slice(1) : phoneNumber;

  const payload = {
    package: selectedPackage,
    units: 5,
    amount: 0,
    MSISDN
  };

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


