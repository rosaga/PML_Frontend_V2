export const TECH_PROVIDER_API_BASE_URL = (
  process.env.NEXT_PUBLIC_PEAKWHATSAPP_API_BASE_URL ||
  "https://peakwhatsappdev-1048592730476.europe-west4.run.app"
).replace(/\/+$/, "");

export const TECH_PROVIDER_CONNECTION_ID =
  process.env.NEXT_PUBLIC_TECH_PROVIDER_CONNECTION_ID || "e1fb3299-cfda-4e3b-a78b-39b14cacb51b";
