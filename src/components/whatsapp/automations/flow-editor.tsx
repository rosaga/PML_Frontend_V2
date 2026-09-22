"use client";

import React, { useState, useEffect } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
import { useFlows } from "@/lib/whatsapp/use-flows";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { FLOWBOT_BASE_URL, flowbotHeaders } from "@/lib/whatsapp/flowbot-api";
import { Button } from "@/components/whatsapp/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { FlowCanvas } from "./flow-canvas";
import { NodeEditor } from "./node-editor";
import type { Edge, Node } from "reactflow";
import type { FlowNode } from "./flow-types";

interface FlowEditorProps {
  flowId?: number;
  onBack: () => void;
  initialTemplateNodes?: FlowNode[];
}

// Build React Flow edges from a node list using parent_index and options[].target_index.
// For ROUTE nodes, each child node gets the correct sourceHandle ("route-{optIdx}") by
// matching its position in the parent's options array via target_index.
function buildEdgesFromNodes(nodeList: FlowNode[]): Edge[] {
  const result: Edge[] = [];
  nodeList.forEach((n, nodeIdx) => {
    if (n.parent_index === null || n.parent_index === undefined) return;
    const parentNode = nodeList[n.parent_index];
    if (!parentNode) return;
    const sourceId = String(parentNode.id);
    const targetId = String(n.id);

    if (parentNode.node_type === "ROUTE") {
      // Find which option index on the parent points to this node
      const optIdx = (parentNode.extra_data?.options || []).findIndex(
        (opt: { target_index: number | null }) => opt.target_index === nodeIdx
      );
      const sourceHandle = optIdx >= 0 ? `route-${optIdx}` : "route-0";
      result.push({
        id: `edge-${sourceId}-${targetId}-${sourceHandle}`,
        source: sourceId,
        target: targetId,
        sourceHandle,
        type: "smoothstep",
        animated: false,
      });
    } else {
      result.push({
        id: `edge-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        type: "smoothstep",
        animated: false,
      });
    }
  });
  return result;
}

export function FlowEditor({ flowId, onBack, initialTemplateNodes = [] }: FlowEditorProps) {
  const { organizationExternalId } = useConfig();
  const { flows } = useFlows(organizationExternalId);
  const { toast } = useToast();

  const [flow, setFlow] = useState({
    name: "",
    description: "",
    type: "WHATSAPP",
    status: "DRAFT",
  });

  // Generate stable local IDs once — must be identical for both nodes and edges
  // so that edge source/target references resolve correctly when saving.
  const templateNodeIds = initialTemplateNodes.map((n, i) => n.id ?? `node-template-${i}`);

  const [nodes, setNodes] = useState<FlowNode[]>(() =>
    initialTemplateNodes.map((n, i) => ({ ...n, id: templateNodeIds[i] }))
  );

  const [edges, setEdges] = useState<Edge[]>(() =>
    buildEdgesFromNodes(
      initialTemplateNodes.map((n, i) => ({ ...n, id: templateNodeIds[i] }))
    )
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!flowId);
  const [saving, setSaving] = useState(false);

  // Convert nodes to React Flow format — every node guaranteed to have an id
  const reactFlowNodes: Node[] = nodes.map((node, index) => ({
    id: String(node.id),
    data: {
      label: node.name,
      type: node.node_type,
      headerText: node.header_text_template?.text || "",
      options: node.extra_data?.options || [],
    },
    position: node.extra_data?.position || { x: 100 + index * 280, y: 100 + (index % 3) * 160 },
    type: "flowNode",
  }));

  // Derive edges from parent_index — each node with a parent_index connects from that parent
  const reactFlowEdges: Edge[] = nodes
    .filter((node) => node.parent_index !== undefined && node.parent_index !== null)
    .map((node) => {
      const parentNode = nodes[node.parent_index!];
      if (!parentNode) return null;
      const sourceId = String(parentNode.id);
      const targetId = String(node.id);
      return {
        id: `edge-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        type: "smoothstep",
        animated: false,
      };
    })
    .filter(Boolean) as Edge[];

  useEffect(() => {
    if (flowId) {
      fetchFlow();
    }
  }, [organizationExternalId, flowId]);

  const fetchFlow = async () => {
    if (!flowId) return;
    try {
      setLoading(true);

      // Use list endpoint with eq__id — no single-flow endpoint exists
      const flowResponse = await fetch(`${FLOWBOT_BASE_URL}/flows?eq__id=${flowId}`, { headers: flowbotHeaders });
      if (!flowResponse.ok) throw new Error(`Flow fetch failed: ${flowResponse.status}`);
      const flowData = await flowResponse.json();
      const flowItem = (flowData.results || [])[0];
      if (!flowItem) throw new Error("Flow not found");

      setFlow({
        name: flowItem.name,
        description: flowItem.description || "",
        type: flowItem.type,
        status: flowItem.status,
      });

      // Skip fetching nodes when template nodes were provided — the flow was just
      // created and the API will return empty; template nodes are already in state.
      if (initialTemplateNodes.length === 0) {
        try {
          const nodesResponse = await fetch(`${FLOWBOT_BASE_URL}/flows/${flowId}/linked-nodes`, { headers: flowbotHeaders });
          if (nodesResponse.ok) {
            const nodesData = await nodesResponse.json();
            const nodeList: FlowNode[] = nodesData.nodes || nodesData || [];
            setNodes(nodeList);
            setEdges(buildEdgesFromNodes(nodeList));
          }
        } catch (nodesErr) {
          console.error("[v0] Could not load nodes:", nodesErr);
          setNodes([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch flow:", err);
      alert("Failed to load flow. Please try again.");
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
    try {
      setSaving(true);
      const fid = flowId;
      if (!fid) throw new Error("No flow ID — create the flow first");

      if (nodes.length === 0) {
        alert("Please add at least one node before saving.");
        setSaving(false);
        return;
      }

      // Validate that LIST, ROUTE, and BUTTONS nodes have options
      for (const node of nodes) {
        if (["LIST", "ROUTE", "BUTTONS"].includes(node.node_type)) {
          const options = node.extra_data?.options || [];
          if (options.length === 0) {
            toast({
              title: "Validation Error",
              description: `${node.node_type} node "${node.name}" must have at least one option.`,
              variant: "destructive",
            });
            setSaving(false);
            return;
          }
        }
      }

      // Save nodes via batch endpoint
      {
        const now = new Date().toISOString();

        // edges state is the single source of truth — seeded on load, updated on canvas interaction
        const uniqueEdges = edges;

        const lastIndex = nodes.length - 1;

        const nodesPayload = nodes.map((n, nodeIndex) => {
          const isLastNode = nodeIndex === lastIndex;
          const isApiId = typeof n.id === "number" || (typeof n.id === "string" && /^\d+$/.test(n.id));
          const nodeStringId = String(n.id);

          // Derive parent_index from edges: find any edge whose target is this node
          const incomingEdge = uniqueEdges.find((e) => e.target === nodeStringId);
          let parentIndex: number | null = null;
          if (incomingEdge) {
            const foundIndex = nodes.findIndex((t) => String(t.id) === incomingEdge.source);
            // Only set parentIndex if it's valid (>= 0), otherwise set to null
            parentIndex = foundIndex >= 0 ? foundIndex : null;
          }

          // Resolve target_index for LIST / ROUTE / BUTTONS options
          let resolvedOptions: { value: string; target_index: number | null }[] | undefined;
          if (!isLastNode && (n.node_type === "LIST" || n.node_type === "ROUTE" || n.node_type === "BUTTONS")) {
            const rawOptions: { value: string; target_index: number | null }[] =
              n.extra_data?.options || [];
            const outgoingEdges = uniqueEdges.filter((e) => e.source === nodeStringId);

            resolvedOptions = rawOptions.map((opt, optIdx) => {
              let edge: Edge | undefined;
              if (n.node_type === "ROUTE") {
                // Each route option has its own handle "route-{optIdx}"
                edge = outgoingEdges.find((e) => e.sourceHandle === `route-${optIdx}`);
              } else {
                // LIST & BUTTONS: single source handle — all options point to the same downstream node
                edge = outgoingEdges[0];
              }
              if (!edge) return { ...opt, target_index: null };
              const targetIdx = nodes.findIndex((t) => String(t.id) === edge!.target);
              return { ...opt, target_index: targetIdx >= 0 ? targetIdx : null };
            });
          }

          // Build extra_data cleanly — never carry stale keys from the node object
          const extra_data: Record<string, any> = {
            position: n.extra_data?.position,
          };
          // Include options for non-last LIST/ROUTE nodes only
          if (!isLastNode && resolvedOptions !== undefined) {
            extra_data.options = resolvedOptions;
          }

          const base = {
            name: n.name,
            node_type: n.node_type,
            header_text_template: {
              language: n.header_text_template?.language || "en",
              text: n.header_text_template?.text || "",
            },
            backend_enabled: n.backend_enabled ?? false,
            exit_enabled: isLastNode ? true : (n.exit_enabled ?? false),
            extra_data,
            parent_index: parentIndex,
            created_at: n.created_at || now,
            updated_at: now,
            created_by: n.created_by || "",
            updated_by: "",
          };
          return isApiId ? { ...base, id: Number(n.id) } : base;
        });

        const batchResponse = await fetch(`${FLOWBOT_BASE_URL}/nodes/batch`, {
          method: "POST",
          headers: flowbotHeaders,
          body: JSON.stringify({ flow_id: fid, nodes: nodesPayload }),
        });
        if (!batchResponse.ok) throw new Error("Failed to save nodes");
      }

      setSaving(false);
      toast({
        title: "Success",
        description: "Flow saved successfully",
      });
      onBack();
    } catch (err) {
      console.error("[v0] Save failed:", err);
      setSaving(false);
      toast({
        title: "Error",
        description: "Failed to save flow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddNode = (type: string) => {
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      name: `New ${type} Node`,
      node_type: type as "TEXT" | "LIST" | "ROUTE" | "NUMBER" | "BUTTONS",
      header_text_template: { language: "en", text: "Click to edit" },
      backend_enabled: false,
      exit_enabled: false,
      extra_data: { position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 } },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: "",
      updated_by: "",
    };
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    setSelectedNodeId(String(newNode.id!));
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleNodeSave = (updatedNode: FlowNode) => {
    setNodes(nodes.map((node) => String(node.id) === selectedNodeId ? updatedNode : node));
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter((node) => String(node.id) !== nodeId));
    setSelectedNodeId(null);
  };

  const selectedNode = nodes.find((n) => String(n.id) === selectedNodeId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading flow...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-semibold text-base">{flow.name || "Untitled Flow"}</h1>
        </div>
        <Button onClick={handleSaveFlow} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Flow"}
        </Button>
      </div>

      {/* Canvas — full height, no tabs */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          <FlowCanvas
            nodes={reactFlowNodes}
            edges={[...reactFlowEdges, ...edges]}
            onNodesChange={(newNodes) => {
              const updatedNodes = nodes.map((node) => {
                const newNode = newNodes.find((n) => n.id === String(node.id));
                if (newNode) {
                  return { ...node, extra_data: { ...node.extra_data, position: newNode.position } };
                }
                return node;
              });
              setNodes(updatedNodes);
            }}
            onEdgesChange={(newEdges) => setEdges(newEdges)}
            onNodeSelect={handleNodeSelect}
            onAddNode={handleAddNode}
            onDeleteNode={handleDeleteNode}
          />
        </div>
        <NodeEditor
          node={selectedNode}
          onSave={handleNodeSave}
          onDelete={() => selectedNodeId && handleDeleteNode(selectedNodeId)}
        />
      </div>
    </div>
  );
}
