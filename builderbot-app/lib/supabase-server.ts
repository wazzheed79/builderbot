import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { BusinessProfile, Quote } from "./storage";
import { isPublicQuoteToken } from "./public-quote.mjs";
import { displayBusinessName, hasBusinessName } from "./business-name.mjs";
import { isSupabaseConfigured, mapRowToQuote } from "./supabase";

let serverInstance: SupabaseClient | null = null;
let serviceInstance: SupabaseClient | null = null;
let serviceInstanceKey = "";

/**
 * Server lookup client. The key is read here, in a file the browser never
 * imports, so the service role is not stripped out of the shared client bundle.
 * If that key is missing, the anon key is used and public reads go through
 * get_public_quote, which the anon key is allowed to call.
 */
export function getServerSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!serverInstance && supabaseUrl && key) {
    serverInstance = createClient(supabaseUrl, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverInstance;
}

/**
 * Quota and other private writes. This never falls back to the anon key, and it
 * does not reuse a client that was opened with that key.
 */
export function getServiceRoleSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key || !supabaseUrl.startsWith("http")) return null;
  if (!serviceInstance || serviceInstanceKey !== key) {
    serviceInstanceKey = key;
    serviceInstance = createClient(supabaseUrl, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return serviceInstance;
}

type PublicPayload = {
  quote?: Record<string, unknown>;
  contractor?: Record<string, unknown>;
  isExpired?: boolean;
};

function quoteFromPublicPayload(payload: PublicPayload): {
  quote: Quote;
  contractor: Partial<BusinessProfile>;
  isExpired: boolean;
} | null {
  const raw = payload.quote;
  if (!raw || typeof raw !== "object") return null;
  const quote = mapRowToQuote({
    id: raw.id,
    token: raw.token,
    client_name: raw.clientName,
    client_company: raw.clientCompany,
    client_address: raw.clientAddress,
    client_phone: raw.clientPhone,
    client_email: raw.clientEmail,
    title: raw.title,
    notes: raw.notes,
    items: raw.items,
    photos: raw.photos,
    subtotal: raw.subtotal,
    vat_enabled: raw.vatEnabled,
    vat: raw.vat,
    total: raw.total,
    deposit_percent: raw.depositPercent,
    deposit: raw.deposit,
    status: raw.status,
    viewed_at: raw.viewedAt,
    view_count: raw.viewCount,
    options: raw.options,
    selected_option_id: raw.selectedOptionId,
    accepted_signature_name: raw.acceptedSignatureName,
    accepted_at: raw.acceptedAt,
    rejected_reason: raw.rejectedReason,
    rejected_at: raw.rejectedAt,
    created_at: raw.createdAt,
  });
  const contractorRaw = payload.contractor || {};
  const rawCompany = contractorRaw.companyName ? String(contractorRaw.companyName) : "";
  const contractor: Partial<BusinessProfile> = {
    companyName: hasBusinessName(rawCompany) ? rawCompany.trim() : undefined,
    tradingName: contractorRaw.tradingName ? String(contractorRaw.tradingName) : undefined,
    ownerName: contractorRaw.ownerName ? String(contractorRaw.ownerName) : undefined,
    trade: contractorRaw.trade ? String(contractorRaw.trade) : undefined,
    phone: contractorRaw.phone ? String(contractorRaw.phone) : undefined,
    email: contractorRaw.email ? String(contractorRaw.email) : undefined,
    address: contractorRaw.address ? String(contractorRaw.address) : undefined,
    accreditations: Array.isArray(contractorRaw.accreditations)
      ? (contractorRaw.accreditations as string[])
      : [],
    termsAndConditions: contractorRaw.termsAndConditions
      ? String(contractorRaw.termsAndConditions)
      : undefined,
    vatRegistered: Boolean(contractorRaw.vatRegistered),
    vatNumber: contractorRaw.vatNumber ? String(contractorRaw.vatNumber) : undefined,
    bankName: contractorRaw.bankName ? String(contractorRaw.bankName) : undefined,
    bankSortCode: contractorRaw.bankSortCode ? String(contractorRaw.bankSortCode) : undefined,
    bankAccountNumber: contractorRaw.bankAccountNumber
      ? String(contractorRaw.bankAccountNumber)
      : undefined,
  };
  return {
    quote,
    contractor,
    isExpired: Boolean(payload.isExpired) || quote.status === "Expired",
  };
}

async function readPublicQuote(token: string): Promise<PublicPayload | null> {
  const sb = getServerSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc("get_public_quote", { lookup_token: token });
  if (error || data == null || typeof data !== "object") return null;
  return data as PublicPayload;
}

/** True when this address is not a real customer quote. A database outage does not count. */
export async function isMissingPublicQuote(token: string): Promise<boolean> {
  if (!isPublicQuoteToken(token)) return true;
  const sb = getServerSupabase();
  if (!sb) return false;
  const { data, error } = await sb.rpc("get_public_quote", { lookup_token: token });
  if (error) return false;
  return data == null;
}

export async function fetchPublicQuoteCard(token: string): Promise<{
  company: string;
  jobTitle: string;
  total: number;
  heading: string;
} | null> {
  if (!isPublicQuoteToken(token)) return null;
  try {
    const payload = await readPublicQuote(token);
    if (!payload?.quote) return null;
    const companyName = String(payload.contractor?.companyName || "");
    const ownerName = String(payload.contractor?.ownerName || "").trim();
    const business = hasBusinessName(companyName) ? companyName.trim() : "";
    const company = business || displayBusinessName("", ownerName);
    const jobTitle = String(payload.quote.title || "Trade quote").trim();
    const heading = business
      ? `Quote from ${business}`
      : ownerName
        ? `Quote from ${ownerName}`
        : jobTitle
          ? `Quote: ${jobTitle}`
          : "Your quote";
    return { company, jobTitle, total: Number(payload.quote.total) || 0, heading };
  } catch {
    return null;
  }
}

export async function quoteOwnerId(token: string): Promise<string | null> {
  const sb = getServerSupabase();
  if (!sb || !isPublicQuoteToken(token)) return null;
  const { data, error } = await sb.from("quotes").select("owner_id").eq("token", token).maybeSingle();
  if (error || !data?.owner_id) return null;
  return String(data.owner_id);
}

export async function recordCustomerQuoteView(token: string): Promise<{ viewCount: number } | null> {
  const sb = getServerSupabase();
  if (!sb || !isPublicQuoteToken(token)) return null;
  const { data, error } = await sb.rpc("record_public_quote_view", { lookup_token: token });
  if (error || !data || typeof data !== "object") return null;
  const row = data as { counted?: boolean; view_count?: number };
  if (!row.counted) return null;
  return { viewCount: Number(row.view_count) || 0 };
}

export async function fetchPublicQuoteByToken(token: string): Promise<{
  quote: Quote;
  contractor: Partial<BusinessProfile>;
  isExpired: boolean;
} | null> {
  if (!isPublicQuoteToken(token)) return null;
  try {
    const payload = await readPublicQuote(token);
    if (!payload) return null;
    return quoteFromPublicPayload(payload);
  } catch (err) {
    console.error("Error in fetchPublicQuoteByToken:", err);
    return null;
  }
}

export async function submitPublicDecision(
  token: string,
  decision: "Accepted" | "Rejected",
  metadata: { signatureName?: string; reason?: string; clientIp?: string; selectedOptionId?: string }
): Promise<{ success: boolean; error?: string }> {
  const sb = getServerSupabase();
  if (!sb) {
    return { success: false, error: "Database service unavailable." };
  }
  if (!isPublicQuoteToken(token)) {
    return { success: false, error: "Quote not found." };
  }

  try {
    const { data, error } = await sb.rpc("submit_public_quote_decision", {
      lookup_token: token,
      new_decision: decision,
      p_signature_name: metadata.signatureName || null,
      p_decline_reason: metadata.reason || null,
      p_client_ip: metadata.clientIp || null,
      p_selected_option: metadata.selectedOptionId || null,
    });
    if (error) {
      return { success: false, error: "Quote not found." };
    }
    const row = (data || {}) as { success?: boolean; error?: string };
    if (!row.success) {
      return { success: false, error: row.error || "Quotation cannot be modified." };
    }
    return { success: true };
  } catch (err) {
    console.error("Error in submitPublicDecision:", err);
    return { success: false, error: "Failed to record decision." };
  }
}
