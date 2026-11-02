import { FileText, ShieldCheck, Database } from "lucide-react";

export const TERMS_DOCUMENT_HREF = "/pdf/Peak%20T%26Cs.pdf";
export const TERMS_PAGE_HREF = "/terms-and-conditions";
// Change this version when publishing another terms update to show the notice again.
export const TERMS_UPDATE_VERSION = "2026-10-26";

export const POLICIES = [
  {
    id: "terms",
    title: "Terms of Service",
    description: "Using Peak Mobile and your responsibilities as a customer.",
    href: TERMS_DOCUMENT_HREF,
    acknowledgement: "I have read and agree to the Terms of Service.",
    icon: FileText,
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    description: "How your information is collected, used, and protected.",
    href: "https://peakmobile.co.ke/privacy-policy.pdf",
    acknowledgement: "I have read and acknowledge the Privacy Policy.",
    icon: ShieldCheck,
  },
];
