"use client";

import React, { useState, useEffect } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
import { useFlows } from "@/lib/whatsapp/use-flows";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { FLOWBOT_BASE_URL, flowbotHeaders } from "@/lib/whatsapp/flowbot-api";
import { getMetaFlows, type MetaFlow } from "@/lib/whatsapp/meta-flows-api";
import { Button } from "@/components/whatsapp/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { FlowCanvas } from "./flow-canvas";
import { NodeEditor } from "./node-editor";
import type { Edge, Node } from "reactflow";
import type { FlowNode } from "./flow-types";
import { isTerminalNodeType } from "./flow-types";
import { removeRouteOption, validateFlowGraph } from "./flow-validation";

interface FlowEditorProps {
  flowId?: number;
  onBack: () => void;
  initialTemplateNodes?: FlowNode[];
}

// Route edges come from option targets. Other edges come from parent links.
function buildEdgesFromNodes(nodeList: FlowNode[]): Edge[] {
  const result: Edge[] = [];
  nodeList.forEach((node) => {
    const nodeId = String(node.id);
    if (node.node_type === "ROUTE") {
      node.extra_data?.options?.forEach((option, index) => {
        const target = option.target_index == null ? undefined : nodeList[option.target_index];
        if (!target) return;

        const targetId = String(target.id);
        const sourceHandle = `route-${index}`;
        result.push({
          id: `edge-${nodeId}-${targetId}-${sourceHandle}`,
          source: nodeId,
          target: targetId,
          sourceHandle,
          type: "smoothstep",
          animated: false,
        });
      });
    }

    const parent = node.parent_index == null ? undefined : nodeList[node.parent_index];
    if (!parent || parent.node_type === "ROUTE") return;

    const parentId = String(parent.id);
    result.push({
      id: `edge-${parentId}-${nodeId}`,
      source: parentId,
      target: nodeId,
      type: "smoothstep",
      animated: false,
    });
  });
  return result;
}

