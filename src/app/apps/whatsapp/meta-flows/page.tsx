"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { MetaFlowForm } from "@/components/whatsapp/meta-flows/meta-flow-form";
import { MetaFlowList } from "@/components/whatsapp/meta-flows/meta-flow-list";
import { Button } from "@/components/whatsapp/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import { ArrowLeft, Plus } from "lucide-react";
import type { MetaFlow } from "@/lib/whatsapp/meta-flows-api";

type ViewMode = "list" | "create";

function MetaFlowsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [assetType, setAssetType] = useState<MetaFlow["type"]>("META_FLOW");

  const handleMetaFlowCreated = (type: MetaFlow["type"]) => {
    setAssetType(type);
    setViewMode("list");
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Meta Flows & Catalogues"
        description="Create and manage your WhatsApp Meta Flows and catalogues"
      />

      <div className="p-6">
        {viewMode === "list" ? (
          <Tabs value={assetType} onValueChange={(value) => setAssetType(value as MetaFlow["type"])}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="META_FLOW">Meta Flows</TabsTrigger>
                <TabsTrigger value="CATALOGUE">Catalogues</TabsTrigger>
              </TabsList>
              <Button onClick={() => setViewMode("create")}>
                <Plus className="mr-2 h-4 w-4" />
                New Item
              </Button>
            </div>
            <TabsContent value="META_FLOW">
              <MetaFlowList type="META_FLOW" refreshTrigger={refreshTrigger} />
            </TabsContent>
            <TabsContent value="CATALOGUE">
              <MetaFlowList type="CATALOGUE" refreshTrigger={refreshTrigger} />
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <Button variant="ghost" className="mb-4" onClick={() => setViewMode("list")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {assetType === "CATALOGUE" ? "Catalogues" : "Meta Flows"}
            </Button>
            <MetaFlowForm initialType={assetType} onSuccess={handleMetaFlowCreated} />
          </>
        )}
      </div>
    </div>
  );
}

export default function MetaFlowsPage() {
  return (
    <DashboardLayout>
      <MetaFlowsContent />
    </DashboardLayout>
  );
}
