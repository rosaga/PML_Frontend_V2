"use client";

import React from "react";
import { useToast } from "@/hooks/whatsapp/use-toast";
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
import { Trash2, Plus, X } from "lucide-react";
import type { FlowNode } from "./flow-types";

interface NodeEditorProps {
  node: FlowNode | null;
  onSave?: (node: FlowNode) => void;
  onDelete?: () => void;
}

export function NodeEditor({ node, onSave, onDelete }: NodeEditorProps) {
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<FlowNode>(
    node || {
      name: "New Node",
      node_type: "TEXT",
      header_text_template: { language: "en", text: "" },
      backend_enabled: false,
      exit_enabled: false,
      extra_data: {},
    }
  );

  React.useEffect(() => {
    if (node) {
      setFormData(node);
    }
  }, [node]);

  // Update field and immediately propagate to canvas
  const updateField = (updated: FlowNode) => {
    setFormData(updated);
    onSave?.(updated);
  };

  type Option = { value: string; target_index: number | null };

  // Shared options helper for LIST and ROUTE
  const options: Option[] = formData.extra_data?.options || [{ value: "", target_index: null }];
  const setOptions = (opts: Option[]) =>
    updateField({ ...formData, extra_data: { ...formData.extra_data, options: opts } });

  if (!node) {
    return (
      <div className="w-72 p-4 border-l bg-muted/50 flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Select a node to edit</p>
      </div>
    );
  }

  return (
    <div className="w-72 p-4 border-l bg-muted/50 overflow-y-auto h-full space-y-4">
      {/* Node Name */}
      <div className="space-y-1.5">
        <Label>Node Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => updateField({ ...formData, name: e.target.value })}
          placeholder="Node name"
        />
      </div>

      {/* Node Type */}
      <div className="space-y-1.5">
        <Label>Node Type</Label>
        <Select
          value={formData.node_type}
          onValueChange={(value) =>
            updateField({ ...formData, node_type: value as FlowNode["node_type"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEXT">Text</SelectItem>
            <SelectItem value="LIST">List</SelectItem>
            <SelectItem value="ROUTE">Route</SelectItem>
            <SelectItem value="NUMBER">Number</SelectItem>
            <SelectItem value="BUTTONS">Buttons</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Message Text */}
      <div className="space-y-1.5">
        <Label>Message Text</Label>
        <Textarea
          value={formData.header_text_template.text}
          onChange={(e) =>
            updateField({
              ...formData,
              header_text_template: { ...formData.header_text_template, text: e.target.value },
            })
          }
          placeholder="Enter message text"
          rows={3}
        />
      </div>

      {/* LIST / ROUTE / BUTTONS: shared options editor */}
      {(formData.node_type === "LIST" || formData.node_type === "ROUTE" || formData.node_type === "BUTTONS") && (
        <div className="space-y-1.5">
          <Label>
            {formData.node_type === "LIST" ? "List Options" : formData.node_type === "BUTTONS" ? "Button Labels" : "Route Options"}
          </Label>
          <p className="text-xs text-muted-foreground">
            {formData.node_type === "LIST"
              ? "Each option becomes a selectable item for the user."
              : formData.node_type === "BUTTONS"
              ? "Up to 3 buttons. Each button gets its own connection point on the canvas."
              : "Each option gets its own connection point. Draw edges from each to a downstream node."}
          </p>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                <div className="flex-1 relative">
                  <Input
                    value={opt.value}
                    onChange={(e) => {
                      const updated = [...options];
                      const maxLength = formData.node_type === "BUTTONS" ? 19 : 24;
                      updated[i] = { ...updated[i], value: e.target.value.slice(0, maxLength) };
                      setOptions(updated);
                    }}
                    maxLength={formData.node_type === "BUTTONS" ? 19 : 24}
                    placeholder={`Option ${i + 1}`}
                    className="h-7 text-sm"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    {opt.value.length}/{formData.node_type === "BUTTONS" ? 19 : 24}
                  </span>
                </div>
                <button
                  onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Remove option"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs gap-1"
              disabled={formData.node_type === "BUTTONS" && options.length >= 3}
              onClick={() => setOptions([...options, { value: "", target_index: null }])}
            >
              <Plus className="w-3 h-3" />
              {formData.node_type === "BUTTONS" && options.length >= 3 ? "Max 3 buttons" : "Add Option"}
            </Button>
          </div>
        </div>
      )}



      {/* Delete */}
      <div className="pt-2">
        <Button size="sm" variant="destructive" onClick={onDelete} className="gap-2 w-full">
          <Trash2 className="w-4 h-4" />
          Delete Node
        </Button>
      </div>
    </div>
  );
}
