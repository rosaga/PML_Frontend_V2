"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Plus, Trash2, Users, X } from "lucide-react";
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

const PEAKDATA_BASE_URL = "https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2";

interface ContactDetails {
  id: number;
  mobile_no?: string;
  first_name?: string;
  last_name?: string;
  label?: string;
  status?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

interface GroupContact extends ContactDetails {
  contact?: ContactDetails;
  status_id?: string;
}

// ---------------------------------------------------------------------------
// Add Contact to Group Modal
// ---------------------------------------------------------------------------

interface AddContactToGroupModalProps {
  groupId: string;
  organizationExternalId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AddContactToGroupModal({
  groupId,
  organizationExternalId,
  onClose,
  onSuccess,
}: AddContactToGroupModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const url = new URL(`/api/whatsapp/peakdata/groups/${groupId}/contacts`, window.location.origin);
      url.searchParams.set("organizationExternalId", organizationExternalId);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token") || "",
        },
        body: JSON.stringify({
          mobile_no: phoneNumber,
          metadata: {
            FIRSTNAME: firstName,
            LASTNAME: lastName,
          },
        }),
      });

      // Read as text first — some successful responses (201/204) come back
      // with an empty body, and calling response.json() directly on an
      // empty body throws "Unexpected end of JSON input".
      const rawText = await response.text();
      const data = rawText ? JSON.parse(rawText) : {};

      if (response.status === 201 || response.status === 200 || response.status === 204) {
        setSuccessMessage(`Contact ${phoneNumber} has been added to the group`);
      } else if (response.status === 400) {
        setErrorMessage(data?.error?.message || "Contact already exists in this group.");
      } else {
        throw new Error(data?.error?.message || "Failed to add contact to group");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessMessage("");
    onSuccess();
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if ((event.target as HTMLElement).id === "add-contact-group-modal") {
        onClose();
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  return (
    <div
      id="add-contact-group-modal"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black/30"
    >
      <div className="relative p-4 w-full max-w-lg max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
          {successMessage ? (
            <div className="p-6 text-center">
              <h2 className="mb-4 text-2xl font-semibold text-green-500">Success!</h2>
              <p className="mb-6 text-gray-900 dark:text-white">{successMessage}</p>
              <Button className="w-full" onClick={handleSuccessClose}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add Contact to Group
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      id="phone"
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="254711438911"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="firstname" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstname"
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastname" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 disabled:opacity-60"
                    >
                      {submitting ? "Adding..." : "Add to Group"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Remove Contact from Group Confirm Modal
// ---------------------------------------------------------------------------

interface RemoveContactModalProps {
  groupId: string;
  organizationExternalId: string;
  contactLabel: string;
  contactId: number;
  onClose: () => void;
  onRemoved: () => void;
}

function RemoveContactModal({
  groupId,
  organizationExternalId,
  contactLabel,
  contactId,
  onClose,
  onRemoved,
}: RemoveContactModalProps) {
  const { toast } = useToast();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const token = localStorage.getItem("token") || "";
      const deleteUrl = `${PEAKDATA_BASE_URL}/organization/${organizationExternalId}/groups/${groupId}/contacts/${contactId}`;

      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 204 || response.ok) {
        toast({ title: "Contact removed", description: `${contactLabel} was removed from this group.` });
        onRemoved();
        onClose();
      } else {
        const rawText = await response.text();
        const data = rawText ? JSON.parse(rawText) : {};
        throw new Error(data?.error?.message || "Failed to remove contact from group");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove contact from group",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      id="remove-contact-modal"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black/30"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative p-4 w-full max-w-md">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center justify-between p-4 border-b rounded-t dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Remove contact</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Remove <span className="font-medium">{contactLabel}</span> from this group? The contact itself won't be deleted.
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
                onClick={handleRemove}
                disabled={removing}
                className="w-full text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 disabled:opacity-60"
              >
                {removing ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group Contacts Page
// ---------------------------------------------------------------------------

function GroupContactsContent() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { isConfigured, organizationExternalId, signalPmlUnauthorized } = useConfig();
  const [contacts, setContacts] = useState<GroupContact[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contactToRemove, setContactToRemove] = useState<{ id: number; label: string } | null>(null);
  const pageSize = 10;

  const fetchContacts = useCallback(async (page: number) => {
    if (!isConfigured || !organizationExternalId || !groupId) return;

    setLoading(true);
    try {
      const url = new URL(`/api/whatsapp/peakdata/groups/${groupId}/contacts`, window.location.origin);
      url.searchParams.set("organizationExternalId", organizationExternalId);
      url.searchParams.set("orderby", "created_at DESC");
      url.searchParams.set("size", pageSize.toString());
      url.searchParams.set("page", page.toString());

      const response = await fetch(url.toString(), {
        headers: { "x-auth-token": localStorage.getItem("token") || "" },
      });
      const data = await response.json();

      if (response.status === 401) { signalPmlUnauthorized(); return; }
      if (!response.ok) {
        throw new Error(data?.error?.message || "Failed to load group contacts");
      }

      setContacts(data.data || []);
      setTotalCount(data.count || 0);
      setCurrentPage(page);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load group contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [groupId, isConfigured, organizationExternalId, toast]);

  useEffect(() => {
    fetchContacts(1);
  }, [fetchContacts]);

  const handleAddSuccess = () => {
    toast({ title: "Contact added", description: "The contact was added to this group." });
    fetchContacts(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const contactDetails = (membership: GroupContact) => membership.contact || membership;
  const contactName = (membership: GroupContact) => {
    const contact = contactDetails(membership);
    const metadata = contact.metadata || {};
    const firstName = contact.first_name || metadata.FIRST_NAME || metadata.FIRSTNAME;
    const lastName = contact.last_name || metadata.LAST_NAME || metadata.LASTNAME;
    const name = [firstName, lastName]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim())
      .join(" ");

    return name || contact.label?.trim() || "-";
  };

  return (
    <div className="min-h-screen">
      <Header title="Group Contacts" description={`Contacts in group ${groupId}`} />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => router.push("/apps/whatsapp/groups")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Groups
          </Button>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">Total Contacts: {totalCount}</p>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No Contacts</h3>
            <p className="mt-2 text-sm text-muted-foreground">This group does not contain any contacts yet.</p>
            <Button size="sm" className="mt-4" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((membership) => {
                    const contact = contactDetails(membership);
                    const status = contact.status || membership.status_id || membership.status;
                    const label = contactName(membership);

                    return (
                      <TableRow key={membership.id}>
                        <TableCell className="font-medium">{label}</TableCell>
                        <TableCell className="font-mono">{contact.mobile_no || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
                            {status || "UNKNOWN"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {membership.created_at ? new Date(membership.created_at).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setContactToRemove({
                                id: contact.id,
                                label: label !== "-" ? label : contact.mobile_no || "this contact",
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} contacts
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => fetchContacts(currentPage - 1)} disabled={currentPage === 1 || loading}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  <span className="px-2 text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => fetchContacts(currentPage + 1)} disabled={currentPage >= totalPages || loading}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && organizationExternalId && (
        <AddContactToGroupModal
          groupId={groupId}
          organizationExternalId={organizationExternalId}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {contactToRemove && organizationExternalId && (
        <RemoveContactModal
          groupId={groupId}
          organizationExternalId={organizationExternalId}
          contactId={contactToRemove.id}
          contactLabel={contactToRemove.label}
          onClose={() => setContactToRemove(null)}
          onRemoved={() => fetchContacts(currentPage)}
        />
      )}
    </div>
  );
}

export default function GroupContactsPage() {
  return (
    <DashboardLayout>
      <GroupContactsContent />
    </DashboardLayout>
  );
}