export function FlowEditor({ flowId, onBack, initialTemplateNodes = [] }: FlowEditorProps) {
  const { organizationExternalId, organizationId } = useConfig();
  const { flows } = useFlows(organizationExternalId);
  const { toast } = useToast();
  const effectiveOrganizationId = organizationExternalId || organizationId;
  const [metaFlows, setMetaFlows] = useState<MetaFlow[]>([]);

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
      metaFlowId: node.extra_data?.meta_flow_id,
      metaFlowName: node.extra_data?.meta_flow_name,
      catalogueId: node.extra_data?.catalogue_id,
      catalogueName: node.extra_data?.catalogue_name,
    },
    position: node.extra_data?.position || { x: 100 + index * 280, y: 100 + (index % 3) * 160 },
    type: "flowNode",
  }));

  useEffect(() => {
    if (flowId) {
      fetchFlow();
    }
  }, [organizationExternalId, flowId]);

  useEffect(() => {
    if (!effectiveOrganizationId) return;
    const fetchMetaFlowsData = async () => {
      const result = await getMetaFlows(effectiveOrganizationId);
      if (result.success && result.data) {
        setMetaFlows(result.data.data.filter((metaFlow) => {
          const status = metaFlow.status?.toUpperCase();
          return isTerminalNodeType(metaFlow.type) && metaFlow.is_active !== false && (status === "ACTIVE" || status === "LIVE");
        }));
      }
    };
    fetchMetaFlowsData();
  }, [effectiveOrganizationId]);

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
    const issue = validateFlowGraph(nodes, edges, flow.type.toUpperCase() === "SMS");
    if (issue) {
      if (issue.nodeId) setSelectedNodeId(issue.nodeId);
      toast({ title: "Cannot save flow", description: issue.message, variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const fid = flowId;
      if (!fid) throw new Error("No flow ID — create the flow first");

      // Save nodes via batch endpoint
      {
        const now = new Date().toISOString();

        // edges state is the single source of truth — seeded on load, updated on canvas interaction
        const uniqueEdges = edges;

        // The batch API uses the first node as the start.
        const startIndex = nodes.findIndex((node) => !isTerminalNodeType(node.node_type));
        const orderedNodes = startIndex > 0
          ? [nodes[startIndex], ...nodes.slice(0, startIndex), ...nodes.slice(startIndex + 1)]
          : nodes;
        const nodesPayload = orderedNodes.map((n, nodeIndex) => {
          const isMetaFlowNode = n.node_type === "META_FLOW";
          const isCatalogueNode = n.node_type === "CATALOGUE";
          const isApiId = typeof n.id === "number" || (typeof n.id === "string" && /^\d+$/.test(n.id));
          const nodeStringId = String(n.id);

          // Route options carry their own targets. Give the direct parent the single parent_index slot.
          const incomingEdges = uniqueEdges.filter((e) => e.target === nodeStringId);
          const incomingEdge = incomingEdges.find((e) => !e.sourceHandle) ?? incomingEdges[0];
          let parentIndex: number | null = null;
          if (nodeIndex !== 0 && incomingEdge) {
            const foundIndex = orderedNodes.findIndex((t) => String(t.id) === incomingEdge.source);
            // Only set parentIndex if it's valid (>= 0), otherwise set to null
            parentIndex = foundIndex >= 0 ? foundIndex : null;
          }

          // Resolve target_index for LIST / ROUTE / BUTTONS options
          const outgoingEdges = uniqueEdges.filter((e) => e.source === nodeStringId);
          let resolvedOptions: { value: string; target_index: number | null }[] | undefined;
          if (n.node_type === "LIST" || n.node_type === "ROUTE" || n.node_type === "BUTTONS") {
            const rawOptions: { value: string; target_index: number | null }[] =
              n.extra_data?.options || [];
            resolvedOptions = rawOptions.map((opt, optIdx) => {
              let edge: Edge | undefined;
              if (n.node_type === "ROUTE") {
                // Each route option has its own handle "route-{optIdx}"
                edge = outgoingEdges.find((e) => e.sourceHandle === `route-${optIdx}`);
              } else {
                // LIST & BUTTONS: single source handle — all options point to the same downstream node
                edge = outgoingEdges[0];
              }
              const targetIdx = edge ? orderedNodes.findIndex((t) => String(t.id) === edge.target) : -1;
              return { ...opt, value: opt.value.trim(), target_index: targetIdx >= 0 ? targetIdx : null };
            });
          }

          // Build extra_data cleanly — never carry stale keys from the node object
          const extra_data: Record<string, any> = {
            position: n.extra_data?.position,
          };
          if (resolvedOptions !== undefined) {
            extra_data.options = resolvedOptions;
          }
          if (isMetaFlowNode) {
            extra_data.meta_flow_id = n.extra_data?.meta_flow_id;
            extra_data.meta_flow_name = n.extra_data?.meta_flow_name;
          }
          if (isCatalogueNode) {
            extra_data.catalogue_id = n.extra_data?.catalogue_id;
            extra_data.catalogue_name = n.extra_data?.catalogue_name;
            extra_data.catalogue_db_id = n.extra_data?.catalogue_db_id;
          }

          const base = {
            name: n.name,
            node_type: n.node_type,
            header_text_template: {
              language: n.header_text_template?.language || "en",
              text: n.header_text_template?.text || "",
            },
            backend_enabled: n.backend_enabled ?? false,
            exit_enabled: outgoingEdges.length === 0,
            extra_data,
            parent_index: parentIndex,
            created_at: n.created_at || now,
            updated_at: now,
            created_by: n.created_by || "",
            updated_by: "",
            ...(isMetaFlowNode ? { meta_flow_id: n.extra_data?.meta_flow_id } : {}),
          };
          return isApiId ? { ...base, id: Number(n.id) } : base;
        });

        const batchResponse = await fetch(`${FLOWBOT_BASE_URL}/nodes/batch`, {
          method: "POST",
          headers: flowbotHeaders,
          body: JSON.stringify({ flow_id: fid, nodes: nodesPayload }),
        });
        if (!batchResponse.ok) {
          const body = await batchResponse.json().catch(() => null);
          throw new Error(typeof body?.error === "string" ? body.error : "Failed to save nodes");
        }
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
        description: err instanceof Error ? err.message : "Failed to save flow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddNode = (type: string) => {
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      name: `New ${type} Node`,
      node_type: type as FlowNode["node_type"],
      header_text_template: { language: "en", text: type === "META_FLOW" ? "Open Meta Flow" : type === "CATALOGUE" ? "Browse our catalogue" : "Click to edit" },
      backend_enabled: false,
      exit_enabled: isTerminalNodeType(type),
      extra_data: { position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 } },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: "",
      updated_by: "",
    };
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    setSelectedNodeId(String(newNode.id));
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleNodeSave = (updatedNode: FlowNode, removedOptionIndex?: number) => {
    setNodes(nodes.map((node) => {
      if (String(node.id) !== selectedNodeId) return node;
      if (!isTerminalNodeType(updatedNode.node_type)) return updatedNode;

      return {
        ...updatedNode,
        backend_enabled: false,
        exit_enabled: true,
        extra_data: {
          ...updatedNode.extra_data,
          options: undefined,
        },
      };
    }));

    if (updatedNode.id !== undefined) {
      const nodeId = String(updatedNode.id);
      const previousType = nodes.find((node) => String(node.id) === nodeId)?.node_type;
      const routeTypeChanged = previousType !== updatedNode.node_type && (previousType === "ROUTE" || updatedNode.node_type === "ROUTE");
      if (isTerminalNodeType(updatedNode.node_type) || routeTypeChanged) {
        setEdges((current) => current.filter((edge) => edge.source !== nodeId));
      } else if (updatedNode.node_type === "ROUTE" && removedOptionIndex !== undefined) {
        setEdges((current) => removeRouteOption(current, nodeId, removedOptionIndex));
      }
    }
    return true;
  };

  const handleDeleteNodes = (nodeIds: string[]) => {
    const deleted = new Set(nodeIds);
    setNodes((current) => current.filter((node) => !deleted.has(String(node.id))));
    setEdges((current) => current.filter((edge) => !deleted.has(edge.source) && !deleted.has(edge.target)));
    setSelectedNodeId((current) => current && deleted.has(current) ? null : current);
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
            edges={edges}
            selectedNodeId={selectedNodeId}
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
            onDeleteNodes={handleDeleteNodes}
          />
        </div>
        <NodeEditor
          node={selectedNode}
          metaFlows={metaFlows}
          onSave={handleNodeSave}
          onDelete={() => selectedNodeId && handleDeleteNodes([selectedNodeId])}
        />
      </div>
    </div>
  );
}