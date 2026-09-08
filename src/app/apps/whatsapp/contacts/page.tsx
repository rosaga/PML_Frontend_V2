"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConfig } from "@/lib/whatsapp/config-context";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Card } from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Button } from "@/components/whatsapp/ui/button";
import { Badge } from "@/components/whatsapp/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/whatsapp/ui/table";
import {
  Search,
  Pencil,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useTags } from "@/lib/whatsapp/tags-context";

interface Contact {
  mobile_no: string;
  contact_id: number | null;
  first_name: string;
  last_name: string;
  last_active: string;
  message_count: number;
}

import { loadNames, persistNames } from "@/lib/whatsapp/name-cache";
import type { NamesMap } from "@/lib/whatsapp/name-cache";

function ContactsContent() {
  const router = useRouter();
  const { organizationId, pmlOrganizationId, isLoading: contextLoading, signalPmlUnauthorized } = useConfig();
  const { tags, getTagsForContact } = useTags();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const nameFetchedRef = useRef<Set<string>>(new Set());

  const fetchContacts = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const apiSize = pageSize * 4;
      const res = await fetch(
        `/api/whatsapp/whatsapp-internal/messages/list?page=${page}&size=${apiSize}&orderby=created_at%20DESC`,
        { headers: { "x-organization-id": organizationId } },
      );
      const data = await res.json();
      if (!Array.isArray(data?.data)) return;

      setTotalCount(data.count ?? 0);

      const map = new Map<string, Contact>();
      for (const msg of data.data as any[]) {
        const no: string = msg.mobile_no;
        if (!no) continue;
        if (!map.has(no)) {
          map.set(no, {
            mobile_no: no,
            contact_id: msg.contact_id ?? null,
            first_name: "",
            last_name: "",
            last_active: msg.created_at || msg.updated_at || "",
            message_count: 1,
          });
        } else {
          map.get(no)!.message_count++;
        }
      }

      nameFetchedRef.current = new Set();

      // Pre-populate from local name cache — shows names instantly without waiting for API
      // Only use real confirmed names (maybe: false), never metadata fallback on this page
      const nameCache = loadNames(organizationId);
      for (const contact of Array.from(map.values())) {
        const cached = nameCache[contact.mobile_no];
        if (cached && !cached.maybe && (cached.firstName || cached.lastName)) {
          contact.first_name = cached.firstName;
          contact.last_name  = cached.lastName;
        }
      }

      setContacts(
        Array.from(map.values()).sort(
          (a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime(),
        ),
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [organizationId, page, pageSize]);

  useEffect(() => {
    if (!contextLoading && organizationId) fetchContacts();
  }, [contextLoading, organizationId, fetchContacts]);

  useEffect(() => { setPage(1); }, [searchQuery, tagFilter, pageSize]);

  // Lazy-load names only for the contacts visible on the current page
  const pagedKeys = contacts.slice(0, pageSize).map((c) => c.mobile_no).join(",");
  useEffect(() => {
    if (!pmlOrganizationId) return;
    const authToken = localStorage.getItem("token") ?? "";
    if (!authToken) return;

    // Load name cache once — skip contacts already confirmed (real name or no-name)
    const nameCache = loadNames(organizationId);

    const toFetch = pagedKeys.split(",").filter((no) => {
      if (!no || nameFetchedRef.current.has(no)) return false;
      // Already has name in state
      const existing = contacts.find((c) => c.mobile_no === no);
      if (existing?.first_name || existing?.last_name) { nameFetchedRef.current.add(no); return false; }
      // Already in name cache as a real (non-maybe) entry — confirmed real name or confirmed no-name
      const cached = nameCache[no];
      if (cached && !cached.maybe) { nameFetchedRef.current.add(no); return false; }
      return true;
    });
    if (toFetch.length === 0) return;
    toFetch.forEach((no) => nameFetchedRef.current.add(no));
    toFetch.forEach(async (no) => {
      try {
        const r = await fetch(
          `/api/whatsapp/contacts?organizationId=${encodeURIComponent(pmlOrganizationId)}&mobileNo=${encodeURIComponent(no)}`,
          { headers: { "x-auth-token": authToken } },
        );
        if (r.status === 401) { signalPmlUnauthorized(); return; }
        if (!r.ok) return;
        const c = await r.json();
        if (!c) return;
        // Contacts page: always first_name / last_name only — no metadata fallback
        const firstName = c.first_name || "";
        const lastName  = c.last_name  || "";
        if (firstName || lastName) {
          setContacts((prev) =>
            prev.map((ct) =>
              ct.mobile_no === no
                ? { ...ct, first_name: firstName, last_name: lastName, contact_id: ct.contact_id ?? c.id ?? null }
                : ct,
            ),
          );
          // Persist real name to cache so inbox and other views benefit
          const stored = loadNames(organizationId);
          if (!stored[no] || stored[no].maybe) {
            persistNames(organizationId, { ...stored, [no]: { firstName, lastName, maybe: false } });
          }
        }
      } catch { /* ignore */ }
    });
  }, [pagedKeys, pmlOrganizationId, organizationId, contacts, signalPmlUnauthorized]);

  const goToContact = (mobileNo: string) =>
    router.push(`/contacts/${encodeURIComponent(mobileNo)}`);

  const displayName = (c: Contact) => {
    const parts = [c.first_name, c.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diffMs / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(diffMs / 86400000);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const searched = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      c.mobile_no.toLowerCase().includes(q) ||
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q)
    );
  });

  const filtered = tagFilter
    ? searched.filter((c) =>
        getTagsForContact(c.mobile_no).some((t) => t.id === tagFilter),
      )
    : searched;

  const paged = filtered.slice(0, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalCount / (pageSize * 4)));

  return (
    <div className="min-h-screen">
      <Header
        title="Contacts"
        description="View and manage all your WhatsApp contacts"
      />

      <div className="p-6">
        {/* Search + tag filters */}
        <div className="mb-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <span className="text-sm text-muted-foreground shrink-0">
              {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setTagFilter(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  !tagFilter
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                All
              </button>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setTagFilter(tagFilter === tag.id ? null : tag.id)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                  style={{
                    backgroundColor: tagFilter === tag.id ? tag.color : undefined,
                    borderColor: tagFilter === tag.id ? tag.color : undefined,
                    color: tagFilter === tag.id ? "#fff" : undefined,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading contacts...
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="py-12 text-center text-gray-500">No contacts found</div>
          </Card>
        ) : (
          <>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-center">Messages</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((contact) => {
                    const contactTags = getTagsForContact(contact.mobile_no);
                    const name = displayName(contact);
                    return (
                      <TableRow
                        key={contact.mobile_no}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => goToContact(contact.mobile_no)}
                      >
                        <TableCell>
                          <div className="h-9 w-9 rounded-full flex items-center justify-center bg-gray-200">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        </TableCell>

                        <TableCell>
                          {name ? (
                            <span className="font-medium text-gray-900">{name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">No name</span>
                          )}
                        </TableCell>

                        <TableCell className="text-gray-600 font-mono text-sm">
                          {contact.mobile_no}
                        </TableCell>

                        <TableCell>
                          {contactTags.length > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              {contactTags.map((t) => (
                                <span
                                  key={t.id}
                                  className="px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
                                  style={{ backgroundColor: t.color }}
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="secondary">{contact.message_count}</Badge>
                        </TableCell>

                        <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                          {formatDate(contact.last_active)}
                        </TableCell>

                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => goToContact(contact.mobile_no)}
                            className="h-8 w-8 p-0"
                            title="View contact"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border border-border rounded px-1.5 py-0.5 text-sm bg-background"
                  >
                    {[10, 25, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <DashboardLayout>
      <ContactsContent />
    </DashboardLayout>
  );
}
