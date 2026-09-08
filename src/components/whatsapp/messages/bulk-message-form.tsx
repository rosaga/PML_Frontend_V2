"use client";

import React from "react"

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/whatsapp/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/whatsapp/ui/card";
import { Progress } from "@/components/whatsapp/ui/progress";
import { Badge } from "@/components/whatsapp/ui/badge";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { useConfig } from "@/lib/whatsapp/config-context";
import {
  sendBulkMessages,
  getTemplates,
  type Template,
} from "@/lib/whatsapp/whatsapp-api";
import { Send, Loader2, Upload, Users, CheckCircle, XCircle, Download } from "lucide-react";

interface BulkResult {
  to: string;
  success: boolean;
  error?: string;
}

export function BulkMessageForm() {
  const { config, isConfigured, organizationId } = useConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [results, setResults] = useState<BulkResult[]>([]);
  const [progress, setProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    recipients: "",
    templateName: "",
    templateLanguage: "en_US",
    templateParams: [] as string[],
    campaignName: "",
    templateImageUrl: "",
    templateVideoUrl: "",
    templateDocumentUrl: "",
  });

  const [templateImageUploading, setTemplateImageUploading] = useState(false);
  const [templateVideoUploading, setTemplateVideoUploading] = useState(false);
  const [templateDocumentUploading, setTemplateDocumentUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handleMediaUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, mediaType: "image" | "video" | "document") => {
    const file = event.target.files?.[0];
    if (!file) return;

    const setUploading = mediaType === "image" ? setTemplateImageUploading : mediaType === "video" ? setTemplateVideoUploading : setTemplateDocumentUploading;
    const stateKey = mediaType === "image" ? "templateImageUrl" : mediaType === "video" ? "templateVideoUrl" : "templateDocumentUrl";

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("public_id", `bulk_template_${mediaType}_${formData.templateName}_${Date.now()}`);

      const response = await fetch("/api/whatsapp/cloudinary/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to upload ${mediaType}`);
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        [stateKey]: data.url,
      }));

      toast({
        title: "Success",
        description: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully`,
      });
    } catch (error) {
      console.error(`[v0] ${mediaType} upload error:`, error);
      toast({
        title: "Upload Failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [formData.templateName, toast]);

  const handleTemplateSelect = (templateName: string) => {
    const template = templates.find((t) => t.name === templateName);
    setSelectedTemplate(template || null);
    
    // Count variables in body text
    const body = template?.components?.find((c) => c.type === "BODY");
    const bodyText = body?.text || "";
    const matches = bodyText.match(/\{\{\d+\}\}/g) || [];
    const paramCount = matches.length;
    
    const initialParams = Array(paramCount).fill("");
    
    setFormData((prev) => ({
      ...prev,
      templateName,
      templateLanguage: template?.language || "en_US",
      templateParams: initialParams,
      templateImageUrl: "", // Reset image when template changes
    }));
  };

  const fetchTemplates = useCallback(async () => {
    if (!isConfigured) return;
    const result = await getTemplates(config);
    if (result.success && result.data?.data) {
      setTemplates(result.data.data.filter((t) => t.status?.toUpperCase() === "APPROVED"));
    }
  }, [config, isConfigured]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const parseRecipients = (text: string): string[] => {
    return text
      .split(/[\n,;]/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
  };

  const handleSend = async () => {
    if (!isConfigured) {
      toast({
        title: "Configuration Required",
        description: "Please configure your API settings first.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.templateName) {
      toast({
        title: "Validation Error",
        description: "Please select a template.",
        variant: "destructive",
      });
      return;
    }

    // Validate that the selected template exists and is approved
    const selectedTemplate = templates.find((t) => t.name === formData.templateName);
    if (!selectedTemplate) {
      toast({
        title: "Template Not Found",
        description: `The template "${formData.templateName}" no longer exists or is not approved. Please select a different template.`,
        variant: "destructive",
      });
      return;
    }

    const recipients = parseRecipients(formData.recipients);
    
    if (recipients.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one recipient.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResults([]);
    setProgress(0);

    // Build template components with header if present
    const templateComponents = [];
    
    // Check if template has a media header
    const templateHeader = selectedTemplate?.components?.find((c) => c.type === "HEADER");
    if (templateHeader && ["IMAGE", "VIDEO", "DOCUMENT"].includes(templateHeader.format ?? "")) {
      // Determine which URL to use based on header format
      let uploadedUrl = "";
      if (templateHeader.format === "IMAGE") uploadedUrl = formData.templateImageUrl;
      else if (templateHeader.format === "VIDEO") uploadedUrl = formData.templateVideoUrl;
      else if (templateHeader.format === "DOCUMENT") uploadedUrl = formData.templateDocumentUrl;

      // Require user to upload media for this header type
      if (!uploadedUrl) {
        toast({
          title: "Validation Error",
          description: `Please upload a ${(templateHeader.format ?? "file").toLowerCase()} for this template's header.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Add header component with Cloudinary URL
      const headerComponent: any = {
        type: "header",
        parameters: [
          {
            type: templateHeader.format?.toLowerCase() || "image",
            [templateHeader.format?.toLowerCase() || "image"]: {
              link: uploadedUrl,  // Use link for user-uploaded URLs
            },
          },
        ],
      };
      templateComponents.push(headerComponent);
    }

    // Add body component with parameters if present
    if (formData.templateParams.length > 0) {
      templateComponents.push({
        type: "body" as const,
        parameters: formData.templateParams.map((text) => ({
          type: "text" as const,
          text,
        })),
      });
    }

    const message = {
      messaging_product: "whatsapp" as const,
      recipient_type: "individual" as const,
      type: "template" as const,
      template: {
        name: formData.templateName,
        language: { code: formData.templateLanguage },
        components: templateComponents.length > 0 ? templateComponents : undefined,
      },
    };

    // Process in batches to show progress
    const batchSize = 10;
    const allResults: BulkResult[] = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const result = await sendBulkMessages(config, batch, message, {
        wabaNumber: config.phoneNumberId,
        campaignName: formData.campaignName || undefined,
        organizationId: organizationId || undefined,
      });
      
      if (result.success && result.data) {
        allResults.push(...result.data.results);
      }
      
      setProgress(Math.min(100, Math.round(((i + batch.length) / recipients.length) * 100)));
      setResults([...allResults]);
    }

    setLoading(false);

    const sent = allResults.filter((r) => r.success).length;
    const failed = allResults.filter((r) => !r.success).length;

    toast({
      title: "Bulk Send Complete",
      description: `Sent: ${sent}, Failed: ${failed}`,
    });
  };

  const handleDownloadTemplate = () => {
    const csvContent = "phone_number\n254712345678\n254723456789\n254734567890";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bulk_recipients_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFormData((prev) => ({ ...prev, recipients: text }));
    };
    reader.readAsText(file);
  };

  const addTemplateParam = () => {
    setFormData((prev) => ({
      ...prev,
      templateParams: [...prev.templateParams, ""],
    }));
  };

  const updateTemplateParam = (index: number, value: string) => {
    const newParams = [...formData.templateParams];
    newParams[index] = value;
    setFormData((prev) => ({ ...prev, templateParams: newParams }));
  };

  const removeTemplateParam = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      templateParams: prev.templateParams.filter((_, i) => i !== index),
    }));
  };

  const recipientCount = parseRecipients(formData.recipients).length;
  const sentCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Message</CardTitle>
          <CardDescription>
            Send templated messages to multiple recipients at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recipients Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Recipients</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload CSV
                    </span>
                  </Button>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </Label>
              </div>
            </div>
            <Textarea
              placeholder="Enter phone numbers (one per line, or comma/semicolon separated)&#10;&#10;Example:&#10;254712345678&#10;254723456789&#10;254734567890"
              value={formData.recipients}
              onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaignName">Campaign Name (Optional)</Label>
            <Input
              id="campaignName"
              placeholder="e.g., January Promotions, Welcome Messages"
              value={formData.campaignName}
              onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              A name to identify this bulk send in your message history
            </p>
          </div>

          {/* Template Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={formData.templateName}
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id || template.name} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templates.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No approved templates available
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={formData.templateLanguage}
                onValueChange={(value) => setFormData({ ...formData, templateLanguage: value })}
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

          {/* Header Media Upload Section */}
          {selectedTemplate && selectedTemplate.components?.find((c) => c.type === "HEADER" && ["IMAGE", "VIDEO", "DOCUMENT"].includes(c.format ?? "")) && (() => {
            const header = selectedTemplate.components?.find((c) => c.type === "HEADER");
            if (!header) return null;
            
            const headerType = header.format as "IMAGE" | "VIDEO" | "DOCUMENT";
            const isImage = headerType === "IMAGE";
            const isVideo = headerType === "VIDEO";
            const isDocument = headerType === "DOCUMENT";
            
            const urlKey = isImage ? formData.templateImageUrl : isVideo ? formData.templateVideoUrl : formData.templateDocumentUrl;
            const isUploading = isImage ? templateImageUploading : isVideo ? templateVideoUploading : templateDocumentUploading;
            const stateKey = isImage ? "templateImageUrl" : isVideo ? "templateVideoUrl" : "templateDocumentUrl";
            const accept = isImage ? "image/png,image/jpeg,image/jpg" : isVideo ? "video/mp4,video/quicktime" : "application/pdf";
            const label = isImage ? "Header Image" : isVideo ? "Header Video" : "Header Document";
            
            return (
              <div className="space-y-3 border-t pt-4">
                <Label>{label}</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={`bulkTemplate${headerType}Input`}
                        type="file"
                        accept={accept}
                        onChange={(e) => handleMediaUpload(e, headerType.toLowerCase() as "image" | "video" | "document")}
                        disabled={isUploading}
                        className="cursor-pointer"
                      />
                      <label className="absolute left-3 top-1/2 -translate-y-1/2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-2 py-1 text-xs font-medium rounded pointer-events-none whitespace-nowrap">
                        Choose File
                      </label>
                    </div>
                    {isUploading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  {urlKey && (
                    <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-sm">
                      <span className="text-green-700">✓ {headerType.charAt(0) + headerType.slice(1).toLowerCase()} uploaded</span>
                      <button
                        onClick={() => setFormData((prev) => ({ ...prev, [stateKey]: "" }))}
                        className="text-xs text-green-600 hover:text-green-700"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {isImage && "Supported: PNG, JPG, JPEG. Max 5MB."}
                    {isVideo && "Supported: MP4, MOV. Max 16MB."}
                    {isDocument && "Supported: PDF. Max 100MB."}
                    {" Uploads to Cloudinary automatically."}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Template Parameters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Template Parameters</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTemplateParam}>
                Add Parameter
              </Button>
            </div>
            {formData.templateParams.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No parameters added. Add parameters for {"{{1}}"}, {"{{2}}"}, etc.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.templateParams.map((param, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-16">{`{{${index + 1}}}`}</span>
                    <Input
                      value={param}
                      onChange={(e) => updateTemplateParam(index, e.target.value)}
                      placeholder={`Value for {{${index + 1}}}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTemplateParam(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress & Send */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sending messages...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <Button onClick={handleSend} disabled={loading || !isConfigured} className="w-full">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send to {recipientCount} Recipient{recipientCount !== 1 ? "s" : ""}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Send Results</CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-success">
                <CheckCircle className="h-4 w-4" />
                {sentCount} Sent
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" />
                {failedCount} Failed
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    result.success ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  <span className="font-mono text-sm">{result.to}</span>
                  {result.success ? (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                      Sent
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                      {result.error || "Failed"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
