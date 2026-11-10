"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { useConfig } from "@/lib/whatsapp/config-context";

export function CreateGroupForm({ onSuccess, onSubmittingChange }: {
  onSuccess?: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}) {
  const { organizationId, organizationExternalId, signalPmlUnauthorized } = useConfig();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleDownloadTemplate = () => {
    const csvContent = "mobile,firstName,lastName\n254712345678,John,Doe\n254723456789,Jane,Smith\n254734567890,Bob,Johnson";
    const url = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "contacts_template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && !file.name.toLowerCase().endsWith(".csv")) {
      event.target.value = "";
      setSelectedFile(null);
      setError("Please select a CSV file.");
      return;
    }
    setSelectedFile(file);
    setError("");
  };

  const handleCreateGroup = async () => {
    if (loading || !groupName.trim() || !selectedFile) return;
    const effectiveOrgId = organizationExternalId || organizationId;
    const token = localStorage.getItem("token") || "";
    if (!effectiveOrgId) {
      setError("Select an organization before creating a group.");
      return;
    }
    if (!token) {
      signalPmlUnauthorized();
      setError("Sign in again to create a group.");
      return;
    }

    setLoading(true);
    onSubmittingChange?.(true);
    setError("");
    let groupId = createdGroupId;
    try {
      // Retain the created ID so an upload retry does not create another group.
      if (!groupId) {
        const response = await fetch("/api/whatsapp/peakdata/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-auth-token": token },
          body: JSON.stringify({
            name: groupName,
            description: groupDescription || groupName,
            organizationExternalId: effectiveOrgId,
            metadata: { source: "frontend", purpose: "whatsapp_campaign" },
          }),
        });
        if (response.status === 401) signalPmlUnauthorized();
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || "Failed to create group");
        groupId = data?.data?.id ?? data?.id;
        if (!groupId) throw new Error("Group was created but no ID was returned");
        setCreatedGroupId(groupId);
      }

      const formData = new FormData();
      formData.append("contacts", selectedFile);
      formData.append("group_id", String(groupId));
      formData.append("organizationExternalId", effectiveOrgId);
      const response = await fetch("/api/whatsapp/peakdata/contacts", {
        method: "POST",
        headers: { "x-auth-token": token },
        body: formData,
      });
      if (response.status === 401) signalPmlUnauthorized();
      const text = await response.text();
      if (!response.ok) {
        let message = "Failed to upload contacts";
        try {
          const data = JSON.parse(text);
          message = data?.error?.message || (typeof data?.error === "string" ? data.error : message);
        } catch { /* Use the default message for non-JSON errors. */ }
        throw new Error(message);
      }

      toast({ title: "Group Created Successfully", description: `Group "${groupName}" created and contacts uploaded.` });
      setGroupName("");
      setGroupDescription("");
      setSelectedFile(null);
      setCreatedGroupId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create group";
      setError(groupId ? `Group created, but contacts could not be uploaded. ${message}. Retry the upload.` : message);
    } finally {
      setLoading(false);
      onSubmittingChange?.(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="group-name">Group Name *</Label>
        <Input id="group-name" placeholder="e.g., January Promotion Campaign" value={groupName}
          disabled={loading || !!createdGroupId} onChange={(event) => setGroupName(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="group-description">Description</Label>
        <Textarea id="group-description" placeholder="Optional description for your group" value={groupDescription}
          rows={3} disabled={loading || !!createdGroupId} onChange={(event) => setGroupDescription(event.target.value)} />
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="csv-file">Upload Contacts CSV *</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Download Template
          </Button>
        </div>
        <Input ref={fileInputRef} id="csv-file" type="file" accept=".csv" disabled={loading} onChange={handleFileSelect} />
        {selectedFile && <p className="text-sm text-muted-foreground break-all">
          Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
        </p>}
        <p className="text-xs text-muted-foreground">
          CSV columns: <span className="font-mono">mobile, firstName, lastName</span>
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleCreateGroup} disabled={loading || !selectedFile || !groupName.trim()} className="w-full">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        {loading ? "Uploading Contacts..." : createdGroupId ? "Retry Upload" : "Create Group & Upload Contacts"}
      </Button>
    </div>
  );
}
