import { supabase } from "@/integrations/supabase/client";

const SNAPSHOT_KEY = "meallink:dipendente:snapshot";
const QUEUE_KEY = "meallink:dipendente:pendingOrders";

export interface PendingOrder {
  user_id: string;
  menu_id: string;
  selected_dishes: string[];
  is_takeaway: boolean;
  takeaway_time: string | null;
  notes: string | null;
  feedback: string | null;
  queued_at: string;
}

export function saveSnapshot(data: unknown) {
  try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ savedAt: Date.now(), data })); } catch { /* quota */ }
}

export function loadSnapshot<T>(): { savedAt: number; data: T } | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getPendingOrders(): PendingOrder[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
}

function setPendingOrders(list: PendingOrder[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("meallink:pending-changed"));
}

export function queueOrder(order: Omit<PendingOrder, "queued_at">) {
  const list = getPendingOrders().filter(
    (o) => !(o.user_id === order.user_id && o.menu_id === order.menu_id),
  );
  list.push({ ...order, queued_at: new Date().toISOString() });
  setPendingOrders(list);
}

export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const msg = String((err as any)?.message || err || "").toLowerCase();
  return msg.includes("failed to fetch") || msg.includes("network") || msg.includes("load failed");
}

/** Sends queued orders. Returns counts of synced and rejected (e.g. after deadline). */
export async function flushPendingOrders(): Promise<{ synced: number; rejected: number }> {
  const list = getPendingOrders();
  if (list.length === 0 || !navigator.onLine) return { synced: 0, rejected: 0 };
  const remaining: PendingOrder[] = [];
  let synced = 0, rejected = 0;
  for (const o of list) {
    const { queued_at, ...payload } = o;
    try {
      const { error } = await supabase.from("meal_orders").upsert(payload, { onConflict: "user_id,menu_id" });
      if (error) {
        if (isNetworkError(error)) remaining.push(o);
        else rejected++;
      } else synced++;
    } catch (e) {
      if (isNetworkError(e)) remaining.push(o); else rejected++;
    }
  }
  setPendingOrders(remaining);
  return { synced, rejected };
}
