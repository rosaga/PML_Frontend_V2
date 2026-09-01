"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConfig } from "@/lib/whatsapp/config-context";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Button } from "@/components/whatsapp/ui/button";
import { Label } from "@/components/whatsapp/ui/label";
import {
  ArrowLeft,
  User,
  Pencil,
  Check,
  X,
  MessageSquare,
  Loader2,
  Tag as TagIcon,
  Phone,
} from "lucide-react";
import { useTags } from "@/lib/whatsapp/tags-context";
import { loadNames, persistNames } from "@/lib/whatsapp/name-cache";

interface Message {
  id: string;
  direction: string;
  type: string;
  content?: string;
  template_name?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

function ContactDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { organizationId, pmlOrganizationId, isLoading: contextLoading, signalPmlUnauthorized } = useConfig();
  const { tags, getTagsForContact, addContactToTag, removeContactFromTag } = useTags();

  const mobileNo = decodeURIComponent(params.mobileNo as string);
  const contactTags = getTagsForContact(mobileNo);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [contactId, setContactId] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!organizationId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/whatsapp/whatsapp-internal/messages/list?eq__mobile_no=${encodeURIComponent(mobileNo)}&page=1&size=500`,
        { headers: { "x-organization-id": organizationId } },
      );
      const data = await res.json();
      if (Array.isArray(data?.data)) {
        const msgs: any[] = data.data;

        const sorted = (msgs as Message[]).sort(
          (a, b) =>
            new Date(a.created_at || a.updated_at || "").getTime() -
            new Date(b.created_at || b.updated_at || "").getTime(),
        );
        setMessages(sorted);

        const withId = msgs.find((m) => m.contact_id);
        if (withId) setContactId(withId.contact_id);

        // Fetch name from V2 contacts API
        const authToken = localStorage.getItem("token") ?? "";
        try {
          if (!authToken || !pmlOrganizationId) throw new Error("no credentials");
          const contactRes = await fetch(
            `/api/whatsapp/contacts?organizationId=${encodeURIComponent(pmlOrganizationId)}&mobileNo=${encodeURIComponent(mobileNo)}`,
            { headers: { "x-auth-token": authToken } },
          );
          if (contactRes.status === 401) { signalPmlUnauthorized(); return; }
          const contact = await contactRes.json();

          if (contactRes.ok && contact?.id) {
            // Contact exists on PML — use its ID for future PATCH calls
            setContactId(contact.id);
            const serverFirst: string = contact.first_name ?? "";
            const serverLast: string  = contact.last_name  ?? "";
            if (serverFirst || serverLast) {
              setFirstName(serverFirst);
              setLastName(serverLast);
              // Update name cache with confirmed real name (overwrite any maybe entry)
              const stored = loadNames(organizationId);
              persistNames(organizationId, { ...stored, [mobileNo]: { firstName: serverFirst, lastName: serverLast, maybe: false } });
            } else {
              // No real name on PML — only use name cache if it has a confirmed (non-maybe) entry
              const stored = loadNames(organizationId);
              const local = stored[mobileNo];
              if (local && !local.maybe) {
                setFirstName(local.firstName);
                setLastName(local.lastName);
              }
            }
          } else {
            // Contact not on PML (404) — clear contactId so saveName will POST to create
            setContactId(null);
            const stored = loadNames(organizationId);
            const local = stored[mobileNo];
            if (local && !local.maybe) {
              setFirstName(local.firstName);
              setLastName(local.lastName);
            }
          }
        } catch {
          // fall back to name cache — only use confirmed (non-maybe) entries
          const stored = loadNames(organizationId);
          const local = stored[mobileNo];
          if (local && !local.maybe) {
            setFirstName(local.firstName);
            setLastName(local.lastName);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingMessages(false);
    }
  }, [organizationId, pmlOrganizationId, mobileNo]);

  useEffect(() => {
    if (!contextLoading && organizationId && pmlOrganizationId) fetchMessages();
  }, [contextLoading, organizationId, pmlOrganizationId, fetchMessages]);

  const startEditing = () => {
    setEditFirst(firstName);
    setEditLast(lastName);
    setEditingName(true);
  };

  const saveName = async () => {
    if (!pmlOrganizationId) return;
    setSavingName(true);
    const trimFirst = editFirst.trim();
    const trimLast  = editLast.trim();

    setFirstName(trimFirst);
    setLastName(trimLast);
    setEditingName(false);

    const token = localStorage.getItem("token") ?? "";

    if (contactId) {
      // Contact already exists on PML → PATCH to update names
      try {
        const res = await fetch(`/api/whatsapp/contacts?organizationId=${encodeURIComponent(pmlOrganizationId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-auth-token": token },
          body: JSON.stringify({ contact_id: contactId, first_name: trimFirst, last_name: trimLast }),
        });
        if (res.status === 401) { signalPmlUnauthorized(); return; }
        if (!res.ok) throw new Error(`PATCH returned ${res.status}`);
        const stored = loadNames(organizationId);
        persistNames(organizationId, { ...stored, [mobileNo]: { firstName: trimFirst, lastName: trimLast, maybe: false } });
      } catch {
        const stored = loadNames(organizationId);
        persistNames(organizationId, { ...stored, [mobileNo]: { firstName: trimFirst, lastName: trimLast, maybe: false } });
      }
    } else {
      // Contact not found on PML → POST to create it
      try {
        const res = await fetch(`/api/whatsapp/contacts?organizationId=${encodeURIComponent(pmlOrganizationId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-auth-token": token },
          body: JSON.stringify({ mobile_no: mobileNo, first_name: trimFirst, last_name: trimLast }),
        });
        if (res.status === 401) { signalPmlUnauthorized(); return; }
        if (!res.ok) throw new Error(`POST returned ${res.status}`);
        const created = await res.json();
        if (created?.id) setContactId(created.id);
        const stored = loadNames(organizationId);
        persistNames(organizationId, { ...stored, [mobileNo]: { firstName: trimFirst, lastName: trimLast, maybe: false } });
      } catch {
        // PML unavailable — keep name in localStorage as fallback
        const stored = loadNames(organizationId);
        persistNames(organizationId, { ...stored, [mobileNo]: { firstName: trimFirst, lastName: trimLast, maybe: false } });
      }
    }
    setSavingName(false);
  };

  const inbound = messages.filter((m) => m.direction === "INBOUND").length;
  const outbound = messages.filter((m) => m.direction === "OUTBOUND").length;
  // Show last 10 as a chat preview (already sorted oldest-first, so slice from end)
  const chatPreview = messages.slice(-10);

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || null;

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatRelative = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const days = Math.floor(diffMs / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const msgText = (m: Message) => {
    if (m.content) return m.content;
    if (m.template_name) return `Template: ${m.template_name}`;
    return `[${m.type}]`;
  };

  if (loadingMessages) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/contacts")}
            className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Contacts
          </Button>
        </div>
        <div className="p-6 max-w-4xl mx-auto space-y-5">
          {/* Profile skeleton */}
          <Card>
            <CardContent className="py-5 px-6">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-full bg-gray-200 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="pt-5 pb-4 text-center space-y-2">
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            <Card className="md:col-span-2 h-48 animate-pulse bg-gray-100 border-0" />
            <Card className="md:col-span-3 h-48 animate-pulse bg-gray-100 border-0" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back nav */}
      <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/contacts")}
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Contacts
        </Button>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-5">

        {/* ── Profile card ──────────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="py-5 px-6">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
              >
                <User className="h-7 w-7 text-white" />
              </div>

              {/* Name + phone + tags */}
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="editFirst">First name</Label>
                        <Input
                          id="editFirst"
                          value={editFirst}
                          onChange={(e) => setEditFirst(e.target.value)}
                          placeholder="First name"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="editLast">Last name</Label>
                        <Input
                          id="editLast"
                          value={editLast}
                          onChange={(e) => setEditLast(e.target.value)}
                          placeholder="Last name"
                          onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveName} disabled={savingName} className="gap-1.5">
                        {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingName(false)} disabled={savingName} className="gap-1.5">
                        <X className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {displayName ? (
                      <h1 className="text-xl font-semibold text-gray-900">{displayName}</h1>
                    ) : (
                      <h1 className="text-base font-medium text-muted-foreground italic">No name set</h1>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5 text-sm text-gray-500">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="font-mono">{mobileNo}</span>
                    </div>
                    {contactTags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {contactTags.map((t) => (
                          <span
                            key={t.id}
                            className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: t.color }}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {!editingName && (
                <Button variant="outline" size="sm" onClick={startEditing} className="gap-1.5 shrink-0">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit name
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Stats row ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total messages", value: messages.length, color: "text-gray-900", bg: "bg-white" },
            { label: "Received", value: inbound, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Sent", value: outbound, color: "text-blue-600", bg: "bg-blue-50" },
          ].map(({ label, value, color, bg }) => (
            <Card key={label} className={`${bg} border-0 shadow-sm`}>
              <CardContent className="pt-5 pb-4 text-center">
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

          {/* ── Tags card (2/5) ───────────────────────────────────────────────── */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-muted-foreground" />
                Add tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No tags yet. Create tags from the Tags page first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const assigned = contactTags.some((t) => t.id === tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() =>
                          assigned
                            ? removeContactFromTag(mobileNo, tag.id)
                            : addContactToTag(mobileNo, tag.id)
                        }
                        title={assigned ? `Remove "${tag.name}"` : `Add "${tag.name}"`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all hover:opacity-90 active:scale-95"
                        style={{
                          backgroundColor: assigned ? tag.color : "transparent",
                          borderColor: tag.color,
                          color: assigned ? "#fff" : tag.color,
                        }}
                      >
                        {assigned && <Check className="h-3 w-3" />}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Chat preview (3/5) ────────────────────────────────────────────── */}
          <Card className="md:col-span-3 flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-center justify-between shrink-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Recent messages
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/inbox/${encodeURIComponent(mobileNo)}`)}
                className="gap-1.5 text-xs h-7 px-2 text-primary hover:text-primary"
              >
                View all
                <ArrowLeft className="h-3 w-3 rotate-180" />
              </Button>
            </CardHeader>

            {/* Chat bubble area */}
            <CardContent className="flex-1 p-0">
              <div className="bg-gray-50 rounded-b-xl mx-0 h-[320px] overflow-y-auto p-4 space-y-2">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : chatPreview.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No messages yet
                  </div>
                ) : (
                  <>
                    {messages.length > 10 && (
                      <p className="text-center text-xs text-muted-foreground pb-1">
                        Showing last 10 of {messages.length} messages
                      </p>
                    )}
                    {chatPreview.map((msg) => {
                      const isOut = msg.direction === "OUTBOUND";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${
                              isOut
                                ? "bg-[#D9FDD3] rounded-tr-sm"
                                : "bg-white rounded-tl-sm"
                            }`}
                          >
                            <p className="text-sm text-gray-900 leading-snug">{msgText(msg)}</p>
                            <p className={`text-[10px] mt-0.5 ${isOut ? "text-right text-gray-500" : "text-gray-400"}`}>
                              {formatRelative(msg.created_at || msg.updated_at)}{" "}
                              {formatTime(msg.created_at || msg.updated_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Open conversation CTA */}
        <Button
          className="w-full gap-2 bg-[#001F3D] hover:bg-[#003366] h-11"
          onClick={() => router.push(`/inbox/${encodeURIComponent(mobileNo)}`)}
        >
          <MessageSquare className="h-4 w-4" />
          Open full conversation
        </Button>
      </div>
    </div>
  );
}

export default function ContactDetailPage() {
  return (
    <DashboardLayout>
      <ContactDetailContent />
    </DashboardLayout>
  );
}
