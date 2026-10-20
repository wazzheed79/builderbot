import { getSupabase } from "@/lib/supabase";
import { priceKey } from "@/lib/price-memory.mjs";
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
