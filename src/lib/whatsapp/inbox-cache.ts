import { loadNames } from "@/lib/whatsapp/name-cache";

export interface Recipient {
  mobile_no: string;
  name: string;
  message_count: number;
  last_message_date: string;
  last_message?: string;
  has_unread: boolean;
  unread_message_ids: number[];
}

export interface ConversationsCache {
  conversations: Recipient[];
  newestMessageAt: string;
  cachedAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function cacheKey(orgId: string) {
  return `inbox-conversations-v2-${orgId}`;
}

export function readCache(orgId: string): ConversationsCache | null {
  try {
    const raw = localStorage.getItem(cacheKey(orgId));
    if (!raw) return null;
    const c = JSON.parse(raw) as ConversationsCache;
    if (Date.now() - c.cachedAt > CACHE_TTL_MS) return null;
    return c;
  } catch { return null; }
}

export function writeCache(orgId: string, data: ConversationsCache) {
  try { localStorage.setItem(cacheKey(orgId), JSON.stringify(data)); } catch { /* storage quota */ }
}

// Mutates map in place, returns updated newestAt
export function applyMessages(
  map: Map<string, Recipient>,
  msgs: any[],
  newestAt: string,
): string {
  for (const msg of msgs) {
    const no: string = msg.mobile_no;
    if (!no) continue;
    const msgDate: string = msg.created_at || msg.updated_at || "";
    if (msgDate > newestAt) newestAt = msgDate;
    const isUnread = msg.direction === "INBOUND" && !msg.read_at;

    if (!map.has(no)) {
      map.set(no, {
        mobile_no: no,
        name: "",
        message_count: 1,
        last_message_date: msgDate,
        last_message: msg.content || `[${msg.type}]`,
        has_unread: isUnread,
        unread_message_ids: isUnread ? [msg.id] : [],
      });
    } else {
      const e = map.get(no)!;
      e.message_count++;
      if (msgDate > e.last_message_date) {
        e.last_message_date = msgDate;
        e.last_message = msg.content || `[${msg.type}]`;
      }
      if (isUnread && !e.unread_message_ids.includes(msg.id)) {
        e.has_unread = true;
        e.unread_message_ids.push(msg.id);
      } else if (!isUnread) {
        // Message now has read_at set — remove it from the unread list
        const idx = e.unread_message_ids.indexOf(msg.id);
        if (idx !== -1) {
          e.unread_message_ids.splice(idx, 1);
          if (e.unread_message_ids.length === 0) e.has_unread = false;
        }
      }
    }
  }
  return newestAt;
}

export function sortedConversations(map: Map<string, Recipient>): Recipient[] {
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.last_message_date).getTime() - new Date(a.last_message_date).getTime(),
  );
}

export function hydrateNamesFromCache(list: Recipient[], orgId: string): Recipient[] {
  const nameCache = loadNames(orgId);
  return list.map((r) => {
    if (r.name) return r;
    const c = nameCache[r.mobile_no];
    if (!c) return r;
    const raw = [c.firstName, c.lastName].filter(Boolean).join(" ");
    if (!raw) return r;
    const name = c.maybe ? `Maybe: ${raw}` : raw;
    return { ...r, name };
  });
}

export async function fetchInboxMessages(
  orgId: string,
  extra: Record<string, string> = {},
): Promise<any[]> {
  const params = new URLSearchParams({
    page: "1",
    size: "5000",
    orderby: "created_at DESC",
    ...extra,
  });
  try {
    const res = await fetch(`/api/whatsapp/whatsapp-internal/messages/list?${params}`, {
      headers: { "x-organization-id": orgId },
    });
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch { return []; }
}
