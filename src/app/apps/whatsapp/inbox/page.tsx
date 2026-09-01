"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useConfig } from "@/lib/whatsapp/config-context";
import { useMessageNotification } from "@/lib/whatsapp/message-context";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Card, CardContent } from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Button } from "@/components/whatsapp/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/whatsapp/ui/table";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/whatsapp/ui/alert-dialog";
import { Search, MessageSquare, ChevronLeft, ChevronRight, Tag as TagIcon, User, RefreshCw } from "lucide-react";
import { useTags } from "@/lib/whatsapp/tags-context";
import { loadNames, persistNames } from "@/lib/whatsapp/name-cache";
import {
  type Recipient,
  readCache,
  writeCache,
  applyMessages,
  sortedConversations,
  hydrateNamesFromCache,
  fetchInboxMessages,
} from "@/lib/whatsapp/inbox-cache";

type ReadFilter = "all" | "unread" | "read";

// ── Component ─────────────────────────────────────────────────────────────────

function InboxContent() {
  const router = useRouter();
  const { organizationId, pmlOrganizationId, isLoading: contextLoading, signalPmlUnauthorized } = useConfig();
  const { hasNewMessage, setHasNewMessage } = useMessageNotification();
  const { tags, getTagsForContact, addContactToTag, removeContactFromTag } = useTags();

  const [conversations, setConversations] = useState<Recipient[]>([]);
  const [loading, setLoading]       = useState(true);    // cold-start only
  const [refreshing, setRefreshing] = useState(false);   // background incremental update

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [tagFilter, setTagFilter]   = useState<string | null>(null);
  const [tagDialogMobile, setTagDialogMobile] = useState<string | null>(null);

  const nameFetchedRef = useRef<Set<string>>(new Set());
  const newestAtRef    = useRef<string>("");

  // ── Derived counts — exact, from the full conversation list ──────────────
  const unreadCount = useMemo(
    () => conversations.filter((r) => r.has_unread).length,
    [conversations],
  );
  const readCount = conversations.length - unreadCount;

  // ── Cold load: fetch everything, build cache ──────────────────────────────
  const coldLoad = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const msgs = await fetchInboxMessages(organizationId);
      const map = new Map<string, Recipient>();
      const newestAt = applyMessages(map, msgs, "");
      newestAtRef.current = newestAt;
      nameFetchedRef.current = new Set();

      const sorted = sortedConversations(map);
      writeCache(organizationId, { conversations: sorted, newestMessageAt: newestAt, cachedAt: Date.now() });
      setConversations(hydrateNamesFromCache(sorted, organizationId));
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // ── Incremental update: fetch only messages newer than last seen ──────────
  const incrementalUpdate = useCallback(async () => {
    if (!organizationId || !newestAtRef.current) return;
    setRefreshing(true);
    try {
      const msgs = await fetchInboxMessages(organizationId, { gt__created_at: newestAtRef.current });
      if (msgs.length === 0) return;

      setConversations((prev) => {
        const map = new Map<string, Recipient>();
        for (const r of prev) map.set(r.mobile_no, { ...r });
        const newestAt = applyMessages(map, msgs, newestAtRef.current);
        newestAtRef.current = newestAt;

        const sorted = sortedConversations(map);
        writeCache(organizationId, { conversations: sorted, newestMessageAt: newestAt, cachedAt: Date.now() });
        return hydrateNamesFromCache(sorted, organizationId);
      });
    } catch { /* ignore */ } finally {
      setRefreshing(false);
    }
  }, [organizationId]);

  // ── Bootstrap: cache hit → show immediately + background refresh ──────────
  useEffect(() => {
    if (contextLoading || !organizationId) return;

    const cache = readCache(organizationId);
    if (cache && cache.conversations.length > 0) {
      newestAtRef.current = cache.newestMessageAt;
      nameFetchedRef.current = new Set();
      setConversations(hydrateNamesFromCache(cache.conversations, organizationId));
      setLoading(false);
      incrementalUpdate();
    } else {
      coldLoad();
    }
  }, [contextLoading, organizationId, coldLoad, incrementalUpdate]);

  // ── New message notification → incremental update ─────────────────────────
  useEffect(() => {
    if (hasNewMessage) {
      incrementalUpdate();
      setHasNewMessage(false);
    }
  }, [hasNewMessage, setHasNewMessage, incrementalUpdate]);

  // ── Mark as read ──────────────────────────────────────────────────────────
  const markAsRead = useCallback((mobileNo: string) => {
    const conv = conversations.find((r) => r.mobile_no === mobileNo);
    if (!conv?.has_unread || conv.unread_message_ids.length === 0) return;
    const ids = conv.unread_message_ids;

    // Write cache synchronously NOW — before router.push can navigate away
    // (setConversations is async/batched and may not run before unmount)
    const cache = readCache(organizationId);
    if (cache) {
      writeCache(organizationId, {
        ...cache,
        conversations: cache.conversations.map((r) =>
          r.mobile_no === mobileNo ? { ...r, has_unread: false, unread_message_ids: [] } : r,
        ),
      });
    }

    // Optimistic UI update
    setConversations((prev) =>
      prev.map((r) =>
        r.mobile_no === mobileNo ? { ...r, has_unread: false, unread_message_ids: [] } : r,
      ),
    );

    // Fire-and-forget the server call
    fetch("/api/whatsapp/whatsapp-internal/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_ids: ids }),
    }).catch(() => { /* ignore */ });
  }, [conversations, organizationId]);

  const handleRecipientClick = (mobileNo: string) => {
    markAsRead(mobileNo);
    router.push(`/inbox/${encodeURIComponent(mobileNo)}`);
  };

  // ── Client-side filtering + exact pagination ──────────────────────────────
  const isUnread = (r: Recipient) => r.has_unread;

  const filtered = useMemo(() => {
    let result = conversations;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.mobile_no.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q),
      );
    }
    if (tagFilter) {
      result = result.filter((r) =>
        getTagsForContact(r.mobile_no).some((t) => t.id === tagFilter),
      );
    }
    if (readFilter === "unread") result = result.filter(isUnread);
    else if (readFilter === "read") result = result.filter((r) => !isUnread(r));
    return result;
  }, [conversations, searchQuery, tagFilter, readFilter, getTagsForContact]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [readFilter, tagFilter, searchQuery, pageSize]);

  // ── Lazy name loading for visible rows only ───────────────────────────────
  const pagedKeys = paged.map((r) => r.mobile_no).join(",");
  useEffect(() => {
    if (loading || !pmlOrganizationId) return;
    const authToken = localStorage.getItem("token") ?? "";
    if (!authToken) return;

    // Load name cache once — contacts already in the cache (even with empty name)
    // are skipped to prevent repeated 9-24s API calls on every navigation.
    const nameCache = loadNames(organizationId);

    const toFetch = pagedKeys
      .split(",")
      .filter((no) => {
        if (!no || nameFetchedRef.current.has(no)) return false;
        const existing = conversations.find((r) => r.mobile_no === no);
        if (existing?.name) { nameFetchedRef.current.add(no); return false; }
        // Already in name cache (even if empty) — we already checked this contact
        if (no in nameCache) { nameFetchedRef.current.add(no); return false; }
        return true;
      });
    if (toFetch.length === 0) return;

    toFetch.forEach((no) => nameFetchedRef.current.add(no));
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
            // Fallback to metadata — shown as "Maybe: Name" like iPhone caller ID
            firstName = c?.metadata?.FIRSTNAME || "";
            lastName  = c?.metadata?.LASTNAME  || "";
            maybe = !!(firstName || lastName);
          }
        }

        const raw = [firstName, lastName].filter(Boolean).join(" ");
        const name = raw ? (maybe ? `Maybe: ${raw}` : raw) : "";
        if (name) {
          setConversations((prev) =>
            prev.map((rec) => rec.mobile_no === no ? { ...rec, name } : rec),
          );
        }
        // Always persist — marks this contact as "already checked" so future navigations skip the API
        const stored = loadNames(organizationId);
        persistNames(organizationId, { ...stored, [no]: { firstName, lastName, maybe } });
      } catch { /* ignore */ }
    });
  }, [pagedKeys, loading, pmlOrganizationId, organizationId, conversations, signalPmlUnauthorized]);

  // ── Date formatting ───────────────────────────────────────────────────────
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diffMs / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(diffMs / 86400000);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Header title="Inbox" description="View and chat with all your WhatsApp conversations" />

      <div className="p-6">
        <div className="mb-5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or mobile number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {(["all", "unread", "read"] as ReadFilter[]).map((f) => {
                const count =
                  f === "all" ? conversations.length :
                  f === "unread" ? unreadCount : readCount;
                const label = f === "all" ? "All" : f === "unread" ? "Unread" : "Read";
                return (
                  <button
                    key={f}
                    onClick={() => setReadFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      readFilter === f
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}{count > 0 ? ` (${count})` : ""}
                  </button>
                );
              })}
              {refreshing && (
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin ml-1" />
              )}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setTagFilter(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  !tagFilter
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                All tags
              </button>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setTagFilter(tagFilter === tag.id ? null : tag.id)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
                  style={{
                    backgroundColor: tagFilter === tag.id ? tag.color : undefined,
                    borderColor: tagFilter === tag.id ? tag.color : undefined,
                    color: tagFilter === tag.id ? "#fff" : undefined,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading conversations...</div>
        ) : paged.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No conversations found
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead className="text-center">Messages</TableHead>
                    <TableHead>Last Message</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((recipient) => {
                    const unread = isUnread(recipient);
                    const contactTags = getTagsForContact(recipient.mobile_no);
                    return (
                      <TableRow
                        key={recipient.mobile_no}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRecipientClick(recipient.mobile_no)}
                      >
                        <TableCell>
                          <div className="relative inline-block">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-gray-200">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            {unread && (
                              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {recipient.name ? (
                            <span className={`font-medium text-gray-900 ${unread ? "font-semibold" : ""}`}>
                              {recipient.name}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">No name</span>
                          )}
                          {contactTags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {contactTags.map((t) => (
                                <span
                                  key={t.id}
                                  className="px-1.5 py-0 rounded-full text-[10px] font-medium text-white leading-4"
                                  style={{ backgroundColor: t.color }}
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className={`font-mono text-sm text-gray-600 ${unread ? "font-semibold" : ""}`}>
                            {recipient.mobile_no}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant={unread ? "default" : "secondary"}>
                            {recipient.message_count}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-gray-600 text-sm max-w-xs truncate">
                          <span className={unread ? "font-medium text-gray-900" : ""}>
                            {recipient.last_message || "No messages"}
                          </span>
                        </TableCell>

                        <TableCell className="text-gray-600 text-sm whitespace-nowrap">
                          {formatDate(recipient.last_message_date)}
                        </TableCell>

                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              title="Tag contact"
                              onClick={(e) => { e.stopPropagation(); setTagDialogMobile(recipient.mobile_no); }}
                              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            >
                              <TagIcon className="h-4 w-4 text-gray-400 hover:text-primary" />
                            </button>
                            <button
                              title="Open conversation"
                              onClick={(e) => { e.stopPropagation(); handleRecipientClick(recipient.mobile_no); }}
                              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            >
                              <MessageSquare className="h-4 w-4 text-gray-400 hover:text-primary" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {filtered.length} conversation{filtered.length !== 1 ? "s" : ""}
                  {filtered.length !== conversations.length
                    ? ` (filtered from ${conversations.length})`
                    : ""}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border border-border rounded px-1.5 py-0.5 text-sm bg-background"
                  >
                    {[10, 25, 50, 100].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={!!tagDialogMobile} onOpenChange={(v) => { if (!v) setTagDialogMobile(null); }}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Tag contact</AlertDialogTitle>
            <AlertDialogDescription>
              {tagDialogMobile && <span className="font-mono">{tagDialogMobile}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No tags yet. Create one from the Tags page first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 py-2">
              {tags.map((tag) => {
                const assigned = tagDialogMobile
                  ? getTagsForContact(tagDialogMobile).some((t) => t.id === tag.id)
                  : false;
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      if (!tagDialogMobile) return;
                      if (assigned) removeContactFromTag(tagDialogMobile, tag.id);
                      else addContactToTag(tagDialogMobile, tag.id);
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
            <AlertDialogCancel onClick={() => setTagDialogMobile(null)}>Done</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function InboxPage() {
  return (
    <DashboardLayout>
      <InboxContent />
    </DashboardLayout>
  );
}
