"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { readCache } from "@/lib/whatsapp/inbox-cache";

interface MessageContextType {
  hasNewMessage: boolean;
  setHasNewMessage: (value: boolean) => void;
  unreadCount: number;
  setUnreadCount: (value: number) => void;
  refreshUnreadCount: (organizationId: string) => void;
  decrementUnread: (amount: number) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <MessageContext.Provider
      value={{
        hasNewMessage,
        setHasNewMessage,
        unreadCount,
        setUnreadCount,
        refreshUnreadCount,
        decrementUnread,
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
