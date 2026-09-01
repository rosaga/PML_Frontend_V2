"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useConfig } from "./config-context";

export interface Tag {
  id: string;    // = label name (backend labels have no numeric IDs)
  name: string;
  color: string;
  createdAt: string;
}

export interface TagContact {
  tagId: string;
  mobileNo: string;
  addedAt: string;
}

interface TagsContextType {
  tags: Tag[];
  tagContacts: TagContact[];
  tagsLoading: boolean;
  addTag: (name: string, color: string) => Tag;
  removeTag: (tagId: string) => void;
  addContactToTag: (mobileNo: string, tagId: string) => void;
  removeContactFromTag: (mobileNo: string, tagId: string) => void;
  getTagsForContact: (mobileNo: string) => Tag[];
  getContactsForTag: (tagId: string) => string[];
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export const TAG_COLOR_OPTIONS = [
  { label: "Blue",   value: "#3B82F6" },
  { label: "Green",  value: "#10B981" },
  { label: "Amber",  value: "#F59E0B" },
  { label: "Red",    value: "#EF4444" },
  { label: "Purple", value: "#8B5CF6" },
  { label: "Cyan",   value: "#06B6D4" },
  { label: "Orange", value: "#F97316" },
  { label: "Pink",   value: "#EC4899" },
];

const DEFAULT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#EC4899"];

function colorForIndex(i: number) {
  return DEFAULT_COLORS[i % DEFAULT_COLORS.length];
}

export function TagsProvider({ children }: { children: ReactNode }) {
  const { organizationId, isLoading: configLoading } = useConfig();

  const [tags, setTags] = useState<Tag[]>([]);
  const [tagContacts, setTagContacts] = useState<TagContact[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  // mobileNo → contact_id (needed for backend PATCH calls)
  const contactIdMapRef = useRef<Map<string, number>>(new Map());

  // ── localStorage helpers ────────────────────────────────────────────────────

  const getColors = useCallback((): Record<string, string> => {
    if (!organizationId) return {};
    try { return JSON.parse(localStorage.getItem(`tag-colors-${organizationId}`) ?? "{}"); }
    catch { return {}; }
  }, [organizationId]);

  const saveColors = useCallback((c: Record<string, string>) => {
    if (organizationId) localStorage.setItem(`tag-colors-${organizationId}`, JSON.stringify(c));
  }, [organizationId]);

  // TODO: Multi-tag localStorage layer — remove entirely when backend supports multiple labels per contact.
  // Currently the backend only stores ONE label per contact (single string via PATCH /contact/label).
  // Once the backend exposes a proper multi-label API, replace getAssignments / saveAssignments with:
  //   GET  /api/v1/organization/{orgId}/contact/{contactId}/labels  → string[]
  //   POST /api/v1/organization/{orgId}/contact/{contactId}/labels  → { label }
  //   DELETE /api/v1/organization/{orgId}/contact/{contactId}/labels/{label}
  // Also remove the `tag-assignments-${orgId}` localStorage key.
  const getAssignments = useCallback((): TagContact[] => {
    if (!organizationId) return [];
    try { return JSON.parse(localStorage.getItem(`tag-assignments-${organizationId}`) ?? "[]"); }
    catch { return []; }
  }, [organizationId]);

  const saveAssignments = useCallback((tcs: TagContact[]) => {
    if (organizationId) localStorage.setItem(`tag-assignments-${organizationId}`, JSON.stringify(tcs));
  }, [organizationId]);

  // ── Load from backend + merge with localStorage ─────────────────────────────

  const loadFromBackend = useCallback(async () => {
    if (!organizationId) return;
    setTagsLoading(true);
    try {
      // 1. All label names for this org
      const labelsRes = await fetch(`/api/tags?organizationId=${encodeURIComponent(organizationId)}`);
      const labelsData = await labelsRes.json();
      const labelNames: string[] = Array.isArray(labelsData?.data) ? labelsData.data : [];

      // 2. Recent messages → contactId map + single backend label per contact
      const msgsRes = await fetch(
        `/api/whatsapp/messages/list?page=1&size=500&orderby=created_at%20DESC`,
        { headers: { "x-organization-id": organizationId } },
      );
      const msgsData = await msgsRes.json();
      const messages: any[] = Array.isArray(msgsData?.data) ? msgsData.data : [];

      const newContactIdMap = new Map<string, number>();
      const backendLabelMap = new Map<string, string>(); // mobileNo → single label from backend
      const seen = new Set<string>();

      for (const msg of messages) {
        const no: string = msg.mobile_no;
        if (!no) continue;
        if (msg.contact_id) newContactIdMap.set(no, msg.contact_id);
        if (!seen.has(no)) {
          seen.add(no);
          if (msg.label) backendLabelMap.set(no, msg.label);
        }
      }

      contactIdMapRef.current = newContactIdMap;

      // 3. Build Tag objects — names from backend + locally created, colors from localStorage
      const colors = getColors();
      const allNames = Array.from(new Set([...labelNames, ...Object.keys(colors)]));
      setTags(allNames.map((name, i) => ({
        id: name, name, color: colors[name] ?? colorForIndex(i), createdAt: new Date().toISOString(),
      })));

      // 4. Merge assignments:
      //    - Backend label is authoritative (overrides stale localStorage for the same contact)
      //    - Purely local tags (no backend label for that contact) are preserved
      const stored = getAssignments();

      // Keep local entries only if they match the backend label, or if the contact has no backend label
      const merged: TagContact[] = stored.filter((tc) => {
        const backendLabel = backendLabelMap.get(tc.mobileNo);
        return !backendLabel || tc.tagId === backendLabel;
      });

      // Add backend labels for contacts not already represented in merged
      const mergedKeys = new Set(merged.map((tc) => `${tc.mobileNo}:${tc.tagId}`));
      for (const [mobileNo, label] of Array.from(backendLabelMap.entries())) {
        if (!mergedKeys.has(`${mobileNo}:${label}`)) {
          merged.push({ tagId: label, mobileNo, addedAt: new Date().toISOString() });
        }
      }

      // Persist merged state so backend-seeded contacts survive next refresh
      saveAssignments(merged);
      setTagContacts(merged);

    } catch {
      setTagContacts(getAssignments());
    } finally {
      setTagsLoading(false);
    }
  }, [organizationId, getColors, getAssignments, saveAssignments]);

  useEffect(() => {
    if (!configLoading && organizationId) loadFromBackend();
  }, [configLoading, organizationId, loadFromBackend]);

  // ── Tag CRUD ────────────────────────────────────────────────────────────────

  const addTag = useCallback(
    (name: string, color: string): Tag => {
      const trimmed = name.trim();
      const tag: Tag = { id: trimmed, name: trimmed, color, createdAt: new Date().toISOString() };
      const colors = getColors();
      colors[trimmed] = color;
      saveColors(colors);
      setTags((prev) => (prev.some((t) => t.id === trimmed) ? prev : [...prev, tag]));
      // Backend label is created implicitly when first assigned to a contact
      return tag;
    },
    [getColors, saveColors],
  );

  const removeTag = useCallback(
    (tagId: string) => {
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      const updated = getAssignments().filter((tc) => tc.tagId !== tagId);
      saveAssignments(updated);
      setTagContacts(updated);
      const colors = getColors();
      delete colors[tagId];
      saveColors(colors);
    },
    [getColors, saveColors, getAssignments, saveAssignments],
  );

  // ── Contact↔Tag mutations ───────────────────────────────────────────────────

  const addContactToTag = useCallback(
    (mobileNo: string, tagId: string) => {
      const contactId = contactIdMapRef.current.get(mobileNo);
      if (!contactId) return;

      // Persist to localStorage (multi-tag source of truth)
      const current = getAssignments();
      if (!current.some((tc) => tc.tagId === tagId && tc.mobileNo === mobileNo)) {
        const updated = [...current, { tagId, mobileNo, addedAt: new Date().toISOString() }];
        saveAssignments(updated);
        setTagContacts(updated);
      }

      // TODO: Once backend supports multi-label, replace this single PATCH with
      //       POST /api/v1/organization/{orgId}/contact/{contactId}/labels { label: tagId }
      //       and remove the localStorage sync above entirely.
      fetch(`/api/tags?organizationId=${encodeURIComponent(organizationId ?? "")}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: contactId, label: tagId }),
      })
        .catch(() => { /* ignore */ });
    },
    [organizationId, getAssignments, saveAssignments],
  );

  const removeContactFromTag = useCallback(
    (mobileNo: string, tagId: string) => {
      const contactId = contactIdMapRef.current.get(mobileNo);
      if (!contactId) {
        console.warn("[TagsContext] Cannot remove tag for", mobileNo, "— no contact_id.");
        return;
      }

      // Remove from localStorage
      const updated = getAssignments().filter((tc) => !(tc.tagId === tagId && tc.mobileNo === mobileNo));
      saveAssignments(updated);
      setTagContacts(updated);

      // TODO: Once backend supports multi-label, replace with
      //       DELETE /api/v1/organization/{orgId}/contact/{contactId}/labels/{tagId}
      const remainingTag = updated.find((tc) => tc.mobileNo === mobileNo)?.tagId ?? "";
      fetch(`/api/tags?organizationId=${encodeURIComponent(organizationId ?? "")}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: contactId, label: remainingTag }),
      })
        .then((r) => r.json())
        .then((d) => console.log("[TagsContext] Tag removal synced:", d))
        .catch((err) => console.error("[TagsContext] removeContactFromTag error:", err));
    },
    [organizationId, getAssignments, saveAssignments],
  );

  // ── Derived getters ─────────────────────────────────────────────────────────

  const getTagsForContact = useCallback(
    (mobileNo: string): Tag[] => {
      const ids = tagContacts.filter((tc) => tc.mobileNo === mobileNo).map((tc) => tc.tagId);
      return tags.filter((t) => ids.includes(t.id));
    },
    [tags, tagContacts],
  );

  const getContactsForTag = useCallback(
    (tagId: string): string[] =>
      tagContacts.filter((tc) => tc.tagId === tagId).map((tc) => tc.mobileNo),
    [tagContacts],
  );

  return (
    <TagsContext.Provider
      value={{
        tags,
        tagContacts,
        tagsLoading,
        addTag,
        removeTag,
        addContactToTag,
        removeContactFromTag,
        getTagsForContact,
        getContactsForTag,
      }}
    >
      {children}
    </TagsContext.Provider>
  );
}

export function useTags() {
  const ctx = useContext(TagsContext);
  if (!ctx) throw new Error("useTags must be used within TagsProvider");
  return ctx;
}
