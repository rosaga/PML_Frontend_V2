"use client";

import React, { useState } from "react";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import { FlowsListComponent } from "./flows-list-enhanced";
import { FlowEditor } from "./flow-editor";
import { KeywordManager } from "./keyword-manager";


type View = "flows" | "editor" | "channels" | "createChannel" | "keywords";
type AutomationView = Exclude<View, "channels" | "createChannel">;
// Active views: "flows" | "editor" | "keywords" (channels removed from UI)

export function AutomationsLayout() {
  const [view, setView] = useState<AutomationView>("flows");
  const [selectedFlowId, setSelectedFlowId] = useState<number | null>(null);
  const [templateNodes, setTemplateNodes] = useState<any[]>([]);

  const handleTabChange = (value: string) => {
    const nextView = value as AutomationView;
    if (nextView === "flows" || nextView === "editor" || nextView === "keywords") {
      setView(nextView);
    }
  };

  const handleCreateFlow = () => {
    setSelectedFlowId(null);
    setTemplateNodes([]);
    setView("editor");
  };

  const handleEditFlow = (flowId: number, nodes: any[] = []) => {
    setSelectedFlowId(flowId);
    setTemplateNodes(nodes);
    setView("editor");
  };

  const handleBackToList = () => {
    setView("flows");
    setSelectedFlowId(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Automations"
        description="Create and manage WhatsApp flow automations and triggers"
      />

      <div className="p-6 flex-1">
        {view === "editor" ? (
          <FlowEditor flowId={selectedFlowId ?? undefined} onBack={handleBackToList} initialTemplateNodes={templateNodes} />
        ) : (
          <Tabs
            value={view}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="flows">Flows</TabsTrigger>
              <TabsTrigger value="keywords">Triggers</TabsTrigger>
            </TabsList>

            <TabsContent value="flows" className="space-y-4">
              <FlowsListComponent
                onEditFlow={handleEditFlow}
                onCreateFlow={handleCreateFlow}
              />
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4">
              <KeywordManager />
            </TabsContent>


          </Tabs>
        )}
      </div>
    </div>
  );
}
