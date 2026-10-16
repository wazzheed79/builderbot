import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Quote, Customer, BusinessProfile } from "./storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http"));
};

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// Convert Supabase DB row to Quote object
export function mapRowToQuote(row: Record<string, unknown>): Quote {
  return {
    id: String(row.id),
    token: String(row.token),
    customerId: row.customer_id ? String(row.customer_id) : undefined,
    clientName: String(row.client_name ?? ""),
    clientCompany: row.client_company ? String(row.client_company) : undefined,
    clientAddress: String(row.client_address ?? ""),
    clientPhone: row.client_phone ? String(row.client_phone) : undefined,
    clientEmail: row.client_email ? String(row.client_email) : undefined,
    title: String(row.title ?? ""),
    notes: String(row.notes ?? ""),
    items: Array.isArray(row.items) ? (row.items as Quote["items"]) : [],
    subtotal: Number(row.subtotal ?? 0),
    vatEnabled: Boolean(row.vat_enabled ?? true),
    vat: Number(row.vat ?? 0),
    total: Number(row.total ?? 0),
    depositPercent: Number(row.deposit_percent ?? 20),
    deposit: Number(row.deposit ?? 0),
    status: (row.status as Quote["status"]) || "Draft",
    acceptedSignatureName: row.accepted_signature_name ? String(row.accepted_signature_name) : undefined,
    acceptedAt: row.accepted_at ? String(row.accepted_at) : undefined,
    rejectedReason: row.rejected_reason ? String(row.rejected_reason) : undefined,
    rejectedAt: row.rejected_at ? String(row.rejected_at) : undefined,
    createdAt: row.created_at ? String(row.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
  };
}

// Convert Quote object to Supabase DB payload
export function mapQuoteToRow(quote: Quote) {
  return {
    id: quote.id,
    token: quote.token,
    customer_id: quote.customerId || null,
    client_name: quote.clientName,
    client_company: quote.clientCompany || null,
    client_address: quote.clientAddress,
    client_phone: quote.clientPhone || null,
    client_email: quote.clientEmail || null,
    title: quote.title,
    notes: quote.notes,
    items: quote.items,
    subtotal: quote.subtotal,
    vat_enabled: quote.vatEnabled,
    vat: quote.vat,
    total: quote.total,
    deposit_percent: quote.depositPercent,
    deposit: quote.deposit,
    status: quote.status,
    accepted_signature_name: quote.acceptedSignatureName || null,
    accepted_at: quote.acceptedAt || null,
    rejected_reason: quote.rejectedReason || null,
    rejected_at: quote.rejectedAt || null,
  };
}

// Supabase Async Operations
export async function syncQuoteToCloud(quote: Quote): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from("quotes").upsert(mapQuoteToRow(quote));
    return !error;
  } catch (err) {
    console.error("Failed to sync quote to Supabase:", err);
    return false;
  }
}

export async function fetchQuoteByTokenOrIdFromCloud(tokenOrId: string): Promise<Quote | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from("quotes")
      .select("*")
      .or(`token.eq.${tokenOrId},id.eq.${tokenOrId}`)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToQuote(data);
  } catch (err) {
    console.error("Failed to fetch quote from Supabase:", err);
    return null;
  }
}

export async function updateCloudQuoteStatus(
  idOrToken: string,
  status: Quote["status"],
  metadata?: { signatureName?: string; reason?: string }
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status,
      ...(status === "Accepted" && metadata?.signatureName
        ? { accepted_signature_name: metadata.signatureName, accepted_at: now }
        : {}),
      ...(status === "Rejected" && metadata?.reason
        ? { rejected_reason: metadata.reason, rejected_at: now }
        : {}),
    };

    const { error } = await sb
      .from("quotes")
      .update(updatePayload)
      .or(`token.eq.${idOrToken},id.eq.${idOrToken}`);

    return !error;
  } catch (err) {
    console.error("Failed to update quote status in Supabase:", err);
    return false;
  }
}

export async function syncCustomerToCloud(customer: Customer): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from("customers").upsert({
      id: customer.id,
      name: customer.name,
      company: customer.company || null,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes || null,
      created_at: customer.createdAt,
    });
    return !error;
  } catch (err) {
    console.error("Failed to sync customer to Supabase:", err);
    return false;
  }
}

export async function syncProfileToCloud(profile: BusinessProfile): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from("profiles").upsert({
      id: "default",
      company_name: profile.companyName,
      trading_name: profile.tradingName || null,
      owner_name: profile.ownerName,
      phone: profile.phone,
      email: profile.email,
      website: profile.website || null,
      address: profile.address,
      trade: profile.trade,
      vat_registered: profile.vatRegistered,
      vat_number: profile.vatNumber || null,
      bank_name: profile.bankName || null,
      bank_sort_code: profile.bankSortCode || null,
      bank_account_number: profile.bankAccountNumber || null,
      accreditations: profile.accreditations,
      default_deposit_percent: profile.defaultDepositPercent,
      payment_terms_days: profile.paymentTermsDays,
      quote_validity_days: profile.quoteValidityDays,
      terms_and_conditions: profile.termsAndConditions || null,
    });
    return !error;
  } catch (err) {
    console.error("Failed to sync profile to Supabase:", err);
    return false;
  }
}
