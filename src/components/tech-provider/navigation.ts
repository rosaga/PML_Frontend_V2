import {
  BookUser, Bot, ClipboardList, ExternalLink, FileText, GitBranch,
  Megaphone, MessageSquare, PieChart, Send, Settings, Tag, Users, Zap,
} from "lucide-react";

export const TECH_PROVIDER_BASE = "/apps/tech-provider";
export const TECH_PROVIDER_ORGANIZATION_ID = "5bf6749b-881c-4fe2-94d2-977a6796e9bd";

export const navigationGroups = [
  {
    label: "Messages", icon: MessageSquare,
    items: [
      { name: "Templates", path: "templates", icon: FileText },
      { name: "Send Message", path: "send", icon: Send },
      { name: "Campaigns", path: "campaigns", icon: Megaphone },
      { name: "Meta Flows/Catalogues", path: "meta-flows", icon: GitBranch },
      { name: "Reports", path: "messages", icon: ClipboardList },
    ],
  },
  {
    label: "Contact Management", icon: BookUser,
    items: [
      { name: "Contact List", path: "contacts", icon: BookUser },
      { name: "Tags", path: "tags", icon: Tag },
      { name: "Groups", path: "groups", icon: Users },
    ],
  },
  {
    label: "Chatbot", icon: Bot,
    items: [
      { name: "Flows", path: "automations", icon: GitBranch },
      { name: "Reporting", path: "automations/reporting", icon: PieChart },
    ],
  },
  {
    label: "Settings", icon: Settings,
    items: [
      { name: "Account", path: "settings/account", icon: Settings },
      { name: "Top Ups", path: "settings/topups", icon: Zap },
    ],
  },
];

export const previewRoutes = [
  "quickstart", "inbox", "dashboard", "templates", "send", "campaigns", "meta-flows",
  "messages", "contacts", "tags", "groups", "automations", "automations/reporting",
  "settings/account", "settings/topups", "settings", "user", "webhook", "bulk", "recipients",
];

export function resolveDetailRoute(segments: string[]) {
  const kinds: Record<string, string> = { inbox: "conversation", recipients: "conversation", contacts: "contact", groups: "group", campaigns: "campaign" };
  if (segments.length === 2 && Object.hasOwn(kinds, segments[0]) && segments[1]) return { kind: kinds[segments[0]], id: segments[1] };
  if (segments.length === 3 && segments[0] === "meta-flows" && segments[1] && segments[2] === "submissions") return { kind: "submissions", id: segments[1] };
  return null;
}

export const quickstartFeatures = [
  { name: "WABA Application", description: "Connect your WhatsApp Business Account", path: "embedded-signup", icon: ExternalLink, color: "bg-blue-500/10 text-blue-600" },
  { name: "Templates", description: "Create and manage WhatsApp message templates", path: "templates", icon: FileText, color: "bg-chart-1/10 text-chart-1" },
  { name: "Bulk Message", description: "Send messages to multiple recipients at once", path: "send?tab=bulk", icon: MessageSquare, color: "bg-chart-3/10 text-chart-3" },
];
