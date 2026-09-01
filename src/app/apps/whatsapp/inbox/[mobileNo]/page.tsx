"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConfig } from "@/lib/whatsapp/config-context";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Card } from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Button } from "@/components/whatsapp/ui/button";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { ArrowLeft, Send, Phone, CheckCheck, Check, Search, Tag as TagIcon, User, Paperclip, ImageIcon, FileText, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/whatsapp/use-toast";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/whatsapp/ui/alert-dialog";
import { useTags } from "@/lib/whatsapp/tags-context";
import { persistNames, loadNames } from "@/lib/whatsapp/name-cache";
import {
  type Recipient,
  readCache,
  writeCache,
  applyMessages,
  sortedConversations,
  hydrateNamesFromCache,
  fetchInboxMessages,
} from "@/lib/whatsapp/inbox-cache";

interface Message {
  id: string;
  mobile_no: string;
  direction: string;
  type: string;
  category: string;
  status: string;
  template_name?: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
}

type ReadFilter = "all" | "unread" | "read";

export default function InboxChatPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { organizationId, pmlOrganizationId, isLoading: contextLoading, signalPmlUnauthorized } = useConfig();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mobileNo = decodeURIComponent(params.mobileNo as string);
  const { tags, getTagsForContact, addContactToTag, removeContactFromTag } = useTags();
  const contactTags = getTagsForContact(mobileNo);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [sidebarReadFilter, setSidebarReadFilter] = useState<ReadFilter>("all");
  const [sidebarPage, setSidebarPage] = useState(1);
  const [sidebarPageSize] = useState(25);
  const sidebarNameFetchedRef = useRef<Set<string>>(new Set());
  const sidebarNewestAtRef = useRef<string>("");

  const [contactName, setContactName] = useState("");
  const [contactNameLoaded, setContactNameLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [config, setConfig] = useState({ apiKey: "", wabaId: "", phoneNumberId: "" });

  const [mediaAttachment, setMediaAttachment] = useState<{ type: "image" | "document"; url: string; filename?: string } | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("whatsapp-api-config");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.apiKey && parsed.phoneNumberId) setConfig(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    // Hydrate from name cache immediately — avoids skeleton on contacts already looked up
    if (organizationId) {
      try {
        const cached = loadNames(organizationId);
        if (mobileNo in cached) {
          const c = cached[mobileNo];
          const raw = [c.firstName, c.lastName].filter(Boolean).join(" ");
          const name = (raw && c.maybe) ? `Maybe: ${raw}` : raw;
          setContactName(name);
          setContactNameLoaded(true); // already fetched before — no skeleton needed
        } else {
          setContactName("");
          setContactNameLoaded(false);
        }
      } catch {
        setContactName("");
        setContactNameLoaded(false);
      }
    } else {
      setContactName("");
      setContactNameLoaded(false);
    }
    if (!contextLoading && organizationId) fetchMessages();
  }, [mobileNo, contextLoading, organizationId, pmlOrganizationId]);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredRecipients(
        recipients.filter((r) =>
          r.mobile_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredRecipients(recipients);
    }
  }, [searchQuery, recipients]);

  // Reset sidebar to page 1 when filter, search, or page size changes
  useEffect(() => { setSidebarPage(1); }, [sidebarReadFilter, searchQuery, sidebarPageSize]);

  // Lazy-load names only for visible sidebar contacts
  const visibleSidebarKeys = (
    sidebarReadFilter === "unread"
      ? filteredRecipients.filter((r) => r.has_unread)
      : sidebarReadFilter === "read"
      ? filteredRecipients.filter((r) => !r.has_unread)
      : filteredRecipients
  ).slice(0, sidebarPageSize).map((r) => r.mobile_no).join(",");

  useEffect(() => {
    if (!pmlOrganizationId) return;
    const authToken = localStorage.getItem("token") ?? "";
    if (!authToken) return;

    const nameCache = loadNames(organizationId);
    const toFetch = visibleSidebarKeys
      .split(",")
      .filter((no) => {
        if (!no || sidebarNameFetchedRef.current.has(no)) return false;
        // Already in name cache (even if empty) — skip the slow API call
        if (no in nameCache) { sidebarNameFetchedRef.current.add(no); return false; }
        return true;
      });
    if (toFetch.length === 0) return;
    toFetch.forEach((no) => sidebarNameFetchedRef.current.add(no));
    toFetch.forEach(async (no) => {
      try {
        const r = await fetch(
          `/api/whatsapp/contacts?organizationId=${encodeURIComponent(pmlOrganizationId)}&mobileNo=${encodeURIComponent(no)}`,
          { headers: { "x-auth-token": authToken } },
        );
        if (r.status === 401) { signalPmlUnauthorized(); return; }

        let firstName = "", lastName = "", maybe = false;
        if (r.ok) {
          const c = await r.json();
          const realFirst = c?.first_name || "";
          const realLast  = c?.last_name  || "";
          if (realFirst || realLast) {
            firstName = realFirst; lastName = realLast;
          } else {
            firstName = c?.metadata?.FIRSTNAME || "";
            lastName  = c?.metadata?.LASTNAME  || "";
            maybe = !!(firstName || lastName);
          }
        }
        const raw = [firstName, lastName].filter(Boolean).join(" ");
        const name = raw ? (maybe ? `Maybe: ${raw}` : raw) : "";
        if (name) {
          setRecipients((prev) => prev.map((rec) => rec.mobile_no === no ? { ...rec, name } : rec));
          setFilteredRecipients((prev) => prev.map((rec) => rec.mobile_no === no ? { ...rec, name } : rec));
        }
        // Always persist — marks contact as "already checked" for future navigations
        const stored = loadNames(organizationId);
        persistNames(organizationId, { ...stored, [no]: { firstName, lastName, maybe } });
      } catch { /* ignore */ }
    });
  }, [visibleSidebarKeys, pmlOrganizationId, organizationId, signalPmlUnauthorized]);

  // Close attach menu when clicking outside
  useEffect(() => {
    if (!showAttachMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAttachMenu]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load sidebar conversations from shared cache (same data as inbox list page)
  const loadSidebarFromCache = useCallback(async () => {
    if (!organizationId) return;
    sidebarNameFetchedRef.current = new Set();

    const cache = readCache(organizationId);
    if (cache && cache.conversations.length > 0) {
      sidebarNewestAtRef.current = cache.newestMessageAt;
      const hydrated = hydrateNamesFromCache(cache.conversations, organizationId);
      setRecipients(hydrated);
      setFilteredRecipients(hydrated);
      // Background: fetch new messages since cache was built
      try {
        const msgs = await fetchInboxMessages(organizationId, { gt__created_at: cache.newestMessageAt });
        if (msgs.length > 0) {
          const map = new Map<string, Recipient>();
          for (const r of hydrated) map.set(r.mobile_no, { ...r });
          const newestAt = applyMessages(map, msgs, sidebarNewestAtRef.current);
          sidebarNewestAtRef.current = newestAt;
          const sorted = hydrateNamesFromCache(sortedConversations(map), organizationId);
          writeCache(organizationId, { conversations: sortedConversations(map), newestMessageAt: newestAt, cachedAt: Date.now() });
          setRecipients(sorted);
          setFilteredRecipients(sorted);
        }
      } catch { /* ignore */ }
    } else {
      // No cache — cold load
      const msgs = await fetchInboxMessages(organizationId);
      const map = new Map<string, Recipient>();
      const newestAt = applyMessages(map, msgs, "");
      sidebarNewestAtRef.current = newestAt;
      const sorted = hydrateNamesFromCache(sortedConversations(map), organizationId);
      writeCache(organizationId, { conversations: sortedConversations(map), newestMessageAt: newestAt, cachedAt: Date.now() });
      setRecipients(sorted);
      setFilteredRecipients(sorted);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!contextLoading && organizationId) loadSidebarFromCache();
  }, [contextLoading, organizationId, loadSidebarFromCache]);

  const fetchMessages = async () => {
    try {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await fetch(
        `/api/whatsapp/whatsapp-internal/messages/list?eq__mobile_no=${encodeURIComponent(mobileNo)}&page=1&size=200&orderby=created_at DESC`,
        { headers: { "x-organization-id": organizationId } }
      );
      const data = await response.json();

      if (data?.data && Array.isArray(data.data)) {
        const sorted = (data.data as Message[]).sort(
          (a, b) =>
            new Date(a.created_at || a.updated_at || "").getTime() -
            new Date(b.created_at || b.updated_at || "").getTime()
        );
        setMessages(sorted);
        setLoading(false); // Show messages immediately — don't wait for contact name

        // Fetch contact name in background — skip if already in name cache
        const authToken = localStorage.getItem("token") ?? "";
        if (authToken && pmlOrganizationId) {
          const nameCache = loadNames(organizationId);
          if (mobileNo in nameCache) {
            // Already looked up previously — use cached result, no API call needed
            setContactNameLoaded(true);
          } else {
            fetch(
              `/api/whatsapp/contacts?organizationId=${encodeURIComponent(pmlOrganizationId)}&mobileNo=${encodeURIComponent(mobileNo)}`,
              { headers: { "x-auth-token": authToken } },
            ).then(async (r) => {
              if (r.status === 401) { signalPmlUnauthorized(); return; }
              let firstName = "", lastName = "", maybe = false;
              if (r.ok) {
                const c = await r.json();
                const realFirst = c?.first_name || "";
                const realLast  = c?.last_name  || "";
                if (realFirst || realLast) {
                  firstName = realFirst; lastName = realLast;
                } else {
                  firstName = c?.metadata?.FIRSTNAME || "";
                  lastName  = c?.metadata?.LASTNAME  || "";
                  maybe = !!(firstName || lastName);
                }
              }
              const raw = [firstName, lastName].filter(Boolean).join(" ");
              if (raw) setContactName(maybe ? `Maybe: ${raw}` : raw);
              // Always persist — marks contact as "already checked" for future navigations
              const stored = loadNames(organizationId);
              persistNames(organizationId, { ...stored, [mobileNo]: { firstName, lastName, maybe } });
            }).catch(() => { /* ignore */ }).finally(() => setContactNameLoaded(true));
          }
        } else {
          setContactNameLoaded(true);
        }

        // Mark unread inbound messages as read — fire-and-forget
        const unreadIds = (data.data as any[])
          .filter((m) => m.direction === "INBOUND" && !m.read_at)
          .map((m) => m.id);
        if (unreadIds.length > 0) {
          const cache = readCache(organizationId);
          if (cache) {
            writeCache(organizationId, {
              ...cache,
              conversations: cache.conversations.map((r) =>
                r.mobile_no === mobileNo
                  ? { ...r, has_unread: false, unread_message_ids: [] }
                  : r,
              ),
            });
          }
          fetch("/api/whatsapp/whatsapp-internal/messages/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message_ids: unreadIds }),
          }).catch(() => { /* ignore */ });
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "document") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowAttachMenu(false);
    setMediaUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("public_id", `inbox_${type}_${Date.now()}`);
      const res = await fetch("/api/whatsapp/cloudinary/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
      const data = await res.json();
      setMediaAttachment({ type, url: data.url, filename: type === "document" ? file.name : undefined });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setMediaUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (documentInputRef.current) documentInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !mediaAttachment) return;

    try {
      setSending(true);

      let payload: object;
      if (mediaAttachment) {
        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: mobileNo,
          type: mediaAttachment.type,
          [mediaAttachment.type]: {
            link: mediaAttachment.url,
            ...(messageText.trim() ? { caption: messageText.trim() } : {}),
            ...(mediaAttachment.type === "document" && mediaAttachment.filename
              ? { filename: mediaAttachment.filename }
              : {}),
          },
        };
      } else {
        payload = {
          messaging_product: "whatsapp",
          preview_url: false,
          recipient_type: "individual",
          to: mobileNo,
          type: "text",
          text: { body: messageText },
        };
      }

      const response = await fetch("/api/whatsapp/whatsapp-internal/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "x-phone-number-id": config.phoneNumberId,
          "x-organization-id": organizationId || "",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: "Message sent", description: "Your message has been sent successfully" });
        setMessageText("");
        setMediaAttachment(null);
        setTimeout(() => {
          fetchMessages();
          loadSidebarFromCache();
        }, 1000);
      } else {
        throw new Error(data.error?.message || "Failed to send message");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "READ": return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "DELIVERED": return <CheckCheck className="h-3 w-3 text-gray-500" />;
      case "SENT": return <Check className="h-3 w-3 text-gray-500" />;
      default: return <Check className="h-3 w-3 text-gray-400" />;
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach((msg) => {
      const date = formatDate(msg.created_at || msg.updated_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  const truncateMessage = (text: string, maxLength = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const markSidebarAsRead = async (targetMobile: string) => {
    const r = recipients.find((rec) => rec.mobile_no === targetMobile);
    if (!r?.has_unread || r.unread_message_ids.length === 0) return;
    try {
      await fetch("/api/whatsapp/whatsapp-internal/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_ids: r.unread_message_ids }),
      });
      setRecipients((prev) =>
        prev.map((rec) =>
          rec.mobile_no === targetMobile ? { ...rec, has_unread: false, unread_message_ids: [] } : rec,
        ),
      );
    } catch { /* ignore */ }
  };

  const sidebarFiltered = (
    sidebarReadFilter === "unread"
      ? filteredRecipients.filter((r) => r.has_unread)
      : sidebarReadFilter === "read"
      ? filteredRecipients.filter((r) => !r.has_unread)
      : filteredRecipients
  );
  const sidebarTotalPages = Math.max(1, Math.ceil(sidebarFiltered.length / sidebarPageSize));
  const displayedRecipients = sidebarFiltered.slice(
    (sidebarPage - 1) * sidebarPageSize,
    sidebarPage * sidebarPageSize,
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-2rem)] flex">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3">Conversations</h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {(["all", "unread", "read"] as ReadFilter[]).map((f) => {
                const label = f === "all" ? "All" : f === "unread" ? "Unread" : "Read";
                const count =
                  f === "all" ? filteredRecipients.length :
                  f === "unread" ? filteredRecipients.filter((r) => r.has_unread).length :
                  filteredRecipients.filter((r) => !r.has_unread).length;
                return (
                  <button
                    key={f}
                    onClick={() => setSidebarReadFilter(f)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      sidebarReadFilter === f
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {label}{count > 0 ? ` (${count})` : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {displayedRecipients.map((recipient) => (
              <div
                key={recipient.mobile_no}
                onClick={() => {
                  markSidebarAsRead(recipient.mobile_no);
                  router.push(`/apps/whatsapp/inbox/${encodeURIComponent(recipient.mobile_no)}`);
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  recipient.mobile_no === mobileNo ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative inline-block shrink-0">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-200">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    {recipient.has_unread && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm text-gray-900 truncate ${recipient.has_unread ? "font-semibold" : "font-medium"}`}>
                        {recipient.name || recipient.mobile_no}
                      </p>
                      <Badge variant={recipient.has_unread ? "default" : "secondary"} className="text-xs shrink-0">
                        {recipient.message_count}
                      </Badge>
                    </div>
                    {getTagsForContact(recipient.mobile_no).length > 0 && (
                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        {getTagsForContact(recipient.mobile_no).map((t) => (
                          <span
                            key={t.id}
                            className="px-1.5 rounded-full text-[9px] font-medium text-white leading-4"
                            style={{ backgroundColor: t.color }}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {recipient.name && (
                      <p className="text-xs text-gray-400 font-mono truncate">{recipient.mobile_no}</p>
                    )}
                    <p className="text-xs text-gray-500 truncate">
                      {recipient.last_message ? truncateMessage(recipient.last_message) : "No messages"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar pagination */}
          <div className="border-t border-gray-200 p-2 shrink-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarPage((p) => Math.max(1, p - 1))}
                disabled={sidebarPage === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-500">Page {sidebarPage} of {sidebarTotalPages}</span>
              <button
                onClick={() => setSidebarPage((p) => Math.min(sidebarTotalPages, p + 1))}
                disabled={sidebarPage >= sidebarTotalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors rotate-180"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-center text-gray-400">
              {sidebarFiltered.length} conversation{sidebarFiltered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header — clickable to open contact details */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-gray-200">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => router.push(`/apps/whatsapp/contacts/${encodeURIComponent(mobileNo)}`)}
                    className="hover:underline text-left"
                    title="Open contact details"
                  >
                    {!contactNameLoaded ? (
                      <span className="inline-block h-4 w-32 rounded bg-gray-200 animate-pulse" />
                    ) : (
                      <h2 className="font-semibold text-gray-900">{contactName || mobileNo}</h2>
                    )}
                  </button>
                  {contactNameLoaded && contactName && (
                    <span className="text-xs text-gray-400 font-mono">{mobileNo}</span>
                  )}
                  {contactTags.map((t) => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.name}
                    </span>
                  ))}
                  <button
                    title="Manage tags"
                    onClick={() => setTagDialogOpen(true)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <TagIcon className="h-4 w-4 text-gray-400 hover:text-primary" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {contactNameLoaded && contactName && <span className="mr-2 font-mono">{mobileNo}</span>}
                  {messages.length} messages
                </p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No messages yet. Start the conversation!</div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-4">
                {Object.entries(messageGroups).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="flex items-center justify-center my-4">
                      <Badge variant="secondary" className="text-xs">{date}</Badge>
                    </div>

                    {msgs.map((message) => {
                      const isOutgoing = message.direction === "OUTBOUND";
                      const msgType = message.type?.toUpperCase() ?? "";

                      // Extract image URL: inbound MEDIARESPONSE/IMAGERESPONSE has it as content directly;
                      // outbound image messages are stored as "Image:\n<url>" by the backend.
                      const imageUrl = (() => {
                        if (!message.content) return null;
                        if (msgType === "MEDIARESPONSE" || msgType === "IMAGERESPONSE") return message.content;
                        if (msgType === "IMAGE" || message.content.match(/^Image:\s*https?:\/\//i)) {
                          const m = message.content.match(/https?:\/\/\S+/);
                          return m ? m[0] : null;
                        }
                        return null;
                      })();

                      const documentUrl = (() => {
                        if (!message.content || imageUrl) return null;
                        if (msgType === "DOCUMENT" || message.content.match(/^Document:\s*https?:\/\//i)) {
                          const m = message.content.match(/https?:\/\/\S+/);
                          return m ? m[0] : null;
                        }
                        return null;
                      })();

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOutgoing ? "justify-end" : "justify-start"} mb-2`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg overflow-hidden ${
                              isOutgoing ? "bg-[#D9FDD3] text-gray-900" : "bg-white text-gray-900 shadow-sm"
                            }`}
                          >
                            {message.template_name && (
                              <p className="text-xs text-gray-500 mb-1 px-4 pt-2">
                                Template: {message.template_name}
                              </p>
                            )}

                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt="Image"
                                className="max-w-full block rounded-lg"
                                style={{ maxHeight: 300 }}
                              />
                            ) : documentUrl ? (
                              <a
                                href={documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3 hover:opacity-80 transition-opacity"
                              >
                                <FileText className="h-8 w-8 shrink-0 text-red-500" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">Document</p>
                                  <p className="text-xs text-gray-500">Tap to open</p>
                                </div>
                              </a>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap px-4 py-2">
                                {message.content || `[${message.type}]`}
                              </p>
                            )}

                            <div className="flex items-center justify-end gap-1 px-4 pb-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatTime(message.created_at || message.updated_at)}
                              </span>
                              {isOutgoing && getStatusIcon(message.status)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto space-y-2">

              {/* Media preview */}
              {mediaAttachment && (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
                  {mediaAttachment.type === "image" ? (
                    <img src={mediaAttachment.url} alt="Preview" className="h-14 w-14 rounded object-cover shrink-0" />
                  ) : (
                    <FileText className="h-9 w-9 text-red-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {mediaAttachment.filename || (mediaAttachment.type === "image" ? "Image" : "Document")}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{mediaAttachment.url}</p>
                  </div>
                  <button onClick={() => setMediaAttachment(null)} className="p-1 rounded hover:bg-gray-200 shrink-0">
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                {/* Attachment button */}
                <div className="relative" ref={attachMenuRef}>
                  <button
                    onClick={() => setShowAttachMenu((v) => !v)}
                    disabled={mediaUploading || sending}
                    className="h-[44px] w-[44px] flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {mediaUploading
                      ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      : <Paperclip className="h-5 w-5 text-gray-500" />
                    }
                  </button>

                  {showAttachMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 p-2 flex flex-col gap-1 min-w-[130px] z-10">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                        <ImageIcon className="h-4 w-4 text-green-600" />
                        Image
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "image")}
                        />
                      </label>
                      <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Document
                        <input
                          ref={documentInputRef}
                          type="file"
                          accept="application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "document")}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={mediaAttachment ? "Add a caption (optional)..." : "Type a message..."}
                  disabled={sending}
                  className="flex-1 resize-none min-h-[44px] max-h-[120px]"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || (!messageText.trim() && !mediaAttachment)}
                  className="bg-[#001F3D] hover:bg-[#003366] h-[44px] px-6"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tag management dialog */}
      <AlertDialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Tag contact</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-mono">{mobileNo}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No tags yet. Create one from the Tags page first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 py-2">
              {tags.map((tag) => {
                const assigned = contactTags.some((t) => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      if (assigned) removeContactFromTag(mobileNo, tag.id);
                      else addContactToTag(mobileNo, tag.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
                    style={{
                      backgroundColor: assigned ? tag.color : undefined,
                      borderColor: tag.color,
                      color: assigned ? "#fff" : tag.color,
                    }}
                  >
                    {assigned && <span>✓</span>}
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <AlertDialogCancel>Done</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
