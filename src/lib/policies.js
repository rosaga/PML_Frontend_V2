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
];
