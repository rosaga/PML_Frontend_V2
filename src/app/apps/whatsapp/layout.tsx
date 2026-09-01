"use client";

import { ConfigProvider } from "@/lib/whatsapp/config-context";
import { TagsProvider } from "@/lib/whatsapp/tags-context";
import { WebSocketProvider } from "@/components/whatsapp/websocket-provider";
import { TokenExpiryGuard } from "@/components/whatsapp/token-expiry-guard";
import { Toaster } from "@/components/whatsapp/ui/toaster";

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      <TokenExpiryGuard>
        <TagsProvider>
          <WebSocketProvider>
            {children}
            <Toaster />
          </WebSocketProvider>
        </TagsProvider>
      </TokenExpiryGuard>
    </ConfigProvider>
  );
}
