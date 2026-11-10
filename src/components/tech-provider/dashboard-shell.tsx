"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeftRight, BarChart3, CheckCircle, ChevronDown, Inbox, LayoutDashboard,
  KeyRound, LayoutGrid, Loader2, LogOut, Menu, PlugZap, X,
} from "lucide-react";
import { Badge } from "@/components/whatsapp/ui/badge";
import { cn } from "@/lib/whatsapp/utils";
import { getToken, signOutUser } from "@/utils/auth";
import { getUserInfo } from "@/utils/decodeToken";
import { navigationGroups, TECH_PROVIDER_BASE as BASE, TECH_PROVIDER_ORGANIZATION_ID } from "./navigation";

const WorkspaceContext = createContext({ connected: false, markConnected: () => {} });
export const useTechProviderWorkspace = () => useContext(WorkspaceContext);

// Deliberately independent of Bulk WhatsApp's account, polling and WebSocket providers.
export function TechProviderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const markConnected = useCallback(() => setConnected(true), []);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!getToken()) return;
    if (localStorage.getItem("selectedAccountId") !== TECH_PROVIDER_ORGANIZATION_ID) {
      router.replace("/miniapp");
      return;
    }
    setAuthorized(true);
    setMobileOpen(false);
    const activeGroup = navigationGroups.find((group) => group.items.some((item) => pathname === `${BASE}/${item.path}`));
    if (activeGroup) setExpanded((previous) => ({ ...previous, [activeGroup.label]: true }));
  }, [pathname, router]);

  useEffect(() => {
    const open = () => setMobileOpen(true);
    window.addEventListener("toggle-tech-provider-sidebar", open);
    return () => window.removeEventListener("toggle-tech-provider-sidebar", open);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", close);
    };
  }, [mobileOpen]);

  if (!authorized) return <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Checking access</div>;

  const linkClass = (active: boolean) => cn(
    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    active ? "bg-[#001F3D] text-white" : "text-sidebar-foreground/70 hover:bg-[#001F3D] hover:text-white",
  );
  const quickstartActive = pathname === BASE || pathname === `${BASE}/quickstart`;

  return (
    <WorkspaceContext.Provider value={{ connected, markConnected }}>
      <div className="min-h-screen bg-background">
        {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
        <aside aria-label="Tech Provider navigation" className={cn("fixed left-0 top-0 z-50 h-dvh w-64 border-r border-border bg-sidebar shadow-lg transition-transform duration-300 lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex h-full flex-col">
            <div className="border-b border-border px-4 py-4">
              <div className="flex items-center justify-between">
                <Link href={BASE} aria-label="Tech Provider home"><Image src="/images/newpeaklogo.png" alt="Peak Mobile" width={288} height={96} className="h-10 w-auto object-contain lg:h-24" priority /></Link>
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-md p-1 text-gray-600 hover:bg-gray-200 lg:hidden"><X size={26} /></button>
              </div>
              <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tech Provider</p>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              <Link href={`${BASE}/quickstart`} aria-current={quickstartActive ? "page" : undefined} className={linkClass(quickstartActive)}><LayoutDashboard className="h-5 w-5" />Quickstart</Link>
              <Link href={`${BASE}/embedded-signup`} aria-current={pathname === `${BASE}/embedded-signup` ? "page" : undefined} className={linkClass(pathname === `${BASE}/embedded-signup`)}><PlugZap className="h-5 w-5" />Embedded Signup</Link>
              <Link href={`${BASE}/inbox`} className={linkClass(pathname === `${BASE}/inbox`)}><Inbox className="h-5 w-5" />Inbox</Link>
              <Link href={`${BASE}/dashboard`} className={linkClass(pathname === `${BASE}/dashboard`)}><BarChart3 className="h-5 w-5" />Analytics</Link>
              {navigationGroups.map((group) => {
                const active = group.items.some((item) => pathname === `${BASE}/${item.path}`);
                const open = Boolean(expanded[group.label]);
                return <div key={group.label}>
                  <button type="button" aria-expanded={open} aria-controls={`tech-nav-${group.label.replaceAll(" ", "-")}`} onClick={() => setExpanded((previous) => ({ ...previous, [group.label]: !open }))} className={cn(linkClass(active), "w-full")}>
                    <group.icon className="h-5 w-5" /><span className="flex-1 text-left">{group.label}</span><ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
                  </button>
                  {open && <div id={`tech-nav-${group.label.replaceAll(" ", "-")}`} className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                    {group.items.map((item) => <Link key={item.path} href={`${BASE}/${item.path}`} aria-current={pathname === `${BASE}/${item.path}` ? "page" : undefined} className={linkClass(pathname === `${BASE}/${item.path}`)}><item.icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 break-words">{item.name}</span></Link>)}
                  </div>}
                </div>;
              })}
            </nav>
            <div className="border-t border-border p-3"><button onClick={signOutUser} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive"><LogOut className="h-5 w-5" />Sign Out</button></div>
          </div>
        </aside>
        <main className="min-w-0 lg:pl-64">{children}</main>
      </div>
    </WorkspaceContext.Provider>
  );
}

export function TechProviderHeader({ title, description }: { title: string; description?: string }) {
  const { connected } = useTechProviderWorkspace();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [email, setEmail] = useState("");
  const dropdown = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const info = getUserInfo(getToken());
    if (info?.email) setEmail(info.email);
    const close = (event: MouseEvent) => { if (!dropdown.current?.contains(event.target as Node)) setDropdownOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setDropdownOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);
  return <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={() => window.dispatchEvent(new Event("toggle-tech-provider-sidebar"))} aria-label="Open menu" className="-ml-1 rounded-md bg-[#001F3D] p-1.5 text-white lg:hidden"><Menu size={23} /></button>
        <div><h1 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Badge variant="outline" className="hidden gap-1.5 sm:inline-flex">{connected ? <><CheckCircle className="h-3.5 w-3.5 text-green-600" />WhatsApp Connected</> : <>Tech Provider</>}</Badge>
        <div ref={dropdown} className="relative">
          <button aria-label="Account menu" aria-expanded={dropdownOpen} onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 rounded-md p-2 hover:bg-muted"><Image src="/images/avatar.png" alt="Profile" width={36} height={36} className="rounded-full border border-border" /><ChevronDown className="h-4 w-4 text-orange-500" /></button>
          {dropdownOpen && <div className="absolute right-0 z-50 mt-2 w-60 rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="border-b px-6 py-4 text-sm"><p className="font-medium">Welcome</p><p className="mt-1 truncate text-gray-600">{email || "Peak Mobile account"}</p></div>
            <Link href="/miniapp" className="flex items-center gap-3 px-6 py-3 text-sm hover:bg-gray-100"><LayoutGrid className="h-4 w-4" />Switch Products</Link>
            <Link href="/user-orgs" className="flex items-center gap-3 px-6 py-3 text-sm hover:bg-gray-100"><ArrowLeftRight className="h-4 w-4" />Switch Accounts</Link>
            <button disabled title="Coming soon" className="flex w-full items-center gap-3 border-t px-6 py-3 text-sm text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"><KeyRound className="h-4 w-4" />Change Password</button>
            <button onClick={signOutUser} className="flex w-full items-center gap-3 border-t px-6 py-3 text-sm text-red-600 hover:bg-gray-100"><LogOut className="h-4 w-4" />Logout</button>
          </div>}
        </div>
      </div>
    </div>
  </header>;
}
