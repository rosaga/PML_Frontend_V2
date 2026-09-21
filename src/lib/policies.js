import { FileText, ShieldCheck, Database } from "lucide-react";

export const POLICIES = [
  {
    id: "terms",
    title: "Terms of Service",
    description: "Using Peak Mobile and your responsibilities as a customer.",
    href: "/pdf/Peak%20T%26Cs.pdf",
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
  {
    id: "processing",
    title: "Data Processing Agreement",
    description: "How personal data is handled on behalf of your organization.",
    // Default document location; deployments can point to their hosted DPA.
    href: process.env.NEXT_PUBLIC_DPA_URL || "/pdf/data-processing-agreement.pdf",
    acknowledgement: "I have read and agree to the Data Processing Agreement.",
    icon: Database,
  },
];
