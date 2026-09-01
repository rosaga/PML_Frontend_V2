"use client";

import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  applyEdgeChanges,
  EdgeChange,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  NodeChange,
  applyNodeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { FlowNode } from "./flow-node";
import { Button } from "@/components/whatsapp/ui/button";
import { Plus } from "lucide-react";

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeSelect?: (nodeId: string) => void;
  onAddNode?: (type: string) => void;
  onDeleteNode?: (nodeId: string) => void;
}

export function FlowCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
  onAddNode,
  onDeleteNode,
}: FlowCanvasProps) {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  const nodeTypes = useMemo<NodeTypes>(() => ({ flowNode: FlowNode }), []);

  // Sync ALL node data (label, headerText, type) whenever parent updates
  React.useEffect(() => {
    setNodes(initialNodes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialNodes.map((n) => ({ id: n.id, data: n.data })))]);

  // Sync edges when parent updates (new connections, derived edges)
  React.useEffect(() => {
    setEdges(initialEdges);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialEdges.map((e) => e.id))]);

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, edges);
      setEdges(updated);
      onEdgesChange(updated);
    },
    [edges, setEdges, onEdgesChange]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge(
        {
          ...connection,
          type: "smoothstep",
          data: { index: edges.filter(e => e.source === connection.source).length }
        },
        edges
      );
      setEdges(newEdges);
      onEdgesChange(newEdges);
    },
    [edges, setEdges, onEdgesChange]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, nodes);
      setNodes(updated);
      // Propagate position changes back to parent
      const positionChanges = changes.filter((c) => c.type === "position" && c.position);
      if (positionChanges.length > 0) {
        onNodesChange(updated);
      }
    },
    [nodes, setNodes, onNodesChange]
  );

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    onNodeSelect?.(nodeId);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <div className="flex items-center gap-2 p-4 border-b flex-wrap">
        <div className="text-sm text-muted-foreground mr-2">Add node:</div>
        <div className="flex gap-2 flex-wrap">
          {["TEXT", "LIST", "ROUTE", "NUMBER", "BUTTONS"].map((type) => (
            <Button
              key={type}
              size="sm"
              variant="outline"
              onClick={() => onAddNode?.(type)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {type}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative" style={{ minHeight: 400 }}>
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            type: "flowNode",
            selected: node.id === selectedNodeId,
          }))}
          edges={edges.map((edge) => {
            // Extract route option number from sourceHandle (e.g., "route-0" -> "1")
            const isRouteEdge = edge.sourceHandle?.startsWith("route-");
            const optionNum = isRouteEdge ? parseInt(edge.sourceHandle!.split("-")[1]) + 1 : null;
            
            return {
              ...edge,
              type: "smoothstep",
              label: optionNum ? `Option ${optionNum}` : undefined,
              labelStyle: optionNum ? {
                backgroundColor: "rgba(254, 215, 170, 0.9)",
                color: "rgb(154, 52, 18)",
                border: "1px solid rgb(254, 215, 170)",
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "10px",
                fontWeight: "bold",
              } : undefined,
            };
          })}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => handleNodeClick(node.id)}
          nodeTypes={nodeTypes}
          fitView={nodes.length > 0}
        >
          <Background />
          <Controls />
          <MiniMap />
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Canvas is empty</p>
                <p className="text-muted-foreground text-xs">Use the buttons above to add your first node</p>
              </div>
            </div>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}
