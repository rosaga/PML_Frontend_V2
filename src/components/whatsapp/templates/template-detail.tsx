"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/whatsapp/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/whatsapp/ui/select";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { useConfig } from "@/lib/whatsapp/config-context";
import { 
  getTemplateById, 
  updateTemplate,
  uploadMedia,
  type Template,
  type TemplateComponent,
  type TemplateButton
} from "@/lib/whatsapp/whatsapp-api";
import { WhatsAppPreview } from "./whatsapp-preview";
import { ArrowLeft, Loader2, Save, Eye, Edit, RefreshCw } from "lucide-react";
import { getTemplateByName } from "@/lib/whatsapp/whatsapp-api"; // Declare getTemplateByName variable

interface TemplateDetailProps {
  templateName: string;
  initialTemplate?: Template;
  onBack: () => void;
  onUpdated?: () => void;
}

export function TemplateDetail({ templateName, initialTemplate, onBack, onUpdated }: TemplateDetailProps) {
  const { config, isConfigured } = useConfig();
  const { toast } = useToast();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "edit">("preview");
  
  // The template ID is the numeric id from the API response, used for editing
  // This is different from template name which is used for fetching by name
  const templateId = template?.id || initialTemplate?.id || "";

  // Edit form state
  const [editForm, setEditForm] = useState<{
    name: string;
    category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
    language: string;
    headerType: "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";
    headerText: string;
    headerMediaUrl: string;
    bodyText: string;
    footerText: string;
    buttons: TemplateButton[];
  }>({
    name: "",
    category: "MARKETING",
    language: "en_US",
    headerType: "NONE",
    headerText: "",
    headerMediaUrl: "",
    bodyText: "",
    footerText: "",
    buttons: [],
  });

  // Preview params
  const [headerParams, setHeaderParams] = useState<string[]>([]);
  const [bodyParams, setBodyParams] = useState<string[]>([]);

  useEffect(() => {
    if (isConfigured && templateName) {
      // If we have initial template data, use it directly
      if (initialTemplate) {
        initializeTemplate(initialTemplate);
      } else {
        fetchTemplate();
      }
    }
  }, [isConfigured, templateName]);

  const initializeTemplate = (t: Template) => {
    setTemplate(t);
    setLoading(false);
    
    // Populate edit form
    const header = t.components?.find((c) => c.type === "HEADER");
    const body = t.components?.find((c) => c.type === "BODY");
    const footer = t.components?.find((c) => c.type === "FOOTER");
    const buttonsComp = t.components?.find((c) => c.type === "BUTTONS");

    // Extract media URL from header example
    let headerMediaUrl = "";
    if (header?.format && ["IMAGE", "VIDEO", "DOCUMENT"].includes(header.format)) {
      const example = header.example;
      if (example?.header_handle) {
        headerMediaUrl = Array.isArray(example.header_handle) 
          ? example.header_handle[0] 
          : example.header_handle;
      } else if ((example as any)?.header_url) {
        const hUrl = (example as any).header_url;
        headerMediaUrl = Array.isArray(hUrl) ? hUrl[0] : hUrl;
      }
    }

    setEditForm({
      name: t.name,
      category: t.category,
      language: t.language || "en_US",
      headerType: header?.format || "NONE",
      headerText: header?.text || "",
      headerMediaUrl,
      bodyText: body?.text || "",
      footerText: footer?.text || "",
      buttons: buttonsComp?.buttons || [],
    });

    // Initialize body params based on variables in body text
    const bodyVars = (body?.text?.match(/\{\{\d+\}\}/g) || []).length;
    setBodyParams(Array(bodyVars).fill(""));
  };

  const fetchTemplate = async () => {
    setLoading(true);
    const result = await getTemplateByName(config, templateName);
    setLoading(false);

    if (result.success && result.data) {
      initializeTemplate(result.data);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to fetch template.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    // Validate we have the template ID (numeric ID from API response)
    if (!templateId) {
      toast({
        title: "Error",
        description: "Template ID is missing. Please refresh the template.",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);

    const components: TemplateComponent[] = [];

    // Header
    if (editForm.headerType !== "NONE") {
      const headerComponent: TemplateComponent = {
        type: "HEADER",
        format: editForm.headerType as "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT",
        ...(editForm.headerType === "TEXT" && { text: editForm.headerText }),
      };
      
      // Add media example for IMAGE, VIDEO, DOCUMENT headers
      if (["IMAGE", "VIDEO", "DOCUMENT"].includes(editForm.headerType) && editForm.headerMediaUrl) {
        headerComponent.example = {
          header_handle: [editForm.headerMediaUrl],
        };
      }
      
      components.push(headerComponent);
    }

    // Body
    if (editForm.bodyText) {
      components.push({
        type: "BODY",
        text: editForm.bodyText,
      });
    }

    // Footer
    if (editForm.footerText) {
      components.push({
        type: "FOOTER",
        text: editForm.footerText,
      });
    }

    // Buttons
    if (editForm.buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: editForm.buttons,
      });
    }

    console.log("[v0] Updating template with ID:", templateId);
    const result = await updateTemplate(config, templateId, {
      name: editForm.name,
      category: editForm.category,
      language: editForm.language,
      components,
    });

    setSaving(false);

    if (result.success) {
      toast({
        title: "Success",
        description: "Template updated successfully.",
      });
      fetchTemplate();
      onUpdated?.();
      setActiveTab("preview");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update template.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "default";
      case "PENDING":
        return "secondary";
      case "REJECTED":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Build preview template - use original template for Preview tab, build from form for Edit tab
  const getPreviewTemplate = (): Template => {
    if (activeTab === "preview" && template) {
      return template;
    }
    
    // Build from edit form for Edit tab
    const components: TemplateComponent[] = [];
    if (editForm.headerType !== "NONE") {
      const headerComponent: TemplateComponent = {
        type: "HEADER",
        format: editForm.headerType as "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT",
        text: editForm.headerType === "TEXT" ? editForm.headerText : undefined,
      };
      // Include media URL in example for preview
      if (["IMAGE", "VIDEO", "DOCUMENT"].includes(editForm.headerType) && editForm.headerMediaUrl) {
        headerComponent.example = {
          header_handle: [editForm.headerMediaUrl],
        };
      }
      components.push(headerComponent);
    }
    if (editForm.bodyText) {
      components.push({ type: "BODY", text: editForm.bodyText });
    }
    if (editForm.footerText) {
      components.push({ type: "FOOTER", text: editForm.footerText });
    }
    if (editForm.buttons.length > 0) {
      components.push({ type: "BUTTONS", buttons: editForm.buttons });
    }
    
    return {
      name: editForm.name,
      category: editForm.category,
      language: editForm.language,
      components,
    };
  };

  const previewTemplate = getPreviewTemplate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Template not found.</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{template.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getStatusBadgeVariant(template.status)}>
                {template.status || "Unknown"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {template.category} • {template.language || "en_US"}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTemplate}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "preview" | "edit")}>
        <TabsList>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Phone Preview */}
            <div className="flex justify-center">
              <WhatsAppPreview 
                template={previewTemplate} 
                headerParams={headerParams}
                bodyParams={bodyParams}
              />
            </div>

            {/* Preview Parameters */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {headerParams.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Header Variables</Label>
                      {headerParams.map((param, idx) => (
                        <div key={`header-${idx}`} className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-16">{`{{${idx + 1}}}`}</span>
                          <Input
                            placeholder={`Header variable ${idx + 1}`}
                            value={param}
                            onChange={(e) => {
                              const newParams = [...headerParams];
                              newParams[idx] = e.target.value;
                              setHeaderParams(newParams);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {bodyParams.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Body Variables</Label>
                      {bodyParams.map((param, idx) => (
                        <div key={`body-${idx}`} className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-16">{`{{${idx + 1}}}`}</span>
                          <Input
                            placeholder={`Body variable ${idx + 1}`}
                            value={param}
                            onChange={(e) => {
                              const newParams = [...bodyParams];
                              newParams[idx] = e.target.value;
                              setBodyParams(newParams);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {headerParams.length === 0 && bodyParams.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      This template has no variables to customize.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Template Components */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {template.components?.map((comp, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{comp.type}</Badge>
                        {comp.format && <Badge variant="secondary">{comp.format}</Badge>}
                      </div>
                      {comp.text && (
                        <p className="text-sm text-muted-foreground">{comp.text}</p>
                      )}
                      {comp.buttons && (
                        <div className="mt-2 space-y-1">
                          {comp.buttons.map((btn, btnIdx) => (
                            <div key={btnIdx} className="text-sm">
                              <span className="font-medium">{btn.type}:</span> {btn.text}
                              {btn.url && <span className="text-muted-foreground"> ({btn.url})</span>}
                              {btn.phone_number && <span className="text-muted-foreground"> ({btn.phone_number})</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="edit" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Edit Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Edit Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Template name cannot be changed</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editForm.category}
                      onValueChange={(v) => setEditForm({ ...editForm, category: v as typeof editForm.category })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="UTILITY">Utility</SelectItem>
                        <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={editForm.language}
                      onValueChange={(v) => setEditForm({ ...editForm, language: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_US">English (US)</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headerType">Header Type</Label>
                  <Select
                    value={editForm.headerType}
                    onValueChange={(v) => setEditForm({ ...editForm, headerType: v as typeof editForm.headerType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="TEXT">Text</SelectItem>
                      <SelectItem value="IMAGE">Image</SelectItem>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editForm.headerType === "TEXT" && (
                  <div className="space-y-2">
                    <Label htmlFor="headerText">Header Text</Label>
                    <Input
                      id="headerText"
                      placeholder="Header text (use {{1}} for variables)"
                      value={editForm.headerText}
                      onChange={(e) => setEditForm({ ...editForm, headerText: e.target.value })}
                    />
                  </div>
                )}

                {["IMAGE", "VIDEO", "DOCUMENT"].includes(editForm.headerType) && (
                  <div className="space-y-3">
                    {editForm.headerMediaUrl && (
                      <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">Current Media</p>
                            <p className="text-xs text-green-700 dark:text-green-300 truncate">{editForm.headerMediaUrl}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditForm({ ...editForm, headerMediaUrl: "" })}
                            disabled={uploadingMedia}
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {!editForm.headerMediaUrl && (
                      <div className="rounded-lg border border-dashed bg-muted/50 p-4 space-y-2">
                        <p className="text-sm font-medium">Upload Media to WhatsApp</p>
                        <p className="text-xs text-muted-foreground">
                          Select your {editForm.headerType.toLowerCase()} file to upload.
                        </p>
                        <Input
                          type="file"
                          accept={
                            editForm.headerType === "IMAGE" ? "image/*" :
                            editForm.headerType === "VIDEO" ? "video/*" :
                            ".pdf,.doc,.docx"
                          }
                          disabled={uploadingMedia}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            setUploadingMedia(true);
                            toast({
                              title: "Uploading...",
                              description: "Uploading your media to WhatsApp Business API",
                            });
                            
                            const result = await uploadMedia(config, file);
                            setUploadingMedia(false);
                            
                            if (result.success && result.data?.id) {
                              setEditForm({ ...editForm, headerMediaUrl: result.data.id });
                              toast({
                                title: "Upload Successful",
                                description: "Media uploaded successfully.",
                              });
                            } else {
                              toast({
                                title: "Upload Failed",
                                description: result.error || "Failed to upload media.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="bodyText">Body Text</Label>
                  <Textarea
                    id="bodyText"
                    placeholder="Message body (use {{1}}, {{2}} for variables)"
                    value={editForm.bodyText}
                    onChange={(e) => setEditForm({ ...editForm, bodyText: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Input
                    id="footerText"
                    placeholder="Optional footer text"
                    value={editForm.footerText}
                    onChange={(e) => setEditForm({ ...editForm, footerText: e.target.value })}
                  />
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <div className="flex justify-center">
              <WhatsAppPreview template={previewTemplate} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
