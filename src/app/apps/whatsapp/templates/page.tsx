"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { TemplateForm } from "@/components/whatsapp/templates/template-form";
import { TemplateList } from "@/components/whatsapp/templates/template-list";
import { TemplateDetail } from "@/components/whatsapp/templates/template-detail";
import { Button } from "@/components/whatsapp/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import { Plus, List } from "lucide-react";
import type { Template } from "@/lib/whatsapp/whatsapp-api";

type ViewMode = "list" | "create" | "detail";

function TemplatesContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTemplateCreated = () => {
    setViewMode("list");
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setSelectedTemplate(null);
    setViewMode("list");
  };

  const handleTemplateUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // If viewing template detail, show that view
  if (viewMode === "detail" && selectedTemplate) {
    return (
      <div className="min-h-screen">
        <Header
          title="Template Details"
          description="View and edit your message template"
        />
        <div className="p-6">
          <TemplateDetail
            templateName={selectedTemplate.name}
            initialTemplate={selectedTemplate}
            onBack={handleBackToList}
            onUpdated={handleTemplateUpdated}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Message Templates"
        description="Create and manage your WhatsApp message templates"
      />

      <div className="p-6">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                All Templates
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New
              </TabsTrigger>
            </TabsList>
            
            {viewMode === "list" && (
              <Button onClick={() => setViewMode("create")}>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            )}
          </div>

          <TabsContent value="list">
            <TemplateList 
              refreshTrigger={refreshTrigger} 
              onSelect={handleTemplateSelect}
            />
          </TabsContent>

          <TabsContent value="create">
            <TemplateForm onSuccess={handleTemplateCreated} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <DashboardLayout>
      <TemplatesContent />
    </DashboardLayout>
  );
}
