"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/whatsapp/ui/tooltip";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { useConfig } from "@/lib/whatsapp/config-context";
import { useCallback as useCallbackRef } from "react";
import {
  sendMessage,
  getTemplates,
  type MessagePayload,
  type Template,
} from "@/lib/whatsapp/whatsapp-api";
import { Send, Loader2, ImageIcon, FileText, File, MessageSquare, X, Upload, Info } from "lucide-react";
import { WhatsAppPreview } from "@/components/whatsapp/templates/whatsapp-preview";

type MessageType = "text" | "image" | "document" | "template";

export function SendMessageForm() {
  const { config, isConfigured, organizationId, isLoading: contextLoading } = useConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  const [formData, setFormData] = useState({
    recipient: "",
    // Text message
    textBody: "",
    // Image message
    imageUrl: "",
    imageCaption: "",
    // Document message
    documentUrl: "",
    documentCaption: "",
    documentFilename: "",
    // Template message
    templateName: "",
    templateLanguage: "en",
    templateParams: [] as string[],
    // Template image header
    templateImageUrl: "",
    // Template video header
    templateVideoUrl: "",
    // Template document header
    templateDocumentUrl: "",
  });

  const [templateImageUploading, setTemplateImageUploading] = useState(false);
  const [templateVideoUploading, setTemplateVideoUploading] = useState(false);
  const [templateDocumentUploading, setTemplateDocumentUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);

  const handleDirectMediaUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, mediaType: "image" | "document") => {
    const file = event.target.files?.[0];
    if (!file) return;

    const setUploading = mediaType === "image" ? setImageUploading : setDocumentUploading;
    const urlKey = mediaType === "image" ? "imageUrl" : "documentUrl";

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("public_id", `message_${mediaType}_${Date.now()}`);

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
        [urlKey]: data.url,
        ...(mediaType === "document" ? { documentFilename: file.name } : {}),
      }));

      toast({
        title: "Upload Successful",
        description: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully.`,
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
  }, [toast]);

  const handleMediaUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, mediaType: "image" | "video" | "document") => {
    const file = event.target.files?.[0];
    if (!file) return;

    const setUploading = mediaType === "image" ? setTemplateImageUploading : mediaType === "video" ? setTemplateVideoUploading : setTemplateDocumentUploading;
    const stateKey = mediaType === "image" ? "templateImageUrl" : mediaType === "video" ? "templateVideoUrl" : "templateDocumentUrl";

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("public_id", `template_${mediaType}_${formData.templateName}_${Date.now()}`);

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

  const fetchTemplates = useCallback(async () => {
    if (!isConfigured) return;
    const result = await getTemplates(config);
    if (result.success && result.data) {
      setTemplates(result.data.data.filter((t) => t.status?.toUpperCase() === "APPROVED"));
    }
  }, [config, isConfigured]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle template selection - auto-set language and parameters
  const handleTemplateSelect = (templateName: string) => {
    const template = templates.find((t) => t.name === templateName);
    if (template) {
      setSelectedTemplate(template);
      
      // Count variables in body text to determine required parameters
      const body = template.components?.find((c) => c.type === "BODY");
      const bodyText = body?.text || "";
      const matches = bodyText.match(/\{\{\d+\}\}/g) || [];
      const paramCount = matches.length;
      
      // Initialize parameters array with empty strings
      const initialParams = Array(paramCount).fill("");
      
      setFormData((prev) => ({
        ...prev,
        templateName: template.name,
        templateLanguage: template.language || "en",
        templateParams: initialParams,
      }));
    } else {
      setSelectedTemplate(null);
      setFormData((prev) => ({
        ...prev,
        templateName: "",
        templateLanguage: "en",
        templateParams: [],
      }));
    }
  };

  const handleSend = async () => {
    if (contextLoading) {
      toast({
        title: "Loading",
        description: "Please wait while configuration is loading...",
      });
      return;
    }

    if (!organizationId) {
      toast({
        title: "Configuration Required",
        description: "Organization ID not found. Please configure it in Settings.",
        variant: "destructive",
      });
      return;
    }

    if (!isConfigured) {
      toast({
        title: "Configuration Required",
        description: "Please configure your API settings first.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.recipient) {
      toast({
        title: "Validation Error",
        description: "Recipient phone number is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    let message: MessagePayload;

    switch (messageType) {
      case "text":
        if (!formData.textBody) {
          toast({
            title: "Validation Error",
            description: "Message body is required.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        message = {
          messaging_product: "whatsapp",
          preview_url: false,
          recipient_type: "individual",
          to: formData.recipient,
          type: "text",
          text: { body: formData.textBody },
        };
        break;

      case "image":
        if (!formData.imageUrl) {
          toast({
            title: "Validation Error",
            description: "Please upload an image first.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        message = {
          messaging_product: "whatsapp",
          preview_url: false,
          recipient_type: "individual",
          to: formData.recipient,
          type: "image",
          image: {
            link: formData.imageUrl,
            caption: formData.imageCaption || undefined,
          },
        };
        break;

      case "document":
        if (!formData.documentUrl) {
          toast({
            title: "Validation Error",
            description: "Please upload a document first.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        message = {
          messaging_product: "whatsapp",
          preview_url: false,
          recipient_type: "individual",
          to: formData.recipient,
          type: "document",
          document: {
            link: formData.documentUrl,
            caption: formData.documentCaption || undefined,
            filename: formData.documentFilename || undefined,
          },
        };
        break;

      case "template":
        if (!formData.templateName) {
          toast({
            title: "Validation Error",
            description: "Please select a template.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Validate that the selected template exists and is approved
        if (!selectedTemplate) {
          toast({
            title: "Template Not Found",
            description: `The template "${formData.templateName}" no longer exists or is not approved. Please select a different template.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
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
            type: "body",
            parameters: formData.templateParams.map((text) => ({
              type: "text" as const,
              text,
            })),
          });
        }
        
        message = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formData.recipient,
          type: "template",
          template: {
            name: formData.templateName,
            language: { code: formData.templateLanguage },
            components: templateComponents.length > 0 ? templateComponents : undefined,
          },
        };
        break;

      default:
        setLoading(false);
        return;
    }

    const result = await sendMessage(config, message, { organizationId });
    setLoading(false);

    if (result.success) {
      toast({
        title: "Success",
        description: `Message sent successfully! ID: ${result.data?.messages[0]?.id}`,
      });
      setFormData((prev) => ({
        ...prev,
        textBody: "",
        imageUrl: "",
        imageCaption: "",
        documentUrl: "",
        documentCaption: "",
        documentFilename: "",
      }));
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  const updateTemplateParam = (index: number, value: string) => {
    const newParams = [...formData.templateParams];
    newParams[index] = value;
    setFormData((prev) => ({ ...prev, templateParams: newParams }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Message</CardTitle>
        <CardDescription>
          Send a single WhatsApp message to a recipient
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipient Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Phone Number</Label>
          <Input
            id="recipient"
            placeholder="254712345678"
            value={formData.recipient}
            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Include country code without + (e.g., 254712345678 for Kenya)
          </p>
        </div>

        {/* Message Type Tabs */}
        <Tabs value={messageType} onValueChange={(v) => setMessageType(v as MessageType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Text</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Image</span>
            </TabsTrigger>
            <TabsTrigger value="document" className="flex items-center gap-2">
              <File className="h-4 w-4" />
              <span className="hidden sm:inline">Document</span>
            </TabsTrigger>
            <TabsTrigger value="template" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Template</span>
            </TabsTrigger>
          </TabsList>

          {/* Text Message */}
          <TabsContent value="text" className="space-y-4 pt-4">
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm">A free-form message on WhatsApp is a non-template, conversational message (text, media, or location) that businesses can send to users without prior Meta approval. They can only be sent within a 24-hour "active session" window triggered by a user's message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">This is a Free Form message</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="textBody">Message</Label>
              <Textarea
                id="textBody"
                placeholder="Type your message here..."
                value={formData.textBody}
                onChange={(e) => setFormData({ ...formData, textBody: e.target.value })}
                rows={4}
              />
            </div>
          </TabsContent>

          {/* Image Message */}
          <TabsContent value="image" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Upload Image</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="imageFileInput"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleDirectMediaUpload(e, "image")}
                      disabled={imageUploading}
                      className="cursor-pointer"
                    />
                    <label className="absolute left-3 top-1/2 -translate-y-1/2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-2 py-1 text-xs font-medium rounded pointer-events-none whitespace-nowrap">
                      Choose File
                    </label>
                  </div>
                  {imageUploading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {formData.imageUrl && (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2">
                    <img
                      src={formData.imageUrl}
                      alt="Uploaded preview"
                      className="h-16 w-16 rounded object-cover"
                      crossOrigin="anonymous"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{formData.imageUrl}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, JPEG, PNG. Max size: 5MB
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageCaption">Caption (Optional)</Label>
              <Input
                id="imageCaption"
                placeholder="Enter a caption for the image"
                value={formData.imageCaption}
                onChange={(e) => setFormData({ ...formData, imageCaption: e.target.value })}
              />
            </div>
          </TabsContent>

          {/* Document Message */}
          <TabsContent value="document" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Upload Document</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="documentFileInput"
                      type="file"
                      accept="application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      onChange={(e) => handleDirectMediaUpload(e, "document")}
                      disabled={documentUploading}
                      className="cursor-pointer"
                    />
                    <label className="absolute left-3 top-1/2 -translate-y-1/2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-2 py-1 text-xs font-medium rounded pointer-events-none whitespace-nowrap">
                      Choose File
                    </label>
                  </div>
                  {documentUploading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {formData.documentUrl && (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2">
                    <FileText className="h-8 w-8 shrink-0 text-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{formData.documentFilename || "Document"}</p>
                      <p className="text-xs text-muted-foreground truncate">{formData.documentUrl}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, documentUrl: "", documentFilename: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX. Max size: 100MB
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentCaption">Caption (Optional)</Label>
              <Input
                id="documentCaption"
                placeholder="Enter a caption"
                value={formData.documentCaption}
                onChange={(e) => setFormData({ ...formData, documentCaption: e.target.value })}
              />
            </div>
          </TabsContent>

          {/* Template Message */}
          <TabsContent value="template" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Input
                  value={formData.templateLanguage}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-detected from template
                </p>
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
                      <div className="flex items-center border border-input rounded-md overflow-hidden flex-1">
                        <Input
                          id={`template${headerType}Input`}
                          type="file"
                          accept={accept}
                          onChange={(e) => handleMediaUpload(e, headerType.toLowerCase() as "image" | "video" | "document")}
                          disabled={isUploading}
                          className="flex-1 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = document.getElementById(`template${headerType}Input`) as HTMLInputElement;
                            if (input) input.click();
                          }}
                          disabled={isUploading}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-4 py-2 text-sm font-medium whitespace-nowrap border-l border-input"
                        >
                          Choose File
                        </button>
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

            {/* Parameters Section */}
            {formData.templateParams.length > 0 && (
              <div className="space-y-3">
                <Label>Body Parameters ({formData.templateParams.length} required)</Label>
                <div className="space-y-2">
                  {formData.templateParams.map((param, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-12 shrink-0">{`{{${index + 1}}}`}</span>
                      <Input
                        value={param}
                        onChange={(e) => updateTemplateParam(index, e.target.value)}
                        placeholder={`Value for parameter ${index + 1}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp Preview */}
            {selectedTemplate && (
              <div className="border-t pt-4">
                <Label className="mb-3 block text-sm">Preview</Label>
                <WhatsAppPreview
                  template={selectedTemplate}
                  bodyParams={formData.templateParams}
                  chatOnly
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Send Button */}
        <Button onClick={handleSend} disabled={loading || !isConfigured || contextLoading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </>
          )}
        </Button>

        {!isConfigured && (
          <p className="text-sm text-center text-muted-foreground">
            Please configure your API settings in the Settings page first.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
