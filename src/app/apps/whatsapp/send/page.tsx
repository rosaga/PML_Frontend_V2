"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { SendMessageForm } from "@/components/whatsapp/messages/send-message-form";
import { BulkMessageForm } from "@/components/whatsapp/messages/bulk-message-form";
import { CampaignForm } from "@/components/whatsapp/messages/campaign-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import { Send, MessageSquare, Users } from "lucide-react";

type SendMode = "single" | "bulk" | "campaigns";

function SendContent() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as SendMode;
  const [mode, setMode] = useState<SendMode>(tabFromUrl || "single");

  useEffect(() => {
    if (tabFromUrl) {
      setMode(tabFromUrl);
    }
  }, [tabFromUrl]);

  return (
    <div className="min-h-screen">
      <Header
        title="Send Messages"
        description="Send individual or bulk WhatsApp messages"
      />

      <div className="p-6">
        <Tabs value={mode} onValueChange={(v) => setMode(v as SendMode)}>
          <TabsList className="mb-6">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Single
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Send Bulk
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="max-w-3xl">
            <SendMessageForm />
          </TabsContent>

          <TabsContent value="bulk" className="max-w-4xl">
            <BulkMessageForm />
          </TabsContent>

          <TabsContent value="campaigns" className="max-w-3xl">
            <CampaignForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SendPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <SendContent />
      </Suspense>
    </DashboardLayout>
  );
}
