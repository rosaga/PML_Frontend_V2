'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface MessageContextType {
  hasNewMessage: boolean;
  setHasNewMessage: (value: boolean) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [hasNewMessage, setHasNewMessage] = useState(false);

  return (
    <MessageContext.Provider value={{ hasNewMessage, setHasNewMessage }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessageNotification() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessageNotification must be used within MessageProvider');
  }
  return context;
}
