import axios from "axios";
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from "../../utils/headers/headers";

const PAGE_SIZE = 100;

function buildListQuery(page, size) {
  return new URLSearchParams({
    page: String(page),
    size: String(size),
    eq__channel: "SENDERNAME",
  }).toString();
}

export async function GetOrganizationSenderNames(
  appId,
  page = 1,
  size = PAGE_SIZE
) {
  if (!appId) {
    throw new Error("Organization ID is required.");
  }

  const config = await authHeaders();
  const senderNames = [];
  let currentPage = page;

  while (true) {
    const query = buildListQuery(currentPage, size);
    const url = `${apiUrl.LIST_APP_SERVICES}/${encodeURIComponent(
      appId
    )}/service/list?${query}`;
    const response = await axios.get(url, config);
    const rows = Array.isArray(response.data) ? response.data : [];

    senderNames.push(...rows);

    if (rows.length < size) {
      return senderNames;
    }

    currentPage += 1;
  }
}

export async function GetAllAdminOrganizationSenderNames() {
  const config = await authHeaders();
  const senderNames = [];
  let page = 1;

  while (true) {
    const query = buildListQuery(page, PAGE_SIZE);
    const url = `${apiUrl.LIST_APP_SERVICES}/admin/service/list?${query}`;
    const response = await axios.get(url, config);
    const rows = Array.isArray(response.data) ? response.data : [];

    senderNames.push(...rows);

    if (rows.length < PAGE_SIZE) {
      return senderNames;
    }

    page += 1;
  }
}

export async function RemoveAdminOrganizationSenderName(appId, serviceId) {
  if (!appId) {
    throw new Error("Organization ID is required.");
  }

  if (serviceId === undefined || serviceId === null || serviceId === "") {
    throw new Error("Service ID is required.");
  }

  const config = await authHeaders();
  const url = `${apiUrl.MESSAGING_V2}/admin/accounts/${encodeURIComponent(
    appId
  )}/sender-ids/${encodeURIComponent(serviceId)}`;
  const response = await axios.delete(url, config);

  return response.data;
}
