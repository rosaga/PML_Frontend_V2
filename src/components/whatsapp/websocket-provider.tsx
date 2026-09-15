'use client';

import { useWebSocket } from '@/lib/whatsapp/use-websocket';
import { MessageProvider } from '@/lib/whatsapp/message-context';

function WebSocketInitializer({ children }: { children: React.ReactNode }) {
  // Initialize WebSocket connection
  useWebSocket();
  return <>{children}</>;
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  return (
    <MessageProvider>
      <WebSocketInitializer>{children}</WebSocketInitializer>
    </MessageProvider>
  );
}
