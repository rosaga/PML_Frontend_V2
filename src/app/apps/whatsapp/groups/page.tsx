"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Button } from "@/components/whatsapp/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/whatsapp/ui/table";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { useConfig } from "@/lib/whatsapp/config-context";
import { Loader2, Users, RefreshCw, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";

const PEAKDATA_BASE_URL = "https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2";

interface Group {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  contact_count: number;
  [key: string]: unknown;
}

function DeleteGroupModal({
  group,
  organizationExternalId,
  onClose,
  onDeleted,
}: {
  group: Group;
  organizationExternalId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const deleteUrl = `${PEAKDATA_BASE_URL}/organization/${organizationExternalId}/group/${group.id}`;

      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 204 || response.ok) {
        toast({ title: "Group deleted", description: `"${group.name}" has been removed.` });
        onDeleted();
        onClose();
      } else {
        const rawText = await response.text();
        const data = rawText ? JSON.parse(rawText) : {};
        throw new Error(data?.error?.message || data?.msg || "Failed to delete group");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete group",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      id="delete-group-modal"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black/30"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative p-4 w-full max-w-md">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center justify-between p-4 border-b rounded-t dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete group</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to delete <span className="font-medium">"{group.name}"</span>?
              {group.contact_count > 0 && (
                <> This group has {group.contact_count} contact{group.contact_count === 1 ? "" : "s"}, which will not be deleted — only the group itself.</>
              )}
            </p>
            <div className="flex space-x-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete group"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupsContent() {
  const router = useRouter();
  const { isConfigured, organizationExternalId } = useConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const pageSize = 10;

  const fetchGroups = async (page: number = 1) => {
    if (!isConfigured || !organizationExternalId) {
      return;
    }

    setLoading(true);
    try {
      const url = new URL("/api/whatsapp/peakdata/groups", window.location.origin);
      url.searchParams.append("organizationExternalId", organizationExternalId);
      url.searchParams.append("orderby", "created_at DESC");
      url.searchParams.append("page", page.toString());
      url.searchParams.append("size", pageSize.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token") || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }

      const data = await response.json();
      setGroups(data.data || []);
      setTotalCount(data.count || 0);
      setCurrentPage(page);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load groups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConfigured && organizationExternalId) {
      fetchGroups();
    }
  }, [isConfigured, organizationExternalId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "INACTIVE":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (!isConfigured) {
    return (
      <div className="min-h-screen">
        <Header
          title="Groups"
          description="View and manage your contact groups"
        />
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">Not Configured</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please configure your API settings to view groups.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Groups"
        description="View and manage your contact groups"
      />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Total Groups: {totalCount}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchGroups(currentPage)}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No Groups</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You don't have any groups yet.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Contacts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow
                      key={group.id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell
                        className="font-medium cursor-pointer"
                        onClick={() => router.push(`/groups/${group.id}`)}
                      >
                        {group.name}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground text-sm cursor-pointer"
                        onClick={() => router.push(`/groups/${group.id}`)}
                      >
                        {group.description || "-"}
                      </TableCell>
                      <TableCell
                        className="text-center cursor-pointer"
                        onClick={() => router.push(`/groups/${group.id}`)}
                      >
                        <Badge variant="outline">{group.contact_count}</Badge>
                      </TableCell>
                      <TableCell
                        className="cursor-pointer"
                        onClick={() => router.push(`/groups/${group.id}`)}
                      >
                        <Badge variant={getStatusBadgeVariant(group.status)}>
                          {group.status}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground cursor-pointer"
                        onClick={() => router.push(`/groups/${group.id}`)}
                      >
                        {formatDate(group.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGroupToDelete(group);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, totalCount)} of {totalCount} groups
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchGroups(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchGroups(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {groupToDelete && organizationExternalId && (
        <DeleteGroupModal
          group={groupToDelete}
          organizationExternalId={organizationExternalId}
          onClose={() => setGroupToDelete(null)}
          onDeleted={() => fetchGroups(currentPage)}
        />
      )}
    </div>
  );
}

export default function GroupsPage() {
  return (
    <DashboardLayout>
      <GroupsContent />
    </DashboardLayout>
  );
}