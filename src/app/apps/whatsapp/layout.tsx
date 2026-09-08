"use client";

import { Inter } from "next/font/google";
import "../../globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ConfigProvider } from "@/lib/whatsapp/config-context";
import { TagsProvider } from "@/lib/whatsapp/tags-context";
import { WebSocketProvider } from "@/components/whatsapp/websocket-provider";
import { TokenExpiryGuard } from "@/components/whatsapp/token-expiry-guard";
import { Toaster } from "@/components/whatsapp/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
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
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
