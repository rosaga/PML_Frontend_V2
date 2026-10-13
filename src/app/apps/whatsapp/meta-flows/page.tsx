"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { MetaFlowForm } from "@/components/whatsapp/meta-flows/meta-flow-form";
import { MetaFlowList } from "@/components/whatsapp/meta-flows/meta-flow-list";
import { Button } from "@/components/whatsapp/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import { List, Plus } from "lucide-react";

type ViewMode = "list" | "create";

function MetaFlowsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMetaFlowCreated = () => {
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
        <Tabs value={viewMode} onValueChange={(v: string) => setViewMode(v as ViewMode)}>
          <div className="mb-6 flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                All Items
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New
              </TabsTrigger>
            </TabsList>

            {viewMode === "list" && (
              <Button onClick={() => setViewMode("create")}>
                <Plus className="mr-2 h-4 w-4" />
                New Item
              </Button>
            )}
          </div>

          <TabsContent value="list">
            <MetaFlowList refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="create">
            <MetaFlowForm onSuccess={handleMetaFlowCreated} />
          </TabsContent>
        </Tabs>
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
