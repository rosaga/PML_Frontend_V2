"use client";

import React from "react"

import { useState, useEffect } from "react";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/whatsapp/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/whatsapp/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/whatsapp/ui/tooltip";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { useConfig } from "@/lib/whatsapp/config-context";
import { createTemplate, updateTemplate, uploadMedia, type Template, type TemplateComponent, type TemplateButton } from "@/lib/whatsapp/whatsapp-api";
import { Plus, Trash2, Loader2, Info } from "lucide-react";
import { WhatsAppPreview } from "@/components/whatsapp/templates/whatsapp-preview";

interface TemplateFormProps {
  onSuccess?: () => void;
  initialData?: Template;
  mode?: "create" | "edit";
}

export function TemplateForm({ onSuccess, initialData, mode = "create" }: TemplateFormProps) {
  const { config, isConfigured } = useConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Extract header info from initial data
  const getInitialHeaderInfo = () => {
    const headerComponent = initialData?.components?.find(c => c.type === "HEADER");
    if (!headerComponent) return { type: "none" as const, text: "", mediaUrl: "" };
    
    const format = headerComponent.format || "TEXT";
    let mediaUrl = "";
    
    // Extract media URL from example if it exists
    if (["IMAGE", "VIDEO", "DOCUMENT"].includes(format)) {
      const example = headerComponent.example;
      
      // Check multiple possible locations for media handle/URL
      if (example?.header_handle) {
        mediaUrl = Array.isArray(example.header_handle) 
          ? example.header_handle[0] 
          : example.header_handle;
      } else if ((example as any)?.header_url) {
        const hUrl = (example as any).header_url;
        mediaUrl = Array.isArray(hUrl) ? hUrl[0] : hUrl;
      }
    }
    
    return {
      type: format as "none" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT",
      text: headerComponent.text || "",
      mediaUrl,
    };
  };

  // Extract buttons from initial data
  const getInitialButtons = () => {
    const buttonsComponent = initialData?.components?.find(c => c.type === "BUTTONS");
    if (!buttonsComponent?.buttons) return [];
    
    return buttonsComponent.buttons.map((btn: any) => ({
      type: btn.type || "QUICK_REPLY",
      text: btn.text || "",
      url: btn.url || "",
      phone: btn.phone_number || "",
    }));
  };

  const initialHeader = getInitialHeaderInfo();
  const initialButtons = getInitialButtons();

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "MARKETING" as const,
    language: "en_US",
    headerType: initialHeader.type,
    headerText: initialHeader.text,
    headerMediaUrl: initialHeader.mediaUrl,
    bodyText: initialData?.components?.find(c => c.type === "BODY")?.text || "",
    footerText: initialData?.components?.find(c => c.type === "FOOTER")?.text || "",
    buttons: initialButtons as Array<{ type: string; text: string; url?: string; phone?: string }>,
  });

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  
  const DRAFT_KEY = "template_form_draft";

  // Load draft on mount (only for create mode, not edit mode)
  useEffect(() => {
    if (mode === "create" && !initialData) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setFormData(draft);
          setHasDraft(true);
          toast({
            title: "Draft Loaded",
            description: "Your previous template draft has been restored.",
          });
        } catch (error) {
          console.error("Error loading draft:", error);
        }
      }
    }
  }, []);

  // Update form when initialData changes (e.g., when switching to edit mode)
  useEffect(() => {
    if (initialData) {
      const header = getInitialHeaderInfo();
      const buttons = getInitialButtons();
      setFormData({
        name: initialData.name || "",
        category: initialData.category || "MARKETING",
        language: "en_US",
        headerType: header.type,
        headerText: header.text,
        headerMediaUrl: header.mediaUrl,
        bodyText: initialData.components?.find(c => c.type === "BODY")?.text || "",
        footerText: initialData.components?.find(c => c.type === "FOOTER")?.text || "",
        buttons: buttons,
      });
    }
  }, [initialData]);

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    setDraftSaved(true);
    toast({
      title: "Draft Saved",
      description: "Your template draft has been saved successfully.",
    });
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    toast({
      title: "Draft Cleared",
      description: "Your template draft has been deleted.",
    });
  };

  const addButton = () => {
    if (formData.buttons.length < 10) {
      setFormData({
        ...formData,
        buttons: [...formData.buttons, { type: "QUICK_REPLY", text: "" }],
      });
    }
  };

  const removeButton = (index: number) => {
    setFormData({
      ...formData,
      buttons: formData.buttons.filter((_, i) => i !== index),
    });
  };

  const updateButton = (index: number, field: string, value: string) => {
    const newButtons = [...formData.buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setFormData({ ...formData, buttons: newButtons });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfigured) {
      toast({
        title: "Configuration Required",
        description: "Please configure your API settings first.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.bodyText) {
      toast({
        title: "Validation Error",
        description: "Template name and body text are required.",
        variant: "destructive",
      });
      return;
    }

    // Validate media header has URL/handle
    if (["IMAGE", "VIDEO", "DOCUMENT"].includes(formData.headerType) && !formData.headerMediaUrl) {
      toast({
        title: "Media Handle Required",
        description: "Please provide the media handle/URL for your header.",
        variant: "destructive",
      });
      return;
    }

    // Validate that variables are not at the start or end of template
    const startsWithVariable = /^\s*\{\{\d+\}\}/.test(formData.bodyText);
    const endsWithVariable = /\{\{\d+\}\}\s*$/.test(formData.bodyText);
    
    if (startsWithVariable || endsWithVariable) {
      toast({
        title: "Invalid Variable Position",
        description: "Variables cannot be at the start or end of the template. Add text before and after variables.",
        variant: "destructive",
      });
      return;
    }

    // Check header text if it's text type
    if (formData.headerType === "TEXT" && formData.headerText) {
      const headerStartsWithVariable = /^\s*\{\{\d+\}\}/.test(formData.headerText);
      const headerEndsWithVariable = /\{\{\d+\}\}\s*$/.test(formData.headerText);
      
      if (headerStartsWithVariable || headerEndsWithVariable) {
        toast({
          title: "Invalid Variable Position in Header",
          description: "Variables cannot be at the start or end of the header. Add text before and after variables.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate variable-to-text ratio for WhatsApp requirements
    const bodyPlaceholders = (formData.bodyText.match(/\{\{(\d+)\}\}/g) || []).length;
    const bodyWords = formData.bodyText.split(/\s+/).filter(word => word.length > 0).length;
    
    // WhatsApp requires a reasonable ratio of variables to text length
    // Rough guideline: at least 2-3 words per variable
    if (bodyPlaceholders > 0 && bodyWords / bodyPlaceholders < 2) {
      toast({
        title: "Too Many Variables",
        description: `Your template has ${bodyPlaceholders} variable(s) but only ${bodyWords} word(s). Add more text or reduce the number of variables. Guideline: at least 2-3 words per variable.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const components: TemplateComponent[] = [];

    // Add header if present
    if (formData.headerType !== "none") {
      const headerComponent = {
        type: "header",
        format: formData.headerType.toLowerCase(),
        ...(formData.headerType === "TEXT" && { text: formData.headerText }),
      } as unknown as TemplateComponent;
      
      // Add example for header placeholders if it's text with variables
      if (formData.headerType === "TEXT" && formData.headerText) {
        const headerPlaceholders = formData.headerText.match(/\{\{(\d+)\}\}/g);
        if (headerPlaceholders && headerPlaceholders.length > 0) {
          headerComponent.example = {
            header_handle: ["example_header_value"],
          };
        }
      }
      
      // Add media example for IMAGE, VIDEO, DOCUMENT headers
      if (["IMAGE", "VIDEO", "DOCUMENT"].includes(formData.headerType) && formData.headerMediaUrl) {
        headerComponent.example = {
          header_handle: [formData.headerMediaUrl],
        };
      }
      
      components.push(headerComponent);
    }

    // Add body with examples for placeholders
    // Note: Some APIs require 'text' field, others don't - this uses lowercase 'body' type
    const bodyComponent: Record<string, unknown> = {
      type: "body",
      text: formData.bodyText,
    };
    
    // Extract placeholders like {{1}}, {{2}}, etc.
    const placeholderMatches = formData.bodyText.match(/\{\{(\d+)\}\}/g);
    if (placeholderMatches && placeholderMatches.length > 0) {
      // Create example values for each placeholder
      const exampleValues = placeholderMatches.map((_, index) => `example${index + 1}`);
      bodyComponent.example = {
        body_text: [exampleValues],
      };
    }
    
    components.push(bodyComponent as unknown as TemplateComponent);

    // Add footer if present
    if (formData.footerText) {
      components.push({
        type: "footer",
        text: formData.footerText,
      } as unknown as TemplateComponent);
    }

    // Add buttons if present
    if (formData.buttons.length > 0) {
      const buttons = formData.buttons.map((btn) => ({
        type: btn.type.toLowerCase(),
        text: btn.text,
        ...(btn.type === "URL" && { url: btn.url }),
        ...(btn.type === "PHONE_NUMBER" && { phone_number: btn.phone }),
      }));
      components.push({
        type: "buttons",
        buttons,
      } as unknown as TemplateComponent);
    }

    const template: Omit<Template, "id" | "status"> = {
      name: formData.name.toLowerCase().replace(/\s+/g, "_"),
      category: formData.category,
      language: formData.language,
      components,
    };

    const result = mode === "edit" && initialData?.id
      ? await updateTemplate(config, initialData.id, template)
      : await createTemplate(config, template);

    setLoading(false);

    if (result.success) {
        toast({
          title: "Success",
          description: mode === "edit" ? "Template updated successfully!" : "Template created successfully!",
        });
        // Reset form or redirect
        window.location.reload();
      } else {
        // Extract more user-friendly error message from the API response
        let errorTitle = "Error";
        let errorMessage = "Failed to create template.";
        
        // Handle error as object or string
        if (typeof result.error === "object" && result.error !== null) {
          const err = result.error as Record<string, any>;
          // Error is an object - extract user-friendly fields
          if (err.error_user_title) {
            errorTitle = err.error_user_title;
          }
          if (err.error_user_msg) {
            errorMessage = err.error_user_msg;
          } else if (err.message) {
            errorMessage = err.message;
          }
        } else if (typeof result.error === "string") {
          // Error is a string - try to parse as JSON or use directly
          try {
            const errorObj = JSON.parse(result.error);
            if (errorObj.error_user_title) {
              errorTitle = errorObj.error_user_title;
            }
            if (errorObj.error_user_msg) {
              errorMessage = errorObj.error_user_msg;
            } else if (errorObj.message) {
              errorMessage = errorObj.message;
            }
          } catch (e) {
            // Not JSON, use string as message
            errorMessage = result.error;
          }
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      }
  };

  // Build preview template from current form data
  const previewTemplate: Template = {
    id: "preview",
    name: formData.name || "Preview",
    category: formData.category,
    language: formData.language,
    status: "PENDING",
    components: [],
  };

  // Add header to preview
  if (formData.headerType !== "none") {
    previewTemplate.components.push({
      type: "HEADER",
      format: formData.headerType,
      ...(formData.headerType === "TEXT" && formData.headerText && { text: formData.headerText }),
    } as unknown as TemplateComponent);
  }

  // Add body to preview
  if (formData.bodyText) {
    previewTemplate.components.push({
      type: "BODY",
      text: formData.bodyText,
    } as unknown as TemplateComponent);
  }

  // Add footer to preview
  if (formData.footerText) {
    previewTemplate.components.push({
      type: "FOOTER",
      text: formData.footerText,
    } as unknown as TemplateComponent);
  }

  // Add buttons to preview
  if (formData.buttons.length > 0) {
    previewTemplate.components.push({
      type: "BUTTONS",
      buttons: formData.buttons as TemplateButton[],
    } as unknown as TemplateComponent);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Form Section - Takes 2/3 of the width */}
      <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Configure the template name and category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="my_template_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters and underscores only
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="category">Category</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-semibold">Marketing:</p>
                        <p className="text-sm">Business-initiated templates e.g. promotions, offers, informational updates, survey requests</p>
                        <p className="font-semibold mt-2">Utility:</p>
                        <p className="text-sm">Specific customer requests, transactions, post-purchase notifications, or billing reminders</p>
                        <p className="font-semibold mt-2">Authentication:</p>
                        <p className="text-sm">One-time passcodes</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  const newCategory = value as Template["category"];
                  // Clear buttons and footer for AUTHENTICATION templates
                  if (newCategory === "AUTHENTICATION") {
                    setFormData({ 
                      ...formData, 
                      category: newCategory,
                      buttons: [],
                      footerText: "",
                      headerType: "none"
                    });
                  } else {
                    setFormData({ ...formData, category: newCategory });
                  }
                }}
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
              {formData.category === "AUTHENTICATION" && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  ⚠️ Authentication templates support text-only messages with placeholders for OTP codes. Headers, footers, and buttons are not allowed.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {formData.category !== "AUTHENTICATION" && (
      <Card>
        <CardHeader>
          <CardTitle>Header (Optional)</CardTitle>
          <CardDescription>
            Add a header to your template message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Header Type</Label>
            <Select
              value={formData.headerType}
              onValueChange={(value) =>
                setFormData({ ...formData, headerType: value as typeof formData.headerType })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Header</SelectItem>
                <SelectItem value="TEXT">Text</SelectItem>
                <SelectItem value="IMAGE">Image</SelectItem>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="DOCUMENT">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.headerType === "TEXT" && (
            <div className="space-y-2">
              <Label htmlFor="headerText">Header Text</Label>
              <Input
                id="headerText"
                placeholder="Welcome to our service"
                value={formData.headerText}
                onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
              />
            </div>
          )}
          {["IMAGE", "VIDEO", "DOCUMENT"].includes(formData.headerType) && (
            <div className="space-y-3">
              {formData.headerMediaUrl && (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">Current Media</p>
                      <p className="text-xs text-green-700 dark:text-green-300 truncate">{formData.headerMediaUrl}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, headerMediaUrl: "" })}
                      disabled={uploadingMedia}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
              
              {!formData.headerMediaUrl && (
                <div className="rounded-lg border border-dashed bg-muted/50 p-4 space-y-2">
                  <p className="text-sm font-medium">Upload Media to WhatsApp</p>
                  <p className="text-xs text-muted-foreground">
                    Select your {formData.headerType.toLowerCase()} file. It will be uploaded to WhatsApp Business API and the media ID will be automatically added below.
                    {formData.headerType === "VIDEO" && " Video must be 4MB or smaller. This is just a sample for template review - when sending messages, you can use a different video."}
                  </p>
                  <Input
                    type="file"
                    accept={
                      formData.headerType === "IMAGE" ? "image/*" :
                      formData.headerType === "VIDEO" ? "video/*" :
                      ".pdf,.doc,.docx"
                    }
                    disabled={uploadingMedia}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      if (!isConfigured) {
                        toast({
                          title: "Configuration Required",
                          description: "Please configure your API settings first.",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Enforce 4MB limit for video uploads
                      if (formData.headerType === "VIDEO" && file.size > 4 * 1024 * 1024) {
                        toast({
                          title: "File Too Large",
                          description: "Video must be 4MB or smaller. This is just a sample video for template creation - a short clip is sufficient.",
                          variant: "destructive",
                        });
                        e.target.value = "";
                        return;
                      }
                      
                      setUploadingMedia(true);
                      toast({
                        title: "Uploading...",
                        description: "Uploading your media to WhatsApp Business API",
                      });
                      
                      const result = await uploadMedia(config, file);
                      setUploadingMedia(false);
                      
                      if (result.success && result.data?.id) {
                        setFormData({ ...formData, headerMediaUrl: result.data.id });
                        toast({
                          title: "Upload Successful",
                          description: "Media uploaded successfully. The media ID has been added to your template.",
                        });
                      } else {
                        toast({
                          title: "Upload Failed",
                          description: result.error || "Failed to upload media. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="cursor-pointer"
                  />
                </div>
              )}
              
              {formData.headerMediaUrl && !uploadingMedia && (
                <div className="space-y-2">
                  <Label htmlFor="headerMediaUrl">Media ID</Label>
                  <Input
                    id="headerMediaUrl"
                    placeholder="Media ID"
                    value={formData.headerMediaUrl}
                    onChange={(e) => setFormData({ ...formData, headerMediaUrl: e.target.value })}
                    disabled={uploadingMedia}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can manually edit this media ID if needed.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Message Body</CardTitle>
          <CardDescription>
            {formData.category === "AUTHENTICATION" 
              ? "The message with placeholder for OTP code" 
              : "The main content of your message. Use {{1}}, {{2}} for variables."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            placeholder={formData.category === "AUTHENTICATION" 
              ? "Your OTP code is {{1}}. Do not share this code."
              : "Hello {{1}}, thank you for contacting us..."}
            value={formData.bodyText}
            onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {formData.category === "AUTHENTICATION" ? (
              <>
                <strong>Authentication Template:</strong> Use {"{{1}}"} as placeholder for the OTP code. Keep the message simple and straightforward.
              </>
            ) : (
              <>
                <strong>Important:</strong> Variables cannot be at the start or end. Include at least 2-3 words per variable. Example: "Hello {"{{1}}"}, your order {"{{2}}"} is ready!"
              </>
            )}
          </p>
        </CardContent>
      </Card>

      {formData.category !== "AUTHENTICATION" && (
      <Card>
        <CardHeader>
          <CardTitle>Footer (Optional)</CardTitle>
          <CardDescription>
            Add a footer to your template message
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Reply STOP to unsubscribe"
            value={formData.footerText}
            onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
          />
        </CardContent>
      </Card>
      )}

      {formData.category !== "AUTHENTICATION" && (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Buttons (Optional)</CardTitle>
            <CardDescription>
              Add interactive buttons to your template
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addButton}
            disabled={formData.buttons.length >= 10}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Button
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.buttons.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No buttons added. Click "Add Button" to add interactive buttons.
            </p>
          ) : (
            formData.buttons.map((button, index) => (
              <div key={index} className="flex items-start gap-4 rounded-lg border border-border p-4">
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Button Type</Label>
                      <Select
                        value={button.type}
                        onValueChange={(value) => updateButton(index, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                          <SelectItem value="URL">URL</SelectItem>
                          <SelectItem value="PHONE_NUMBER">Phone Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input
                        placeholder="Click here"
                        value={button.text}
                        onChange={(e) => updateButton(index, "text", e.target.value)}
                      />
                    </div>
                  </div>
                  {button.type === "URL" && (
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        placeholder="https://example.com"
                        value={button.url || ""}
                        onChange={(e) => updateButton(index, "url", e.target.value)}
                      />
                    </div>
                  )}
                  {button.type === "PHONE_NUMBER" && (
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        placeholder="+1234567890"
                        value={button.phone || ""}
                        onChange={(e) => updateButton(index, "phone", e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeButton(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      )}

      <div className="flex flex-col gap-3">
        {mode === "create" && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={saveDraft}
              disabled={loading}
            >
              {draftSaved ? "✓ Draft Saved" : "Save Draft"}
            </Button>
            {hasDraft && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearDraft}
                disabled={loading}
              >
                Clear Draft
              </Button>
            )}
          </div>
        )}
        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={loading || !isConfigured}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Template" : "Update Template"}
          </Button>
        </div>
      </div>
    </form>

    {/* Preview Section - Takes 1/3 of the width, sticky on scroll */}
    <div className="lg:col-span-1">
      <div className="lg:sticky lg:top-6">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Live Preview</CardTitle>
            <CardDescription className="text-xs">
              WhatsApp appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <WhatsAppPreview template={previewTemplate} compact={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  );
}
