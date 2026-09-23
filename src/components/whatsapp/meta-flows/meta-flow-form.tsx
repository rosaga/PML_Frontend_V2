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
import { useToast } from "@/hooks/whatsapp/use-toast";
import { useConfig } from "@/lib/whatsapp/config-context";
import { createMetaFlow } from "@/lib/whatsapp/meta-flows-api";
import { Loader2, Plus } from "lucide-react";

interface MetaFlowFormProps {
  onSuccess?: () => void;
}

export function MetaFlowForm({ onSuccess }: MetaFlowFormProps) {
  const { organizationExternalId, organizationId, isLoading } = useConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    flow_id: "",
    flow_name: "",
    default_cta: "Start Form",
    default_screen: "",
  });

  const effectiveOrganizationId = organizationExternalId || organizationId;

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

    if (!formData.flow_id || !formData.flow_name || !formData.default_cta || !formData.default_screen) {
      toast({
        title: "Validation Error",
        description: "Flow ID, flow name, CTA, and default screen are required.",
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
        description: "Meta Flow saved successfully.",
      });
      setFormData({
        flow_id: "",
        flow_name: "",
        default_cta: "Start Form",
        default_screen: "",
      });
      onSuccess?.();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save Meta Flow.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Meta Flow</CardTitle>
        <CardDescription>
          Add a Meta-created WhatsApp Flow so it can be managed and sent from this platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="flow_id">Flow ID</Label>
              <Input
                id="flow_id"
                placeholder="1604544051264070"
                value={formData.flow_id}
                onChange={(e) => setFormData({ ...formData, flow_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_screen">Default Screen</Label>
              <Input
                id="default_screen"
                placeholder="QUESTION_ONE"
                value={formData.default_screen}
                onChange={(e) => setFormData({ ...formData, default_screen: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flow_name">Flow Name</Label>
            <Input
              id="flow_name"
              placeholder="Message templates_request_quotation_MARKETING_34f2c"
              value={formData.flow_name}
              onChange={(e) => setFormData({ ...formData, flow_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_cta">Default CTA</Label>
            <Input
              id="default_cta"
              placeholder="Start Form"
              value={formData.default_cta}
              onChange={(e) => setFormData({ ...formData, default_cta: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={loading || isLoading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Save Meta Flow
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
