"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/whatsapp/ui/card";
import { Badge } from "@/components/whatsapp/ui/badge";

interface Option {
  value: string;
  target_index: number | null;
}

interface FlowNodeData {
  label: string;
  type: string;
  headerText?: string;
  options?: Option[];
  selected?: boolean;
  onDelete?: () => void;
  onClick?: () => void;
}

const NODE_COLORS: Record<string, { card: string; badge: string }> = {
  TEXT:    { card: "bg-blue-50 border-blue-200",    badge: "bg-blue-100 text-blue-800" },
  LIST:    { card: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-800" },
  ROUTE:   { card: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-800" },
  NUMBER:  { card: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-800" },
  BUTTONS: { card: "bg-green-50 border-green-200",   badge: "bg-green-100 text-green-800" },
};

export function FlowNode({ data, selected }: NodeProps<FlowNodeData>) {
  const colors = NODE_COLORS[data.type] || { card: "bg-gray-50 border-gray-200", badge: "bg-gray-100 text-gray-800" };
  const isRoute = data.type === "ROUTE";
  const isButtons = data.type === "BUTTONS";
  const options = (data.options || []).filter((o) => o.value?.trim());

  return (
    <div className="cursor-pointer" onClick={data.onClick}>
      <Card
        className={`p-3 w-52 min-h-24 flex flex-col justify-between border-2 transition-all ${colors.card} ${
          selected ? "border-black shadow-lg" : ""
        }`}
      >
        <div className="space-y-2">
          <Badge variant="secondary" className={`text-xs ${colors.badge}`}>
            {data.type}
          </Badge>
          <div className="font-semibold text-sm line-clamp-1">{data.label}</div>
          {data.headerText && (
            <div className="text-xs text-muted-foreground line-clamp-2 italic">
              {data.headerText}
            </div>
          )}

          {/* LIST: show bullet options */}
          {data.type === "LIST" && options.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
              {options.slice(0, 4).map((opt, i) => (
                <li key={i} className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-800 text-[10px] flex items-center justify-center font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="line-clamp-1">{opt.value}</span>
                </li>
              ))}
              {options.length > 4 && (
                <li className="text-[10px] text-muted-foreground">+{options.length - 4} more</li>
              )}
            </ul>
          )}

          {/* ROUTE: show options as branches */}
          {isRoute && options.length > 0 && (
            <div className="space-y-1 mt-1">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1 text-xs">
                  <span className="w-4 h-4 rounded bg-orange-200 text-orange-800 text-[10px] flex items-center justify-center font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="line-clamp-1 text-muted-foreground">{opt.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* BUTTONS: show WhatsApp-style button chips */}
          {isButtons && options.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              {options.slice(0, 3).map((opt, i) => (
                <div
                  key={i}
                  className="text-xs text-center border border-green-400 text-green-700 rounded-md px-2 py-0.5 bg-white font-medium line-clamp-1"
                >
                  {opt.value}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Target handle — top */}
      <Handle type="target" position={Position.Top} />

      {/* LIST: single source handle (LIST has only one child) */}
      {data.type === "LIST" && <Handle type="source" position={Position.Bottom} />}

      {/* ROUTE: one source handle per option, spread along bottom */}
      {isRoute && options.length > 0 ? (
        options.map((opt, i, arr) => {
          const pct = arr.length === 1 ? 50 : (i / (arr.length - 1)) * 100;
          return (
            <div key={`route-${i}`} style={{ position: "relative", width: "100%" }}>
              <Handle
                type="source"
                position={Position.Bottom}
                id={`route-${i}`}
                style={{ left: `${pct}%` }}
                title={opt.value}
              />
              {/* Show option number label below handle */}
              <div
                style={{
                  position: "absolute",
                  left: `${pct}%`,
                  top: "8px",
                  transform: "translateX(-50%)",
                  fontSize: "10px",
                  fontWeight: "bold",
                  backgroundColor: "rgb(254, 215, 170)",
                  color: "rgb(154, 52, 18)",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                {i + 1}
              </div>
            </div>
          );
        })
      ) : !data.type?.includes("LIST") && !isButtons ? (
        <Handle type="source" position={Position.Bottom} />
      ) : isButtons ? (
        <Handle type="source" position={Position.Bottom} />
      ) : null}
    </div>
  );
}
