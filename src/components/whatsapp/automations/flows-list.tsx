"use client";

import React, { useState, useEffect } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/whatsapp/ui/table";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Button } from "@/components/whatsapp/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/whatsapp/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";

interface Flow {
  id: number;
  name: string;
  description: string;
  status: string;
  type: string;
  created_at: string;
  created_by: string;
  updated_at: string;
}

interface FlowsListProps {
  onEditFlow: (flowId: number) => void;
}

export function FlowsList({ onEditFlow }: FlowsListProps) {
  const { organizationExternalId } = useConfig();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteFlowId, setDeleteFlowId] = useState<number | null>(null);

  useEffect(() => {
    if (organizationExternalId) {
      fetchFlows();
    }
  }, [organizationExternalId]);

  const fetchFlows = async () => {
    if (!organizationExternalId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `/api/whatsapp/flows?organization_id=${organizationExternalId}&size=50&page=1`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch flows");
      }
      const data = await response.json();
      setFlows(data.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load flows";
      setError(message);
      console.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlow = async () => {
    if (!deleteFlowId) return;

    try {
      const response = await fetch(`/api/whatsapp/flows/${deleteFlowId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete flow");
      }

      setFlows(flows.filter((f) => f.id !== deleteFlowId));
      console.log("Flow deleted successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete flow";
      console.error(message);
      alert(message);
    } finally {
      setDeleteFlowId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "ARCHIVED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading flows...</p>
        </div>
      </div>
    );
  }

  if (error && flows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-8 text-center">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchFlows}>Retry</Button>
      </div>
    );
  }

  if (flows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-background/50 p-12 text-center">
        <div className="mb-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-1">No flows yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first WhatsApp flow automation to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Flow Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-20 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flows.map((flow) => (
            <TableRow key={flow.id}>
              <TableCell className="font-medium">{flow.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {flow.description || "-"}
              </TableCell>
              <TableCell>
                <span className="text-sm">{flow.type || "Default"}</span>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(flow.status)}>
                  {flow.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(flow.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditFlow(flow.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteFlowId(flow.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteFlowId !== null} onOpenChange={(open) => !open && setDeleteFlowId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Flow</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this flow? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFlow} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
