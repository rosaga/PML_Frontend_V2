"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  type Recipient,
  readCache,
  writeCache,
  applyMessages,
  sortedConversations,
  fetchInboxMessages,
} from "@/lib/whatsapp/inbox-cache";

interface MessageContextType {
  hasNewMessage: boolean;
  setHasNewMessage: (value: boolean) => void;
  unreadCount: number;
  setUnreadCount: (value: number) => void;
  refreshUnreadCount: (organizationId: string) => void;
  decrementUnread: (amount: number) => void;
  pollUnread: (organizationId: string) => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollingRef = useRef(false); // avoid overlapping polls

  // Recompute total unread across all conversations from the cached
  // conversation list — the same source the inbox sidebar badge uses.
  const refreshUnreadCount = useCallback((organizationId: string) => {
    if (!organizationId) return;
    const cache = readCache(organizationId);
    if (!cache) return;
    const total = cache.conversations.reduce(
      (sum, r) => sum + (r.unread_message_ids?.length || 0),
      0
    );
    setUnreadCount(total);
  }, []);

  const decrementUnread = useCallback((amount: number) => {
    setUnreadCount((prev) => Math.max(0, prev - amount));
  }, []);

  // Fetches new messages (or builds the cache from scratch if none exists
  // yet), merges them into the conversation cache, and recomputes the
  // unread count — self-contained so it can run from anywhere (e.g. the
  // sidebar, on every page) without needing an inbox page mounted first.
  const pollUnread = useCallback(async (organizationId: string) => {
    if (!organizationId || pollingRef.current) return;
    pollingRef.current = true;
    try {
      const cache = readCache(organizationId);

      if (!cache || cache.conversations.length === 0) {
        // No cache yet — build it from scratch, same as a cold load.
        const msgs = await fetchInboxMessages(organizationId);
        const map = new Map<string, Recipient>();
        const newestAt = applyMessages(map, msgs, "");
        const sorted = sortedConversations(map);
        writeCache(organizationId, { conversations: sorted, newestMessageAt: newestAt, cachedAt: Date.now() });
      } else {
        // Cache exists — fetch only what's new since the last-seen message.
        const msgs = await fetchInboxMessages(organizationId, { gt__created_at: cache.newestMessageAt });
        if (msgs.length > 0) {
          // Re-read fresh in case something else (e.g. marking a
          // conversation read) patched the cache while this was in flight.
          const latestCache = readCache(organizationId);
          const baseline = latestCache ? latestCache.conversations : cache.conversations;
          const map = new Map<string, Recipient>();
          for (const r of baseline) map.set(r.mobile_no, { ...r });
          const newestAt = applyMessages(map, msgs, cache.newestMessageAt);
          const sorted = sortedConversations(map);
          writeCache(organizationId, { conversations: sorted, newestMessageAt: newestAt, cachedAt: Date.now() });
        }
      }

      refreshUnreadCount(organizationId);
    } catch { /* ignore */ } finally {
      pollingRef.current = false;
    }
  }, [refreshUnreadCount]);

  return (
    <MessageContext.Provider
      value={{
        hasNewMessage,
        setHasNewMessage,
        unreadCount,
        setUnreadCount,
        refreshUnreadCount,
        decrementUnread,
        pollUnread,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export function useMessageNotification() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessageNotification must be used within MessageProvider");
  }
  return context;
}