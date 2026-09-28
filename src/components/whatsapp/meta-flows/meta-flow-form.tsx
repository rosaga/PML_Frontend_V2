"use client";

import { useState } from "react";
import { Button } from "@/components/whatsapp/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/whatsapp/ui/select";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { useConfig } from "@/lib/whatsapp/config-context";
import { createMetaFlow } from "@/lib/whatsapp/meta-flows-api";
import { Loader2, Plus } from "lucide-react";

interface MetaFlowFormProps {
  onSuccess?: () => void;
}

type ManagedAssetType = "META_FLOW" | "CATALOGUE";

const initialFormData = {
  type: "META_FLOW" as ManagedAssetType,
  flow_id: "",
  flow_name: "",
  description: "",
  default_cta: "Start Form",
  default_screen: "",
};

export function MetaFlowForm({ onSuccess }: MetaFlowFormProps) {
  const { organizationExternalId, organizationId, isLoading } = useConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const effectiveOrganizationId = organizationExternalId || organizationId;
  const isCatalogue = formData.type === "CATALOGUE";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isLoading) {
      toast({
        title: "Loading",
        description: "Please wait while configuration is loading.",
      });
      return;
    }

    if (!effectiveOrganizationId) {
      toast({
        title: "Configuration Required",
        description: "Organization ID not found. Please configure it in Settings.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.flow_name.trim()) {
      toast({
        title: "Validation Error",
        description: `${isCatalogue ? "Catalogue" : "Flow"} name is required.`,
        variant: "destructive",
      });
      return;
    }

    if (isCatalogue && !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Catalogue description is required.",
        variant: "destructive",
      });
      return;
    }

    if (!isCatalogue && (!formData.flow_id.trim() || !formData.default_cta.trim() || !formData.default_screen.trim())) {
      toast({
        title: "Validation Error",
        description: "Flow ID, CTA, and default screen are required for Meta Flows.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await createMetaFlow(effectiveOrganizationId, formData);
    setLoading(false);

    if (result.success) {
      toast({
        title: "Success",
        description: `${isCatalogue ? "Catalogue" : "Meta Flow"} saved successfully.`,
      });
      setFormData({ ...initialFormData, type: formData.type });
      onSuccess?.();
    } else {
      toast({
        title: "Error",
        description: result.error || `Failed to save ${isCatalogue ? "Catalogue" : "Meta Flow"}.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Meta Flow or Catalogue</CardTitle>
        <CardDescription>
          Add a Meta-created WhatsApp Flow or catalogue so it can be managed from this platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 sm:max-w-xs">
            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(type: ManagedAssetType) => setFormData({ ...formData, type })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="META_FLOW">Meta Flow</SelectItem>
                <SelectItem value="CATALOGUE">Catalogue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flow_name">{isCatalogue ? "Catalogue Name" : "Flow Name"}</Label>
            <Input
              id="flow_name"
              placeholder={isCatalogue ? "Message templates_order_form_MARKETING_df6d7" : "Customer order flow"}
              value={formData.flow_name}
              onChange={(e) => setFormData({ ...formData, flow_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder={isCatalogue ? "Nyumbani Greens Catalogue" : "Collects customer order details"}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {!isCatalogue && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="flow_id">Meta Flow ID</Label>
                  <Input
                    id="flow_id"
                    placeholder="123456789012345"
                    value={formData.flow_id}
                    onChange={(e) => setFormData({ ...formData, flow_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_screen">Default Screen</Label>
                  <Input
                    id="default_screen"
                    placeholder="ORDER_DETAILS"
                    value={formData.default_screen}
                    onChange={(e) => setFormData({ ...formData, default_screen: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_cta">Flow CTA</Label>
                <Input
                  id="default_cta"
                  placeholder="Start Form"
                  value={formData.default_cta}
                  onChange={(e) => setFormData({ ...formData, default_cta: e.target.value })}
                />
              </div>
            </>
          )}

          <Button type="submit" disabled={loading || isLoading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Save {isCatalogue ? "Catalogue" : "Meta Flow"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
