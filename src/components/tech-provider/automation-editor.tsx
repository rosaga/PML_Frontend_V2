"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import type { Edge, Node } from "reactflow";
import { FlowCanvas } from "@/components/whatsapp/automations/flow-canvas";
import { NodeEditor } from "@/components/whatsapp/automations/node-editor";
import type { FlowNode } from "@/components/whatsapp/automations/flow-types";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Field, PendingButton } from "./preview-ui";

export function AutomationEditor({ onBack }: { onBack: () => void }) {
  const sequence = useRef(0);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const canvasNodes: Node[] = nodes.map((node, index) => ({
    id: String(node.id), type: "flowNode",
    position: node.extra_data.position || { x: 80 + index * 260, y: 80 },
    data: { label: node.name, type: node.node_type, headerText: node.header_text_template.text, options: node.extra_data.options },
  }));
  const deleteNode = (id: string) => {
    setNodes((previous) => previous.filter((node) => String(node.id) !== id));
    setEdges((previous) => previous.filter((edge) => edge.source !== id && edge.target !== id));
    setSelected(null);
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" />Back to Flows</Button><PendingButton><Save className="h-4 w-4" />Save Flow</PendingButton></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Flow Name"><Input aria-label="Flow Name" placeholder="Enter flow name" /></Field><Field label="Description"><Input aria-label="Flow Description" placeholder="Describe this automation" /></Field></div>
    <p className="text-sm text-muted-foreground">Explore the flow builder. Changes stay in this editor until you leave; saving is coming soon.</p>
    <div className="grid overflow-hidden rounded-lg border bg-card xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="h-[580px] min-w-0"><FlowCanvas nodes={canvasNodes} edges={edges} onEdgesChange={setEdges} onNodeSelect={setSelected}
        onNodesChange={(updated) => setNodes((previous) => previous.map((node) => ({ ...node, extra_data: { ...node.extra_data, position: updated.find((item) => item.id === String(node.id))?.position || node.extra_data.position } })))}
        onAddNode={(type) => {
          const id = `preview-node-${++sequence.current}`;
          setNodes((previous) => [...previous, { id, name: `New ${type.toLowerCase()} node`, node_type: type as FlowNode["node_type"], header_text_template: { language: "en", text: "" }, backend_enabled: false, exit_enabled: false, extra_data: { position: { x: 80 + previous.length * 240, y: 80 } } }]);
          setSelected(id);
        }} />
      </div>
      <div className="max-h-[580px] overflow-y-auto border-t p-4 xl:border-l xl:border-t-0"><NodeEditor node={nodes.find((node) => String(node.id) === selected) || null} onSave={(updated) => setNodes((previous) => previous.map((node) => node.id === updated.id ? updated : node))} onDelete={() => { if (selected) deleteNode(selected); }} /></div>
    </div>
  </div>;
}
