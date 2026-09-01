"use client";

import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { MessageList } from "@/components/whatsapp/messages/message-list";

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Message History</h1>
          <p className="text-muted-foreground">
            View and search your WhatsApp messages
          </p>
        </div>
        <MessageList />
      </div>
    </DashboardLayout>
  );
}
