"use client";

import React, { useState, useEffect } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
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
import { Card } from "@/components/whatsapp/ui/card";
import { Badge } from "@/components/whatsapp/ui/badge";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface FlowNode {
  id: number;
  name: string;
  node_type: string;
  header_text_template_id: number;
  backend_enabled: boolean;
  exit_enabled: boolean;
  extra_data?: Record<string, any>;
}

interface FlowEdge {
  id: number;
  from_id: number;
  to_id: number;
}

interface Flow {
  id: number;
  name: string;
  description: string;
  type: string;
  status: string;
  start_node_id?: number;
}

interface FlowBuilderProps {
  flowId: number | null;
  onBack: () => void;
  onSave: () => void;
}

export function FlowBuilder({ flowId, onBack, onSave }: FlowBuilderProps) {
  const { organizationExternalId } = useConfig();
  const [flow, setFlow] = useState<Flow>({
    id: 0,
    name: "",
    description: "",
    type: "WHATSAPP",
    status: "DRAFT",
  });

  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [loading, setLoading] = useState(flowId ? true : false);
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);

  useEffect(() => {
    if (flowId) {
      fetchFlow(flowId);
    }
  }, [flowId]);

  const fetchFlow = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/whatsapp/flows/${id}`);
      if (!response.ok) throw new Error("Failed to fetch flow");

      const data = await response.json();
      setFlow(data.data);

      // Fetch nodes and edges
      const nodesRes = await fetch(`/api/whatsapp/flows/${id}/nodes`);
      const edgesRes = await fetch(`/api/whatsapp/flows/${id}/edges`);

      if (nodesRes.ok) setNodes(await nodesRes.json());
      if (edgesRes.ok) setEdges(await edgesRes.json());
    } catch (err) {
      console.error("Failed to load flow details:", err);
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFlow = async () => {
    if (!flow.name.trim()) {
      alert("Please enter a flow name");
      return;
    }

    if (!organizationExternalId) {
      alert("Organization ID not configured. Please check your settings.");
      return;
    }

    try {
      setSaving(true);
      const method = flowId ? "PUT" : "POST";
      const url = flowId ? `/api/whatsapp/flows/${flowId}` : "/api/flows";

      const payload = {
        ...flow,
        organization_id: organizationExternalId,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save flow");

      onSave();
    } catch (err) {
      console.error("Failed to save flow:", err);
      alert("Failed to save flow. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNode = () => {
    const newNode: FlowNode = {
      id: Date.now(),
      name: `Node ${nodes.length + 1}`,
      node_type: "TEXT",
      header_text_template_id: 0,
      backend_enabled: false,
      exit_enabled: false,
    };
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
  };

  const handleDeleteNode = (nodeId: number) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setEdges(edges.filter((e) => e.from_id !== nodeId && e.to_id !== nodeId));
    setSelectedNode(null);
  };

  const handleUpdateNode = (updatedNode: FlowNode) => {
    setNodes(nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
    setSelectedNode(updatedNode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading flow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold flex-1">
          {flowId ? "Edit Flow" : "Create New Flow"}
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Flow Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Flow Details</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Flow Name*</Label>
                <Input
                  id="name"
                  value={flow.name}
                  onChange={(e) => setFlow({ ...flow, name: e.target.value })}
                  placeholder="e.g., Order Tracking Bot"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={flow.description}
                  onChange={(e) =>
                    setFlow({ ...flow, description: e.target.value })
                  }
                  placeholder="Describe what this flow does..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Flow Type</Label>
                  <Select value={flow.type} onValueChange={(value) => setFlow({ ...flow, type: value })}>
                    <SelectTrigger id="type" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                      <SelectItem value="USSD">USSD</SelectItem>
                      <SelectItem value="TELEGRAM">Telegram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={flow.status} onValueChange={(value) => setFlow({ ...flow, status: value })}>
                    <SelectTrigger id="status" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* Nodes Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Flow Nodes ({nodes.length})</h3>
              <Button onClick={handleAddNode} size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Node
              </Button>
            </div>

            {nodes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-background/50 p-8 text-center">
                <p className="text-muted-foreground mb-3">
                  No nodes yet. Click "Add Node" to start building your flow.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedNode?.id === node.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-border hover:bg-background/50"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{node.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {node.node_type}
                      </p>
                    </div>
                    <Badge variant="outline">{node.node_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Node Editor */}
        <div className="space-y-4">
          {selectedNode ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Node</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="node-name">Node Name</Label>
                  <Input
                    id="node-name"
                    value={selectedNode.name}
                    onChange={(e) =>
                      handleUpdateNode({ ...selectedNode, name: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="node-type">Node Type</Label>
                  <Select
                    value={selectedNode.node_type}
                    onValueChange={(value) =>
                      handleUpdateNode({ ...selectedNode, node_type: value })
                    }
                  >
                    <SelectTrigger id="node-type" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Text Message</SelectItem>
                      <SelectItem value="LIST">List Selection</SelectItem>
                      <SelectItem value="ROUTE">Route/Branch</SelectItem>
                      <SelectItem value="NUMBER">Number Input</SelectItem>
                      <SelectItem value="API">API Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedNode.backend_enabled}
                      onChange={(e) =>
                        handleUpdateNode({
                          ...selectedNode,
                          backend_enabled: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">Backend Enabled</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedNode.exit_enabled}
                      onChange={(e) =>
                        handleUpdateNode({
                          ...selectedNode,
                          exit_enabled: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">Exit Enabled</span>
                  </label>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                Select a node to edit its properties
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button variant="outline" onClick={onBack} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSaveFlow} disabled={saving}>
          {saving ? "Saving..." : flowId ? "Update Flow" : "Create Flow"}
        </Button>
      </div>
    </div>
  );
}
