export const PHONE_NUMBER_ERROR = "Enter a phone number in E.164 format, e.g. +254712345678.";

export function isValidPhoneNumber(value) {
  const phone = value.trim();
  return phone === "" || /^\+[1-9]\d{1,14}$/.test(phone);
}
