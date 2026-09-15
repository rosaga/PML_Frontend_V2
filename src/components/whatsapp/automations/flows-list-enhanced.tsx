"use client";

import React, { useState } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
import { useFlows } from "@/lib/whatsapp/use-flows";
import { FLOWBOT_BASE_URL, flowbotHeaders } from "@/lib/whatsapp/flowbot-api";
import { CreateFlowDialog } from "./create-flow-dialog";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/whatsapp/ui/table";
import { Badge } from "@/components/whatsapp/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/whatsapp/ui/alert-dialog";
import { Edit, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/whatsapp/ui/card";

interface FlowsListProps {
  onEditFlow: (flowId: number, templateNodes?: any[]) => void;
  onCreateFlow: () => void;
}

export function FlowsListComponent({
  onEditFlow,
  onCreateFlow,
}: FlowsListProps) {
  const { organizationExternalId } = useConfig();
  const { flows, loading, error, setFlows } = useFlows(organizationExternalId);
  const [deleteFlowId, setDeleteFlowId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleFlowCreated = (flowId: number, templateNodes: any[]) => {
    onEditFlow(flowId, templateNodes);
  };

  const handleDelete = async (flowId: number) => {
    try {
      const response = await fetch(`${FLOWBOT_BASE_URL}/flows/${flowId}/deactivate`, {
        method: "PUT",
        headers: flowbotHeaders,
      });
      if (!response.ok) throw new Error("Failed to deactivate flow");
      setFlows(flows.filter((f) => f.id !== flowId));
      setDeleteFlowId(null);
    } catch (err) {
      console.error("Failed to deactivate flow:", err);
      alert("Failed to deactivate flow");
    }
  };

  const filteredFlows = flows.filter((flow) =>
    flow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filteredFlows.length / PAGE_SIZE) || 1;
  const pagedFlows = filteredFlows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search flows..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Flow
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 text-red-900 border-red-200">
          {error}
        </Card>
      )}

      {loading ? (
        <Card className="p-8 text-center">Loading flows...</Card>
      ) : filteredFlows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No flows found</p>
          <Button onClick={onCreateFlow}>Create your first flow</Button>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedFlows.map((flow) => (
              <TableRow key={flow.id}>
                <TableCell className="font-medium">{flow.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {flow.description || "—"}
                </TableCell>
                <TableCell>{flow.type}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(flow.status)}>
                    {flow.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {flow.updated_at
                    ? new Date(flow.updated_at).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditFlow(flow.id)}
                    className="gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteFlowId(flow.id)}
                    className="gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredFlows.length)} of {filteredFlows.length} flows
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={deleteFlowId !== null}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Flow</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this flow? This action cannot be
            undone.
          </AlertDialogDescription>
          <div className="flex gap-4">
            <AlertDialogCancel onClick={() => setDeleteFlowId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteFlowId && handleDelete(deleteFlowId)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <CreateFlowDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onFlowCreated={handleFlowCreated}
      />
    </div>
  );
}
