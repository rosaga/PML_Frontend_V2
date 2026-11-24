import type { Edge } from "reactflow";
import type { FlowNode } from "./flow-types";
import { isTerminalNodeType } from "./flow-types";

interface ConnectionNode {
  id: string;
  name: string;
  type: FlowNode["node_type"];
  optionCount: number;
}

export function routeOptionIndex(handle?: string | null): number | undefined {
  if (!handle || !/^route-(0|[1-9]\d*)$/.test(handle)) return undefined;
  return Number(handle.slice("route-".length));
}

export function removeRouteOption(edges: Edge[], nodeId: string, removedIndex: number): Edge[] {
  return edges.flatMap((edge) => {
    const index = edge.source === nodeId ? routeOptionIndex(edge.sourceHandle) : undefined;
    if (index === undefined || index < removedIndex) return [edge];
    if (index === removedIndex) return [];
    return [{ ...edge, sourceHandle: `route-${index - 1}` }];
  });
}

export function connectionError(
  source: ConnectionNode,
  target: ConnectionNode,
  sourceHandle: string | null | undefined,
  startId: string,
  edges: Edge[],
): string | undefined {
  if (isTerminalNodeType(source.type)) return `“${source.name}” ends the flow and cannot have an outgoing connection.`;

  if (source.type === "ROUTE") {
    const option = routeOptionIndex(sourceHandle);
    if (option === undefined || option >= source.optionCount) {
      return `Connect from an existing option on “${source.name}”.`;
    }
    if (edges.some((edge) => edge.source === source.id && edge.sourceHandle === sourceHandle)) {
      return `Option ${option + 1} on “${source.name}” has more than one destination.`;
    }
    return;
  }

  if (sourceHandle) return `Reconnect the output on “${source.name}”.`;
  if (source.id === target.id) return `“${source.name}” cannot connect its single output to itself.`;
  if (target.id === startId) return `Use a route option to connect back to the start node “${target.name}”.`;
  if (edges.some((edge) => edge.source === source.id)) {
    return `“${source.name}” has a single output. Remove its existing connection before adding another.`;
  }
  if (edges.some((edge) => edge.target === target.id && !edge.sourceHandle)) {
    return `“${target.name}” already has a direct parent. Connect from a route option or remove the existing direct connection.`;
  }
}

export function validateFlowGraph(nodes: FlowNode[], edges: Edge[], isSMS: boolean) {
  const start = nodes.find((node) => !isTerminalNodeType(node.node_type)) ?? nodes[0];
  if (!start) return { message: "Add at least one node." };
  const startId = String(start.id);
  const byId = new Map(nodes.map((node) => [String(node.id), node]));
  const checked: Edge[] = [];
  const outgoing = new Map<string, Edge[]>();
  for (const edge of edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) return { message: "Remove the connection to the missing node." };
    const describe = (node: FlowNode) => ({
      id: String(node.id), name: node.name, type: node.node_type,
      optionCount: node.extra_data?.options?.length ?? 0,
    });
    const message = connectionError(describe(source), describe(target), edge.sourceHandle, startId, checked);
    if (message) return { nodeId: edge.source, message };
    checked.push(edge);
    const nodeEdges = outgoing.get(edge.source) ?? [];
    nodeEdges.push(edge);
    outgoing.set(edge.source, nodeEdges);
  }

  for (const node of nodes) {
    const nodeId = String(node.id);
    const nodeEdges = outgoing.get(nodeId) ?? [];
    if (isSMS && isTerminalNodeType(node.node_type)) {
      return { nodeId, message: `“${node.name}” uses a node type that SMS cannot send.` };
    }
    if (isSMS && !node.header_text_template?.text?.trim()) {
      return { nodeId, message: `Enter the SMS message for “${node.name}”.` };
    }
    if (!["LIST", "ROUTE", "BUTTONS"].includes(node.node_type)) continue;
    const options = node.extra_data?.options ?? [];
    if (!options.length) return { nodeId, message: `Add at least one option to “${node.name}”.` };
    const labels = new Set<string>();
    for (let index = 0; index < options.length; index++) {
      const option = options[index];
      const label = option.value.trim().toLowerCase();
      if (!label) return { nodeId, message: `Enter a label for option ${index + 1} on “${node.name}”.` };
      if (labels.has(label)) return { nodeId, message: `Use a unique label for option ${index + 1} on “${node.name}”.` };
      labels.add(label);
      if (node.node_type === "ROUTE" && !nodeEdges.some((edge) => routeOptionIndex(edge.sourceHandle) === index)) {
        return { nodeId, message: `Connect option ${index + 1} (“${option.value}”) on “${node.name}” to a node.` };
      }
    }
    if (isSMS && !nodeEdges.length) return { nodeId, message: `Connect “${node.name}” to a node so SMS replies can continue.` };
  }

  const reachable = new Set([startId]);
  reachable.forEach((nodeId) => {
    for (const edge of outgoing.get(nodeId) ?? []) reachable.add(edge.target);
  });
  const disconnected = nodes.find((node) => !reachable.has(String(node.id)));
  if (disconnected) {
    return { nodeId: String(disconnected.id), message: `Connect “${disconnected.name}” to the flow starting at “${start.name}”.` };
  }
}
