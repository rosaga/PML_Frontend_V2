export const TECH_PROVIDER_API_BASE_URL = (
  process.env.NEXT_PUBLIC_PEAKWHATSAPP_API_BASE_URL ||
  "https://peakwhatsappdev-1048592730476.europe-west4.run.app"
).replace(/\/+$/, "");
