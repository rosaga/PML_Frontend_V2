"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Button } from "@/components/whatsapp/ui/button";
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
import { getTemplates, type Template } from "@/lib/whatsapp/whatsapp-api";
import { Users, Upload, Send, Download, CheckCircle, PlusCircle, Loader2, Clock } from "lucide-react";
import { Switch } from "@/components/whatsapp/ui/switch";

interface Group {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

interface Component {
  type: string;
  parameters: Array<{
    type: string;
    text?: string;
  }>;
}

export function CampaignForm({ onSuccess }: { onSuccess?: () => void }) {
  const { config, isConfigured, displayPhoneNumber, organizationId, organizationExternalId, signalPmlUnauthorized } = useConfig();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"new" | "existing">("existing");
  const [loading, setLoading] = useState(false);
  
  // Create new group state
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Send to existing group state
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedTemplateObj, setSelectedTemplateObj] = useState<Template | null>(null);
  const [templateParams, setTemplateParams] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [batchSize, setBatchSize] = useState<number | "">(100);
  
  // Template media header state
  const [templateImageUrl, setTemplateImageUrl] = useState("");
  const [templateVideoUrl, setTemplateVideoUrl] = useState("");
  const [templateDocumentUrl, setTemplateDocumentUrl] = useState("");
  const [templateImageUploading, setTemplateImageUploading] = useState(false);
  const [templateVideoUploading, setTemplateVideoUploading] = useState(false);
  const [templateDocumentUploading, setTemplateDocumentUploading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!isConfigured) return;
    const result = await getTemplates(config);
    if (result.success && result.data?.data) {
      setTemplates(result.data.data.filter((t) => t.status?.toUpperCase() === "APPROVED"));
    }
  }, [config, isConfigured]);

  const fetchGroups = useCallback(async () => {
    try {
      const url = new URL("/api/whatsapp/peakdata/groups", window.location.origin);
      if (organizationExternalId) {
        url.searchParams.append("organizationExternalId", organizationExternalId);
      } else if (organizationId) {
        url.searchParams.append("organizationId", organizationId);
      }
      url.searchParams.append("orderby", "created_at DESC");
      url.searchParams.append("size", "50");
      const response = await fetch(url.toString(), {
        headers: {
          "x-auth-token": localStorage.getItem("token") || "",
        },
      });
      
      if (response.status === 401) { signalPmlUnauthorized(); return; }
      const data = await response.json();

      if (response.ok && data.data) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  }, [organizationExternalId, organizationId, signalPmlUnauthorized]);

  useEffect(() => {
    fetchTemplates();
    fetchGroups();
  }, [fetchTemplates, fetchGroups]);

  const handleDownloadTemplate = () => {
    const csvContent = `mobile,firstName,lastName
254712345678,John,Doe
254723456789,Jane,Smith
254734567890,Bob,Johnson`;
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "contacts_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded successfully",
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Validation Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create group
      const groupResponse = await fetch("/api/whatsapp/peakdata/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token") || "",
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription || groupName,
          organizationExternalId,
          metadata: {
            source: "frontend",
            purpose: "whatsapp_campaign",
          },
        }),
      });

      const groupData = await groupResponse.json();

      if (!groupResponse.ok) {
        throw new Error(groupData?.error?.message || "Failed to create group");
      }

      // API may return { id } or { data: { id } }
      const createdGroupId = groupData?.data?.id ?? groupData?.id;
      if (!createdGroupId) {
        throw new Error("Group was created but no ID was returned");
      }

      toast({
        title: "Group Created",
        description: `Group "${groupName}" has been created successfully`,
      });

      // Step 2: Upload contacts to the created group
      const effectiveOrgId = organizationExternalId || organizationId;
      const formData = new FormData();
      formData.append("contacts", selectedFile);
      formData.append("group_id", String(createdGroupId));
      formData.append("organizationExternalId", effectiveOrgId);

      const contactsResponse = await fetch("/api/whatsapp/peakdata/contacts", {
        method: "POST",
        headers: {
          "x-auth-token": localStorage.getItem("token") || "",
        },
        body: formData,
      });

      // Handle potential empty or non-JSON responses
      const contactsText = await contactsResponse.text();
      let contactsData;
      
      try {
        contactsData = contactsText ? JSON.parse(contactsText) : { success: true };
      } catch (e) {
        // If we can't parse but status is OK, continue
        if (contactsResponse.ok) {
          contactsData = { success: true };
        } else {
          throw new Error("Invalid response from server when uploading contacts");
        }
      }

      if (!contactsResponse.ok) {
        throw new Error(contactsData?.error?.message || "Failed to upload contacts");
      }

      // Switch to existing groups tab and refresh groups
      toast({
        title: "Group Created Successfully",
        description: "Group created and contacts uploaded. Switch to 'Send to Existing Group' to send messages.",
      });
      
      // Reset form
      setGroupName("");
      setGroupDescription("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Switch to existing groups tab
      setActiveTab("existing");
      fetchGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, mediaType: "image" | "video" | "document") => {
    const file = event.target.files?.[0];
    if (!file) return;

    const setUploading = mediaType === "image" ? setTemplateImageUploading : mediaType === "video" ? setTemplateVideoUploading : setTemplateDocumentUploading;
    const setUrl = mediaType === "image" ? setTemplateImageUrl : mediaType === "video" ? setTemplateVideoUrl : setTemplateDocumentUrl;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("public_id", `campaign_${mediaType}_${Date.now()}`);

      const response = await fetch("/api/whatsapp/cloudinary/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to upload ${mediaType}`);
      }

      const data = await response.json();
      setUrl(data.url);

      toast({
        title: "Success",
        description: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully`,
      });
    } catch (error) {
      console.error(`Failed to upload ${mediaType}:`, error);
      toast({
        title: "Upload Failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    const template = templates.find((t) => t.name === templateName);
    setSelectedTemplateObj(template || null);
    // Reset parameters and media when template changes
    setTemplateParams([]);
    setTemplateImageUrl("");
    setTemplateVideoUrl("");
    setTemplateDocumentUrl("");
  };

  // Count expected BODY parameters from template (header media is handled separately)
  const getTemplateParameterCount = (): number => {
    if (!selectedTemplateObj) return 0;
    
    let count = 0;
    selectedTemplateObj.components.forEach((component: any) => {
      if (component.type === "BODY" && component.example?.body_text?.[0]) {
        count += component.example.body_text[0].length;
      }
    });
    return count;
  };

  const handleParameterChange = (value: string) => {
    const params = value.split(",").map(p => p.trim()).filter(Boolean);
    const maxParams = getTemplateParameterCount();
    
    // Enforce parameter limit
    if (maxParams > 0 && params.length > maxParams) {
      toast({
        title: "Too Many Parameters",
        description: `This template accepts only ${maxParams} parameter${maxParams > 1 ? 's' : ''}`,
        variant: "destructive",
      });
      return;
    }
    
    setTemplateParams(params);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        toast({
          title: "Invalid File",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const toIsoWithOffset = (date: string, time: string): string => {
    const localDatetime = `${date}T${time}`;
    const d = new Date(localDatetime);
    const off = -d.getTimezoneOffset();
    const sign = off >= 0 ? "+" : "-";
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, "0");
    return `${localDatetime}:00${sign}${pad(off / 60)}:${pad(off % 60)}`;
  };

  const handleSendToExistingGroup = async () => {
    if (!selectedGroupId) {
      toast({
        title: "Validation Error",
        description: "Please select a group",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTemplate) {
      toast({
        title: "Validation Error",
        description: "Please select a template",
        variant: "destructive",
      });
      return;
    }

    if (scheduleEnabled && (!scheduledDate || !scheduledTime)) {
      toast({
        title: "Validation Error",
        description: "Please select both a date and time to schedule the campaign",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Validate required config fields
      if (!config.phoneNumberId || !config.apiKey || !displayPhoneNumber) {
        toast({
          title: "Configuration Required",
          description: "Please configure your WhatsApp API settings (including display phone number) in the Settings tab",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Build parameter mapping: keys must be PARAM1, PARAM2, etc. (backend uses paramIndex to parse)
      // Values are the uppercase metadata field names on the contacts (e.g. FIRSTNAME, LASTNAME)
      const parameterMapping: Record<string, string> = {};
      templateParams.forEach((param, index) => {
        parameterMapping[`PARAM${index + 1}`] = param.toUpperCase();
      });

      // Build components array with header and body parameters
      const components: Component[] = [];

      // Add header component if template has a media header
      const templateHeader = selectedTemplateObj?.components?.find((c: any) => c.type === "HEADER");
      if (templateHeader && ["IMAGE", "VIDEO", "DOCUMENT"].includes(templateHeader.format ?? "")) {
        let uploadedUrl = "";
        if (templateHeader.format === "IMAGE") uploadedUrl = templateImageUrl;
        else if (templateHeader.format === "VIDEO") uploadedUrl = templateVideoUrl;
        else if (templateHeader.format === "DOCUMENT") uploadedUrl = templateDocumentUrl;

        if (!uploadedUrl) {
          toast({
            title: "Validation Error",
            description: `Please upload a ${(templateHeader.format ?? "file").toLowerCase()} for this template's header.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        components.push({
          type: "header",
          parameters: [
            {
              type: (templateHeader.format ?? "file").toLowerCase(),
              [(templateHeader.format ?? "file").toLowerCase()]: {
                link: uploadedUrl,
              },
            },
          ] as any,
        });
      }
      
      // Add body component - the backend will override this with personalized data
      // from parameter_mapping, but we include it for request validation
      if (templateParams.length > 0) {
        components.push({
          type: "body",
          parameters: templateParams.map((param) => ({
            type: "text",
            text: param.toUpperCase(),
          })),
        });
      }

      const campaignPayload: Record<string, unknown> = {
        group_id: parseInt(selectedGroupId),
        template_id: selectedTemplateObj?.id || selectedTemplate,
        template_name: selectedTemplate,
        language: selectedTemplateObj?.language || "en_US",
        components,
        waba_number: displayPhoneNumber.startsWith("+") ? displayPhoneNumber.slice(1) : displayPhoneNumber,
        whatsapp_api_key: config.apiKey,
        phone_number_id: config.phoneNumberId,
        category: selectedTemplateObj?.category || "MARKETING",
        campaign_name: campaignName || `Campaign ${new Date().toLocaleDateString()}`,
        parameter_mapping: parameterMapping,
        organization_external_id: organizationExternalId,
        organization_id: organizationId,
        ...(scheduleEnabled && scheduledDate && scheduledTime && {
          scheduled_at: toIsoWithOffset(scheduledDate, scheduledTime),
          batch_size: batchSize || 100,
        }),
      };

      const response = await fetch("/api/whatsapp/peakdata/campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to send campaign messages");
      }

      setSendSuccess(true);
      const selectedGroup = groups.find(g => g.id.toString() === selectedGroupId);
      toast({
        title: scheduleEnabled ? "Campaign Scheduled" : "Campaign Sent",
        description: scheduleEnabled
          ? `Campaign scheduled for ${scheduledDate} at ${scheduledTime} to "${selectedGroup?.name || 'the group'}"`
          : `Messages are being sent to all contacts in "${selectedGroup?.name || 'the group'}"`,
      });

      // Reset form
      setSelectedGroupId("");
      setSelectedTemplate("");
      setTemplateParams([]);
      setCampaignName("");
      setScheduleEnabled(false);
      setScheduledDate("");
      setScheduledTime("");
      setBatchSize(100);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "new" | "existing")} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="existing" className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          Send to Existing Group
        </TabsTrigger>
        <TabsTrigger value="new" className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Create New Group
        </TabsTrigger>
      </TabsList>

      {/* Send to Existing Group Tab */}
      <TabsContent value="existing">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Campaign to Existing Group
            </CardTitle>
            <CardDescription>
              Select a group and send personalized WhatsApp messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-select">Select Group *</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={groups.length === 0}>
                <SelectTrigger id="group-select">
                  <SelectValue placeholder={groups.length === 0 ? "No groups available" : "Select a group"} />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name} ({group.description})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {groups.length === 0 && (
                <p className="text-xs text-amber-600">
                  No groups found. Create one in the "Create New Group" tab.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                placeholder="e.g. January Promotion"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional name to identify this campaign
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-existing">WhatsApp Template *</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template-existing">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.name} value={template.name}>
                      {template.name} ({template.category} - {template.language})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateObj && (
                <p className="text-xs text-muted-foreground">
                  Language: {selectedTemplateObj.language} | Category: {selectedTemplateObj.category}
                </p>
              )}
            </div>

            {/* Header Media Upload Section */}
            {selectedTemplateObj && (() => {
              const header = selectedTemplateObj.components?.find((c: any) => c.type === "HEADER" && ["IMAGE", "VIDEO", "DOCUMENT"].includes(c.format ?? ""));
              if (!header) return null;

              const headerType = header.format as "IMAGE" | "VIDEO" | "DOCUMENT";
              const isImage = headerType === "IMAGE";
              const isVideo = headerType === "VIDEO";
              const isDocument = headerType === "DOCUMENT";

              const uploadedUrl = isImage ? templateImageUrl : isVideo ? templateVideoUrl : templateDocumentUrl;
              const isUploading = isImage ? templateImageUploading : isVideo ? templateVideoUploading : templateDocumentUploading;
              const accept = isImage ? "image/png,image/jpeg,image/jpg" : isVideo ? "video/mp4,video/quicktime" : "application/pdf";
              const label = isImage ? "Header Image" : isVideo ? "Header Video" : "Header Document";

              return (
                <div className="space-y-3 border-t pt-4">
                  <Label>{label} *</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Input
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
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </div>
                      )}
                    </div>
                    {uploadedUrl && (
                      <p className="text-xs text-green-600">
                        Uploaded successfully
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      This template requires a {label.toLowerCase()}. Upload one to include in the campaign.
                    </p>
                  </div>
                </div>
              );
            })()}

            {selectedTemplateObj && getTemplateParameterCount() > 0 && (
              <div className="space-y-2">
                <Label htmlFor="params-existing">
                  Template Parameters (comma-separated)
                  <span className="text-muted-foreground ml-2">
                    ({templateParams.length}/{getTemplateParameterCount()})
                  </span>
                </Label>
                <Input
                  id="params-existing"
                  placeholder="e.g., firstname, lastname"
                  value={templateParams.join(", ")}
                  onChange={(e) => handleParameterChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This template accepts {getTemplateParameterCount()} parameter{getTemplateParameterCount() > 1 ? 's' : ''}. Enter contact metadata field names from your CSV columns in order (e.g., firstname, lastname). Each maps to {'{{'}{'{{'} placeholders.
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Messages will be personalized for each contact using their metadata from the CSV upload.
              </p>
            </div>

            {/* Scheduling */}
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Schedule for later</span>
                </div>
                <Switch
                  checked={scheduleEnabled}
                  onCheckedChange={setScheduleEnabled}
                />
              </div>

              {scheduleEnabled && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="scheduled-date">Date</Label>
                      <Input
                        id="scheduled-date"
                        type="date"
                        value={scheduledDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setScheduledDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="scheduled-time">Time</Label>
                      <Input
                        id="scheduled-time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Scheduled in your local timezone.</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="batch-size">Batch Size (messages per day)</Label>
                    <Input
                      id="batch-size"
                      type="number"
                      min={1}
                      placeholder="e.g. 100"
                      value={batchSize}
                      onChange={(e) => setBatchSize(e.target.value === "" ? "" : parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">How many messages to send per day until all contacts are reached.</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSendToExistingGroup}
              disabled={loading || !selectedGroupId || !selectedTemplate}
              className="w-full"
            >
              {loading
                ? scheduleEnabled ? "Scheduling..." : "Sending Campaign..."
                : scheduleEnabled ? "Schedule Campaign" : "Send Campaign"}
            </Button>

            {sendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <strong>Success!</strong> Campaign messages are being sent. Check the Messages tab for status.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Create New Group Tab */}
      <TabsContent value="new">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Create New Campaign Group
            </CardTitle>
            <CardDescription>
              Create a new group and upload contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name *</Label>
              <Input
                id="group-name"
                placeholder="e.g., January Promotion Campaign"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                placeholder="Optional description for your campaign group"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="csv-file">Upload Contacts CSV *</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
              <Input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                CSV must have columns: <span className="font-mono">mobile, firstName, lastName</span>
              </p>
            </div>

            <Button onClick={handleCreateGroup} disabled={loading || !selectedFile || !groupName.trim()} className="w-full">
              {loading ? "Creating Group..." : "Create Group & Upload Contacts"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
