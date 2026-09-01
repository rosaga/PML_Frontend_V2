"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/whatsapp/utils";
import { useConfig } from "@/lib/whatsapp/config-context";
import { useMessageNotification } from "@/lib/whatsapp/message-context";
import {
  LayoutDashboard,
  FileText,
  Send,
  Settings,
  Inbox,
  BarChart3,
  Users,
  LogOut,
  Zap,
  ChevronDown,
  GitBranch,
  PieChart,
  Tag,
  BookUser,
  Bot,
  MessageSquare,
  ClipboardList,
  Megaphone,
  X,
} from "lucide-react";

const BASE = "/apps/whatsapp";

const messagesSubItems = [
  { name: "Templates", href: `${BASE}/templates`, icon: FileText },
  { name: "Send Message", href: `${BASE}/send`, icon: Send },
  { name: "Campaigns", href: `${BASE}/campaigns`, icon: Megaphone },
  { name: "Reports", href: `${BASE}/messages`, icon: ClipboardList },
];

const contactsSubItems = [
  { name: "Contact List", href: `${BASE}/contacts`, icon: BookUser },
  { name: "Tags", href: `${BASE}/tags`, icon: Tag },
  { name: "Groups", href: `${BASE}/groups`, icon: Users },
];

const chatbotSubItems = [
  { name: "Flows", href: `${BASE}/automations`, icon: GitBranch },
  { name: "Reporting", href: `${BASE}/automations/reporting`, icon: PieChart },
];

const settingsSubItems = [
  { name: "Account", href: `${BASE}/settings/account`, icon: Settings },
  { name: "Top Ups", href: `${BASE}/settings/topups`, icon: Zap },
];

export function Sidebar({
  isMobileOpen = false,
  onMobileClose,
}: {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const { signOut } = useConfig();
  const { hasNewMessage, setHasNewMessage } = useMessageNotification();

  const isMessagesActive = pathname.startsWith(`${BASE}/templates`) || pathname.startsWith(`${BASE}/send`) || pathname.startsWith(`${BASE}/campaigns`);
  const isContactsActive =
    pathname.startsWith(`${BASE}/contacts`) ||
    pathname.startsWith(`${BASE}/tags`) ||
    pathname.startsWith(`${BASE}/groups`);
  const isChatbotActive = pathname.startsWith(`${BASE}/automations`);
  const isSettingsActive = pathname.startsWith(`${BASE}/settings`);

  const [messagesOpen, setMessagesOpen] = useState(isMessagesActive);
  const [contactsOpen, setContactsOpen] = useState(isContactsActive);
  const [chatbotOpen, setChatbotOpen] = useState(isChatbotActive);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);


  useEffect(() => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  }, [pathname]); // close sidebar every time the route changes

  const navLinkClass = (isActive: boolean) =>
    cn(
      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-[#001F3D] text-white"
        : "text-sidebar-foreground/70 hover:bg-[#001F3D] hover:text-white",
    );

  const groupBtnClass = (isActive: boolean) =>
    cn(
      "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-[#001F3D] text-white"
        : "text-sidebar-foreground/70 hover:bg-[#001F3D] hover:text-white",
    );

  function ExpandableGroup({
    label,
    Icon,
    isActive,
    isOpen,
    setOpen,
    subItems,
  }: {
    label: string;
    Icon: React.ElementType;
    isActive: boolean;
    isOpen: boolean;
    setOpen: (v: boolean) => void;
    subItems: { name: string; href: string; icon: React.ElementType }[];
  }) {
    return (
      <div>
        <button onClick={() => setOpen(!isOpen)} className={groupBtnClass(isActive)}>
          <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "group-hover:text-white")} />
          <span className="flex-1 text-left">{label}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
        </button>
        {isOpen && (
          <div className="mt-1 ml-4 space-y-1 border-l border-border pl-3">
            {subItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.name} href={item.href} className={navLinkClass(active)}>
                  <item.icon className={cn("h-4 w-4 transition-colors", active ? "text-white" : "group-hover:text-white")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const isInboxActive = pathname === `${BASE}/inbox` || pathname.startsWith(`${BASE}/inbox/`);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-sidebar shadow-lg transform transition-transform duration-300",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}
    >
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.3; }
        }
        .animate-blink { animation: blink 1s infinite; }
      `}</style>
      <div className="flex h-full flex-col">
        {/* Logo + close button */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Image
            src="/images/newpeaklogo.png"
            alt="Peak Mobile"
            width={288}
            height={96}
            className="h-10 lg:h-24 w-auto object-contain"
            priority
          />
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 text-gray-600 hover:bg-gray-200 rounded-md"
          >
            <X size={26} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
          <Link href={`${BASE}/quickstart`} className={navLinkClass(pathname === `${BASE}/quickstart`)}>
            <LayoutDashboard className={cn("h-5 w-5 transition-colors", pathname === `${BASE}/quickstart` ? "text-white" : "group-hover:text-white")} />
            <span>Quickstart</span>
          </Link>

          <Link
            href={`${BASE}/inbox`}
            onClick={() => setHasNewMessage(false)}
            className={navLinkClass(isInboxActive)}
          >
            <Inbox className={cn("h-5 w-5 transition-colors", isInboxActive ? "text-white" : "group-hover:text-white")} />
            <div className="flex items-center gap-2">
              <span>Inbox</span>
              {hasNewMessage && <div className="animate-blink h-2.5 w-2.5 rounded-full bg-green-500" />}
            </div>
          </Link>

          <Link href={`${BASE}/dashboard`} className={navLinkClass(pathname === `${BASE}/dashboard`)}>
            <BarChart3 className={cn("h-5 w-5 transition-colors", pathname === `${BASE}/dashboard` ? "text-white" : "group-hover:text-white")} />
            <span>Analytics</span>
          </Link>

          <ExpandableGroup
            label="Messages"
            Icon={MessageSquare}
            isActive={isMessagesActive}
            isOpen={messagesOpen}
            setOpen={setMessagesOpen}
            subItems={messagesSubItems}
          />

          <ExpandableGroup
            label="Contact Management"
            Icon={BookUser}
            isActive={isContactsActive}
            isOpen={contactsOpen}
            setOpen={setContactsOpen}
            subItems={contactsSubItems}
          />

          <ExpandableGroup
            label="Chatbot"
            Icon={Bot}
            isActive={isChatbotActive}
            isOpen={chatbotOpen}
            setOpen={setChatbotOpen}
            subItems={chatbotSubItems}
          />

          <ExpandableGroup
            label="Settings"
            Icon={Settings}
            isActive={isSettingsActive}
            isOpen={settingsOpen}
            setOpen={setSettingsOpen}
            subItems={settingsSubItems}
          />
        </nav>

        {/* Sign Out */}
        <div className="border-t border-border p-3">
          <button
            onClick={signOut}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5 transition-colors group-hover:text-destructive" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}