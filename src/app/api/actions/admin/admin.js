import axios from "axios";
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from "../../../api/utils/headers/headers";

export async function GetAdminOrganizations(query = "") {
  const config = await authHeaders();

  try {
    const url = `${apiUrl.GET_BALANCE}/admin/organization/list${query ? `?${query}` : ""}`;
    const res = await axios.get(url, config);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch organizations:", error.message);
    throw error;
  }
}

export async function GetAdminOrganizationProfile(orgId) {
  const config = await authHeaders();

  try {
    const url = `${apiUrl.GET_BALANCE}/admin/organization/${orgId}/profile`;
    const res = await axios.get(url, config);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch organization profile:", error.message);
    throw error;
  }
}

export async function GetAdminOrganizationBalances(orgId, service = "DATA") {
  const config = await authHeaders();

  try {
    const url = `${apiUrl.GET_BALANCE}/admin/organization/${orgId}/balance?service=${encodeURIComponent(service)}`;
    const res = await axios.get(url, config);
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch ${service} balances:`, error.message);
    throw error;
  }
}

export async function AdjustAdminOrganizationBalance(orgId, payload) {
  const config = await authHeaders();

  try {
    const url = `${apiUrl.GET_BALANCE}/admin/organization/${orgId}/balance/adjust`;
    const res = await axios.post(url, payload, config);
    return res.data;
  } catch (error) {
    console.error("Failed to adjust organization balance:", error.message);
    throw error;
  }
}

export async function GetAdminDataDispatches(query = "") {
  const config = await authHeaders();

  try {
    const url = `${apiUrl.GET_BALANCE}/admin/data/dispatch/list${query ? `?${query}` : ""}`;
    const res = await axios.get(url, config);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch data dispatches:", error.message);
    throw error;
  }
}

export async function GetAdminOrganizationDataDispatches(orgId, query = "") {
  const config = await authHeaders();

  try {
    const url = `${apiUrl.GET_BALANCE}/admin/organization/${orgId}/data/dispatch/list${query ? `?${query}` : ""}`;
    const res = await axios.get(url, config);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch organization data dispatches:", error.message);
    throw error;
  }
}

export async function GetAdminBundleCatalog(query = "") {
  const config = await authHeaders();

  try {
    const url = `${apiUrl.GET_BALANCE}/admin/data/bundle-catalog${query ? `?${query}` : ""}`;
    const res = await axios.get(url, config);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch bundle catalog:", error.message);
    throw error;
  }
}

export async function CreateAdminBundleCatalog(payload) {
  const config = await authHeaders();

  try {
    const url = `${apiUrl.GET_BALANCE}/admin/data/bundle-catalog`;
    const res = await axios.post(url, payload, config);
    return res.data;
  } catch (error) {
    console.error("Failed to create bundle catalog:", error.message);
    throw error;
  }
}

export async function GetAdminBundleCatalogItem(bundleType) {
  const config = await authHeaders();

  try {
    const url = `${apiUrl.GET_BALANCE}/admin/data/bundle-catalog/${bundleType}`;
    const res = await axios.get(url, config);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch bundle catalog item:", error.message);
    throw error;
  }
}

export async function UpdateAdminBundleCatalog(bundleType, payload) {
  const config = await authHeaders();

  try {
    const url = `${apiUrl.GET_BALANCE}/admin/data/bundle-catalog/${bundleType}`;
    const res = await axios.patch(url, payload, config);
    return res.data;
  } catch (error) {
    console.error("Failed to update bundle catalog item:", error.message);
    throw error;
  }
}

export async function GetAdminDashboardSummary() {
  const config = await authHeaders();

  try {
    const url = `${apiUrl.GET_BALANCE}/admin/dashboard/summary`;
    const res = await axios.get(url, config);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch dashboard summary:", error.message);
    throw error;
  }
}

export async function AutoProvisionAdminBalance(payload) {
  const config = await authHeaders();

  try {
    const url = `${apiUrl.GET_BALANCE}/admin/recharge`;
    const res = await axios.post(url, payload, config);
    return res.data;
  } catch (error) {
    console.error("Failed to auto-provision balance:", error.message);
    throw error;
  }
}