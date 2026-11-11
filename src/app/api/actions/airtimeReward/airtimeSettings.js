import axios from "axios";
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from "../../utils/headers/headers";
import { apiErrorMessage } from "@/lib/airtime/result";
import { getActiveOrganizationId, refreshOrganization, resolveAirtimeOrganization } from "@/lib/airtime/organization";

export async function GetAirtimeAccounts(orgId) {
  const externalId = await resolveAirtimeOrganization(orgId);
  const config = await authHeaders();
  const accounts = [];
  try {
    for (let page = 1; ; page++) {
      const params = new URLSearchParams({ eq__service: "AIRTIME", page: String(page), size: "20" });
      const response = await axios.get(`${apiUrl.GET_BALANCE}/organization/balance/${encodeURIComponent(externalId)}?${params}`, config);
      if (!Array.isArray(response.data?.data) || typeof response.data.count !== "number") throw new Error("The airtime account response is invalid.");
      accounts.push(...response.data.data);
      if (accounts.length >= response.data.count) break;
      if (!response.data.data.length) throw new Error("The airtime account list is incomplete. Please refresh the page.");
    }
    return accounts.filter((account) => account.service === "AIRTIME");
  } catch (error) {
    throw new Error(apiErrorMessage(error, error.message || "Unable to load airtime balances."));
  }
}

export function airtimeThresholdPayload({ threshold_value }) {
  if (String(threshold_value ?? "").trim() === "" || !Number.isSafeInteger(Number(threshold_value)) || Number(threshold_value) < 0) {
    throw new Error("Threshold must be a nonnegative integer. Enter zero to disable alerts.");
  }
  return { service: "AIRTIME", threshold_value: Number(threshold_value) };
}

export async function SaveAirtimeThreshold({ org_id, threshold_value }) {
  const payload = airtimeThresholdPayload({ threshold_value });
  const externalId = await resolveAirtimeOrganization(org_id);
  const config = await authHeaders();
  if (getActiveOrganizationId() !== org_id) throw new Error("The active organization changed. Review the selected account.");
  try {
    const response = await axios.post(`${apiUrl.GET_AIRTIME}/${encodeURIComponent(externalId)}/threshold`, payload, config);
    refreshOrganization(org_id, "airtime-threshold-updated");
    return response;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Unable to save the airtime threshold."));
  }
}

export async function GetAirtimeNotifications(orgId, page = 1, pageSize = 20) {
  const externalId = await resolveAirtimeOrganization(orgId);
  const params = new URLSearchParams({ page: String(page), size: String(pageSize) });
  const config = await authHeaders();
  try {
    return await axios.get(`${apiUrl.GET_AIRTIME}/${encodeURIComponent(externalId)}/notification?${params}&orderby=created_at%20desc`, config);
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Unable to load airtime notifications."));
  }
}
