"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Card } from "@/components/whatsapp/ui/card";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/whatsapp/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/whatsapp/ui/table";
import { useTags, TAG_COLOR_OPTIONS, type Tag } from "@/lib/whatsapp/tags-context";
import { useConfig } from "@/lib/whatsapp/config-context";
import { Plus, X, Tag as TagIcon, RefreshCw, Search, Users, MessageSquare, Loader2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ContactRow {
  mobile_no: string;
  message_count: number;
  last_message: string;
  last_activity: string;
}

// ── Add Tag Dialog ─────────────────────────────────────────────────────────

function AddTagDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addTag } = useTags();
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLOR_OPTIONS[0].value);

  const handleClose = () => {
    setName("");
    setColor(TAG_COLOR_OPTIONS[0].value);
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    addTag(name.trim(), color);
    handleClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>New Tag</AlertDialogTitle>
          <AlertDialogDescription>Create a tag to organise your contacts.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Tag name</Label>
            <Input
              id="tag-name"
              placeholder="e.g. VIP, Hot Lead…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Colour</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {TAG_COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  title={opt.label}
                  onClick={() => setColor(opt.value)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: opt.value,
                    borderColor: color === opt.value ? "#000" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Create Tag
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Add Contact Dialog (search-first) ─────────────────────────────────────

function AddContactDialog({
  open,
  onOpenChange,
  preselectedTagId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  preselectedTagId: string | null;
}) {
  const { tags, addContactToTag, getContactsForTag } = useTags();
  const { organizationId } = useConfig();
  const [search, setSearch] = useState("");
  const [tagId, setTagId] = useState(preselectedTagId ?? "");
  const [knownNumbers, setKnownNumbers] = useState<string[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Sync preselected tag when it changes
  useEffect(() => {
    if (preselectedTagId) setTagId(preselectedTagId);
  }, [preselectedTagId]);

  // Load known contacts from messages history when dialog opens
  // TODO: wire backend — replace with GET /api/whatsapp/contacts/search?q=... when backend is ready
  useEffect(() => {
    if (!open || !organizationId) return;
    setLoadingContacts(true);
    fetch("/api/whatsapp/messages/list?page=1&size=500&orderby=created_at%20DESC", {
      headers: { "x-organization-id": organizationId },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) {
          const nums = Array.from(new Set<string>(
            (data.data as any[]).map((m) => m.mobile_no).filter(Boolean),
          )).sort();
          setKnownNumbers(nums);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingContacts(false));
  }, [open, organizationId]);

  const handleClose = () => {
    setSearch("");
    onOpenChange(false);
  };

  const handleAdd = (mobileNo: string) => {
    if (!mobileNo.trim() || !tagId) return;
    addContactToTag(mobileNo.trim(), tagId);
    setSearch(""); // clear search so user can add another contact without closing
  };

  // Already assigned to the selected tag
  const alreadyTagged = tagId ? new Set(getContactsForTag(tagId)) : new Set<string>();

  // Filter known numbers by search query — show ALL matches, including already-tagged
  const matches = search.length >= 2
    ? knownNumbers.filter((n) => n.includes(search))
    : [];

  // Show "add as new" option when typed value looks like a number not in known list
  const isNewNumber =
    search.trim().length >= 6 &&
    !knownNumbers.includes(search.trim()) &&
    !alreadyTagged.has(search.trim());

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Add contact to tag</AlertDialogTitle>
          <AlertDialogDescription>
            Search existing contacts or enter a new number.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-1">
          {/* Tag picker — shown only when no tag is preselected */}
          {!preselectedTagId && (
            <div className="space-y-2">
              <Label>Tag</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTagId(t.id)}
                    className="px-3 py-1 rounded-full text-sm font-medium text-white transition-opacity"
                    style={{ backgroundColor: t.color, opacity: tagId === t.id ? 1 : 0.4 }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search input */}
          <div className="space-y-1">
            <Label htmlFor="contact-search">Search or enter mobile number</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="contact-search"
                placeholder="Type to search contacts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          {/* Results list */}
          {search.length >= 2 && (
            <div className="border rounded-md divide-y max-h-52 overflow-y-auto">
              {loadingContacts && (
                <div className="p-3 text-sm text-muted-foreground text-center">Loading…</div>
              )}

              {!loadingContacts && matches.map((no) => {
                const tagged = alreadyTagged.has(no);
                return (
                  <button
                    key={no}
                    onClick={() => handleAdd(no)}
                    disabled={!tagId}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors disabled:opacity-40"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}>
                      {no.slice(-2)}
                    </div>
                    <span className="font-mono">{no}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {tagged ? "✓ in tag" : "existing"}
                    </span>
                  </button>
                );
              })}

              {/* Add as new number option */}
              {isNewNumber && (
                <button
                  onClick={() => handleAdd(search.trim())}
                  disabled={!tagId}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors disabled:opacity-40"
                >
                  <div className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center shrink-0">
                    <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span>
                    Add <span className="font-mono font-medium">{search.trim()}</span> as new contact
                  </span>
                </button>
              )}

              {!loadingContacts && matches.length === 0 && !isNewNumber && (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No matching contacts found.
                </div>
              )}
            </div>
          )}

          {!tagId && (
            <p className="text-xs text-amber-600">Please select a tag above first.</p>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <AlertDialogCancel onClick={handleClose}>Close</AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────

export function TagsLayout() {
  const router = useRouter();
  const { organizationId, isLoading: contextLoading } = useConfig();
  const { tags, tagsLoading, getContactsForTag, getTagsForContact, removeTag, removeContactFromTag } = useTags();

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addContactTagId, setAddContactTagId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [contactDataMap, setContactDataMap] = useState<Map<string, ContactRow>>(new Map());
  const [contactLoading, setContactLoading] = useState(false);

  // Fetch message data to populate table columns
  // TODO: wire backend — replace with GET /api/tags/contacts when backend is ready
  const fetchContactData = useCallback(async () => {
    if (!organizationId || contextLoading) return;
    setContactLoading(true);
    try {
      const res = await fetch(
        "/api/whatsapp/messages/list?page=1&size=500&orderby=created_at%20DESC",
        { headers: { "x-organization-id": organizationId } },
      );
      const data = await res.json();
      if (data?.data && Array.isArray(data.data)) {
        const map = new Map<string, ContactRow>();
        for (const msg of data.data as any[]) {
          const no: string = msg.mobile_no;
          if (!no) continue;
          if (!map.has(no)) {
            map.set(no, {
              mobile_no: no,
              message_count: 1,
              last_message: msg.content || `[${msg.type || "message"}]`,
              last_activity: msg.created_at || msg.updated_at || "",
            });
          } else {
            map.get(no)!.message_count++;
          }
        }
        setContactDataMap(map);
      }
    } catch {
      // silently fail — contact rows still show with N/A for message data
    } finally {
      setContactLoading(false);
    }
  }, [organizationId, contextLoading]);

  useEffect(() => { fetchContactData(); }, [fetchContactData]);

  // Derive the set of mobile numbers to show based on filter
  const allTaggedNumbers = Array.from(
    new Set(tags.flatMap((t) => getContactsForTag(t.id))),
  );

  const visibleNumbers = selectedTagId
    ? getContactsForTag(selectedTagId)
    : allTaggedNumbers;

  const filteredNumbers = visibleNumbers.filter((no) =>
    no.toLowerCase().includes(search.toLowerCase()),
  );

  const formatRelative = (iso: string) => {
    if (!iso) return "N/A";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(diff / 86400000);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  const openAddContact = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddContactTagId(tagId);
    setAddContactOpen(true);
  };

  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this tag? All contact assignments will be removed.")) return;
    if (selectedTagId === tagId) setSelectedTagId(null);
    removeTag(tagId);
  };

  if (tagsLoading || contextLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Tags" description="Organise contacts into custom tags for targeted messaging" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading tags…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Tags"
        description="Organise contacts into custom tags for targeted messaging"
      />

      <div className="p-6 flex-1 space-y-6">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {allTaggedNumbers.length} tagged contact{allTaggedNumbers.length !== 1 ? "s" : ""} across {tags.length} tag{tags.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchContactData} disabled={contactLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${contactLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setAddTagOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tag
            </Button>
          </div>
        </div>

        {/* ── Summary tiles ── */}
        {tags.length === 0 ? (
          <Card className="p-10 text-center">
            <TagIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">No tags yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a tag to start organising your contacts.
            </p>
            <Button onClick={() => setAddTagOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create your first tag
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tags.map((tag) => {
              const count = getContactsForTag(tag.id).length;
              const isActive = selectedTagId === tag.id;
              return (
                <Card
                  key={tag.id}
                  onClick={() => setSelectedTagId(isActive ? null : tag.id)}
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                  style={{
                    borderTop: `3px solid ${tag.color}`,
                    outline: isActive ? `2px solid ${tag.color}` : undefined,
                    outlineOffset: isActive ? "1px" : undefined,
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tag.color }} />
                        <span className="font-medium text-sm truncate">{tag.name}</span>
                      </div>
                      <button
                        onClick={(e) => handleRemoveTag(tag.id, e)}
                        className="ml-1 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-3xl font-semibold tracking-tight">{count}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      contact{count !== 1 ? "s" : ""}
                    </p>
                    <button
                      onClick={(e) => openAddContact(tag.id, e)}
                      className="mt-3 flex items-center gap-1 text-xs font-medium hover:underline"
                      style={{ color: tag.color }}
                    >
                      <Plus className="w-3 h-3" /> Add contact
                    </button>
                  </div>
                </Card>
              );
            })}

            {/* Add tag tile */}
            <button
              onClick={() => setAddTagOpen(true)}
              className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-accent transition-colors min-h-[130px]"
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">New tag</span>
            </button>
          </div>
        )}

        {/* ── Filter chips ── */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTagId(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                !selectedTagId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              All ({allTaggedNumbers.length})
            </button>
            {tags.map((tag) => {
              const active = selectedTagId === tag.id;
              return (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTagId(active ? null : tag.id)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
                  style={{
                    backgroundColor: active ? tag.color : undefined,
                    borderColor: active ? tag.color : undefined,
                    color: active ? "#fff" : undefined,
                  }}
                >
                  {tag.name} ({getContactsForTag(tag.id).length})
                </button>
              );
            })}
          </div>
        )}

        {/* ── Search + table ── */}
        {tags.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search mobile number…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddContactTagId(selectedTagId);
                  setAddContactOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add contact
              </Button>
            </div>

            <Card>
              {contactLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
              ) : filteredNumbers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {allTaggedNumbers.length === 0
                      ? "No contacts tagged yet. Use 'Add contact' to get started."
                      : "No contacts match your search."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mobile Number</TableHead>
                      <TableHead className="text-center">Messages</TableHead>
                      <TableHead>Last Message</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNumbers.map((no) => {
                      const data = contactDataMap.get(no);
                      const contactTags = getTagsForContact(no);
                      return (
                        <TableRow key={no}>
                          <TableCell className="font-mono text-sm">{no}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{data?.message_count ?? 0}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {data?.last_message ?? "N/A"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatRelative(data?.last_activity ?? "")}
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                title="Go to chat"
                                onClick={() => router.push(`/inbox/${encodeURIComponent(no)}`)}
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              {selectedTagId && (
                                <button
                                  onClick={() => removeContactFromTag(no, selectedTagId)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                  title={`Remove from ${tags.find((t) => t.id === selectedTagId)?.name}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        )}
      </div>

      <AddTagDialog open={addTagOpen} onOpenChange={setAddTagOpen} />
      <AddContactDialog
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        preselectedTagId={addContactTagId}
      />
    </div>
  );
}
