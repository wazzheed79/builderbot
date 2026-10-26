import { getSupabase } from "@/lib/supabase";
import { planPriceListDelete, planPriceListUpsert, priceKey } from "@/lib/price-memory.mjs";
import type { LineItem } from "@/lib/storage";
import { savePricingMemory, getPricingMemory } from "@/lib/storage";

export interface RememberedPrice {
  key: string;
  description: string;
  unit: string;
  rate: number;
  itemType?: "labor" | "material" | "service";
}

const pending = new Map<string, number>();

export async function loadRememberedPrices(): Promise<RememberedPrice[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session?.user?.id) return [];
  const { data, error } = await sb
    .from("price_memory")
    .select("item_key, description, unit, rate, item_type")
    .order("updated_at", { ascending: false })
    .limit(80);
  if (error || !data) return [];
  return data.map((row) => ({
    key: String(row.item_key),
    description: String(row.description || ""),
    unit: String(row.unit || ""),
    rate: Number(row.rate) || 0,
    itemType: row.item_type === "labor" || row.item_type === "service" ? row.item_type : "material",
  }));
}

async function writeRememberedPrice(item: LineItem) {
  const sb = getSupabase();
  if (!sb || !item.description.trim() || !(item.rate >= 0)) return;
  const { data: sessionData } = await sb.auth.getSession();
  const ownerId = sessionData.session?.user?.id;
  if (!ownerId) return;
  const key = priceKey(item.description, item.unit);
  await sb.from("price_memory").upsert({
    owner_id: ownerId,
    item_key: key,
    description: item.description.trim().slice(0, 180),
    unit: item.unit || "unit",
    rate: item.rate,
    item_type: item.type === "labor" || item.type === "service" ? item.type : "material",
    updated_at: new Date().toISOString(),
  });

  if (item.type === "labor" && /hr/i.test(item.unit || "")) {
    const current = getPricingMemory();
    savePricingMemory({
      ...current,
      laborHourlyRate: item.rate,
      laborDayRate: Math.round(item.rate * 8),
      updatedAt: new Date().toISOString(),
    });
  }
}

export type PriceListResult =
  | { ok: true; items: RememberedPrice[] }
  | { ok: false; error: string };

function mapRemembered(rows: RememberedPrice[]): RememberedPrice[] {
  return rows.map((row) => ({
    key: row.key,
    description: row.description,
    unit: row.unit,
    rate: row.rate,
    itemType: row.itemType === "labor" || row.itemType === "service" ? row.itemType : "material",
  }));
}

async function signedInOwnerId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user?.id ?? null;
}

/** The signed-in tradesperson's prices. Guests get an empty list and nothing is written. */
export async function loadPriceList(): Promise<PriceListResult> {
  const sb = getSupabase();
  const ownerId = await signedInOwnerId();
  if (!sb || !ownerId) return { ok: false, error: "Sign in to save your price list." };
  const { data, error } = await sb
    .from("price_memory")
    .select("item_key, description, unit, rate, item_type")
    .order("updated_at", { ascending: false })
    .limit(80);
  if (error || !data) return { ok: false, error: "Could not load your price list. Try again." };
  return { ok: true, items: mapRemembered(data.map((row) => ({
    key: String(row.item_key),
    description: String(row.description || ""),
    unit: String(row.unit || ""),
    rate: Number(row.rate) || 0,
    itemType: row.item_type === "labor" || row.item_type === "service" ? row.item_type : "material",
  }))) };
}

async function writePriceRow(ownerId: string, item: RememberedPrice) {
  const sb = getSupabase();
  if (!sb) return { ok: false as const, error: "Sign in to save your price list." };
  const { error } = await sb.from("price_memory").upsert({
    owner_id: ownerId,
    item_key: item.key,
    description: item.description,
    unit: item.unit,
    rate: item.rate,
    item_type: item.itemType === "labor" || item.itemType === "service" ? item.itemType : "material",
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false as const, error: "Could not save that price. Try again." };
  return { ok: true as const };
}

/** Add or update one of the tradesperson's own prices. Does nothing for a guest. */
export async function savePriceListEntry(
  rows: RememberedPrice[],
  input: { description?: string; unit?: string; rate?: number | string; itemType?: string },
  editingKey = ""
): Promise<PriceListResult> {
  const ownerId = await signedInOwnerId();
  if (!ownerId) return { ok: false, error: "Sign in to save your price list." };
  const plan = planPriceListUpsert(rows, input, editingKey) as
    | { ok: false; error: string }
    | { ok: true; item: RememberedPrice; next: RememberedPrice[]; deleteKeys: string[] };
  if (!plan.ok) return plan;
  const wrote = await writePriceRow(ownerId, plan.item);
  if (!wrote.ok) return wrote;
  const sb = getSupabase();
  if (sb && plan.deleteKeys.length > 0) {
    const { error } = await sb
      .from("price_memory")
      .delete()
      .eq("owner_id", ownerId)
      .eq("item_key", plan.deleteKeys[0]);
    if (error) return { ok: false, error: "The new price was saved, but the old name is still there. Delete it from the list." };
  }
  return { ok: true, items: mapRemembered(plan.next) };
}

/** Remove one price. Does nothing for a guest. */
export async function deletePriceListEntry(rows: RememberedPrice[], key: string): Promise<PriceListResult> {
  const ownerId = await signedInOwnerId();
  if (!ownerId) return { ok: false, error: "Sign in to save your price list." };
  const plan = planPriceListDelete(rows, key) as
    | { ok: false; error: string }
    | { ok: true; next: RememberedPrice[]; deleteKeys: string[] };
  if (!plan.ok) return plan;
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Sign in to save your price list." };
  const { error } = await sb.from("price_memory").delete().eq("owner_id", ownerId).eq("item_key", plan.deleteKeys[0]);
  if (error) return { ok: false, error: "Could not delete that price. Try again." };
  return { ok: true, items: mapRemembered(plan.next) };
}

/** Save a price the tradesperson typed. Waits a moment so each keystroke is not a save. */
export function rememberLinePrice(item: LineItem) {
  if (typeof window === "undefined") return;
  const key = priceKey(item.description, item.unit);
  const existing = pending.get(key);
  if (existing) window.clearTimeout(existing);
  pending.set(
    key,
    window.setTimeout(() => {
      pending.delete(key);
      void writeRememberedPrice(item);
    }, 700)
  );
}
