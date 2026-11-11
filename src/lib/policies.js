import { FileText, ShieldCheck, Database } from "lucide-react";

export const TERMS_DOCUMENT_HREF = "/pdf/Peak%20T%26Cs.pdf";
export const PRIVACY_DOCUMENT_HREF = "/pdf/3_Peak_Privacy_Policy_v3_DRAFT%20with%20tracked%20changes.docx.pdf";
export const TERMS_PAGE_HREF = "/terms-and-conditions";
export const POLICY_EFFECTIVE_DATE = "30 October 2026";
// Change this version when publishing another terms update to show the notice again.
export const TERMS_UPDATE_VERSION = "2026-10-30";

export const POLICIES = [
  {
    id: "terms",
    title: "Terms of Service",
    effectiveDate: POLICY_EFFECTIVE_DATE,
    description: "Using Peak Mobile and your responsibilities as a customer.",
    href: TERMS_DOCUMENT_HREF,
    acknowledgement: "I have read and agree to the Terms of Service.",
    icon: FileText,
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    effectiveDate: POLICY_EFFECTIVE_DATE,
    description: "How your information is collected, used, and protected.",
    href: PRIVACY_DOCUMENT_HREF,
    acknowledgement: "I have read and acknowledge the Privacy Policy.",
    icon: ShieldCheck,
  },
];
