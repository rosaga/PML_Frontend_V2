import apiUrl from "../../utils/apiUtils/apiUrl";

export async function updatePassword(currentPassword, newPassword, accessToken) {
  const response = await fetch(apiUrl.CHANGE_PASSWORD, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Unable to update password");
    error.status = response.status;
    throw error;
  }

  return data;
}
