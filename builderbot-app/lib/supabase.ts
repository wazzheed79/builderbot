import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Quote, Customer, BusinessProfile, roundMoney } from "./storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http"));
};

let clientInstance: SupabaseClient | null = null;
let serverInstance: SupabaseClient | null = null;

// Browser / Authenticated Client
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!clientInstance && supabaseUrl && supabaseAnonKey) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}

// Server-Side Client (Uses service role if available for secure token-based lookups)
export function getServerSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!serverInstance && supabaseUrl && key) {
    serverInstance = createClient(supabaseUrl, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverInstance;
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
    viewedAt: row.viewed_at ? String(row.viewed_at) : undefined,
    acceptedSignatureName: row.accepted_signature_name ? String(row.accepted_signature_name) : undefined,
    acceptedAt: row.accepted_at ? String(row.accepted_at) : undefined,
    rejectedReason: row.rejected_reason ? String(row.rejected_reason) : undefined,
    rejectedAt: row.rejected_at ? String(row.rejected_at) : undefined,
    createdAt: row.created_at ? String(row.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
  };
}

// Recalculate totals server-side to prevent client tampering
export function recalculateQuoteTotals(
  items: Quote["items"],
  vatEnabled: boolean,
  depositPercent: number
) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.rate), 0)
  );
  const vat = roundMoney(vatEnabled ? subtotal * 0.2 : 0);
  const total = roundMoney(subtotal + vat);
  const deposit = roundMoney((total * Math.max(0, Math.min(100, depositPercent))) / 100);

  return { subtotal, vat, total, deposit };
}

// SECURE Token-Only Public Quote Fetcher
export async function fetchPublicQuoteByToken(token: string): Promise<{
  quote: Quote;
  contractor: Partial<BusinessProfile>;
  isExpired: boolean;
} | null> {
  const sb = getServerSupabase();
  if (!sb) return null;

  try {
    // 1. Strict query by unguessable token only (never guessable sequential ID)
    const { data: quoteRow, error: quoteErr } = await sb
      .from("quotes")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (quoteErr || !quoteRow) return null;

    const quote = mapRowToQuote(quoteRow);

    // 2. Fetch contractor profile
    let contractor: Partial<BusinessProfile> = {};
    let validityDays = 30;

    if (quoteRow.owner_id) {
      const { data: profRow } = await sb
        .from("profiles")
        .select("*")
        .eq("owner_id", quoteRow.owner_id)
        .maybeSingle();

      if (profRow) {
        validityDays = profRow.quote_validity_days || 30;
        contractor = {
          companyName: profRow.company_name,
          tradingName: profRow.trading_name,
          ownerName: profRow.owner_name,
          trade: profRow.trade,
          phone: profRow.phone,
          email: profRow.email,
          address: profRow.address,
          accreditations: profRow.accreditations || [],
          termsAndConditions: profRow.terms_and_conditions,
          vatRegistered: profRow.vat_registered,
          vatNumber: profRow.vat_number,
          // BANK DETAILS: Only revealed if quote is accepted!
          bankName: quote.status === "Accepted" ? profRow.bank_name : undefined,
          bankSortCode: quote.status === "Accepted" ? profRow.bank_sort_code : undefined,
          bankAccountNumber: quote.status === "Accepted" ? profRow.bank_account_number : undefined,
        };
      }
    }

    // 3. Server-side Expiry Check & Viewed Tracking
    const createdAtMs = new Date(quoteRow.created_at).getTime();
    const expiryMs = createdAtMs + validityDays * 24 * 60 * 60 * 1000;
    const isExpired = Date.now() > expiryMs;

    if (isExpired && (quote.status === "Sent" || quote.status === "Viewed")) {
      quote.status = "Expired";
      await sb.from("quotes").update({ status: "Expired", updated_at: new Date().toISOString() }).eq("token", token);
    } else if (!isExpired && quote.status === "Sent") {
      // First time client opens the quote! Transition to "Viewed" and timestamp it.
      const now = new Date().toISOString();
      quote.status = "Viewed";
      quote.viewedAt = now;
      await sb
        .from("quotes")
        .update({ status: "Viewed", viewed_at: now, updated_at: now })
        .eq("token", token);
    }

    return { quote, contractor, isExpired };
  } catch (err) {
    console.error("Error in fetchPublicQuoteByToken:", err);
    return null;
  }
}

// SECURE Public Decision Submitter (Accept / Reject)
export async function submitPublicDecision(
  token: string,
  decision: "Accepted" | "Rejected",
  metadata: { signatureName?: string; reason?: string; clientIp?: string }
): Promise<{ success: boolean; error?: string }> {
  const sb = getServerSupabase();
  if (!sb) {
    return { success: false, error: "Database service unavailable." };
  }

  try {
    // 1. Fetch current quote by token
    const { data: currentQuote, error: fetchErr } = await sb
      .from("quotes")
      .select("id, status, created_at, owner_id")
      .eq("token", token)
      .maybeSingle();

    if (fetchErr || !currentQuote) {
      return { success: false, error: "Quote not found." };
    }

    // 2. Strict State Transition Rule: ONLY 'Sent' or 'Viewed' quotes can be accepted or rejected
    if (currentQuote.status !== "Sent" && currentQuote.status !== "Viewed") {
      return {
        success: false,
        error: `Quote cannot be modified. Current status: ${currentQuote.status}`,
      };
    }

    // 3. Expiry Check
    let validityDays = 30;
    if (currentQuote.owner_id) {
      const { data: prof } = await sb
        .from("profiles")
        .select("quote_validity_days")
        .eq("owner_id", currentQuote.owner_id)
        .maybeSingle();
      if (prof?.quote_validity_days) validityDays = prof.quote_validity_days;
    }

    const expiryMs = new Date(currentQuote.created_at).getTime() + validityDays * 24 * 60 * 60 * 1000;
    if (Date.now() > expiryMs) {
      await sb.from("quotes").update({ status: "Expired" }).eq("token", token);
      return { success: false, error: "This quotation has expired and can no longer be accepted." };
    }

    // 4. Apply status with audit log (timestamp + IP)
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: decision,
      updated_at: now,
    };

    if (decision === "Accepted") {
      const cleanSig = (metadata.signatureName || "").trim();
      if (!cleanSig) {
        return { success: false, error: "A legal signature name is required to accept this quote." };
      }
      updatePayload.accepted_signature_name = cleanSig.slice(0, 100);
      updatePayload.accepted_at = now;
      if (metadata.clientIp) updatePayload.accepted_ip = metadata.clientIp;
    } else {
      updatePayload.rejected_reason = (metadata.reason || "").trim().slice(0, 1000);
      updatePayload.rejected_at = now;
      if (metadata.clientIp) updatePayload.rejected_ip = metadata.clientIp;
    }

    const { error: updateErr } = await sb
      .from("quotes")
      .update(updatePayload)
      .eq("token", token);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in submitPublicDecision:", err);
    return { success: false, error: "Failed to record decision." };
  }
}

// Background sync helpers (authenticated)
export async function syncQuoteToCloud(quote: Quote): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { data: userData } = await sb.auth.getUser();
    const ownerId = userData?.user?.id;
    if (!ownerId) return false; // Private: requires logged-in user

    const recalculated = recalculateQuoteTotals(quote.items, quote.vatEnabled, quote.depositPercent);

    const { error } = await sb.from("quotes").upsert({
      id: quote.id,
      token: quote.token,
      owner_id: ownerId,
      customer_id: quote.customerId || null,
      client_name: quote.clientName,
      client_company: quote.clientCompany || null,
      client_address: quote.clientAddress,
      client_phone: quote.clientPhone || null,
      client_email: quote.clientEmail || null,
      title: quote.title,
      notes: quote.notes,
      items: quote.items,
      subtotal: recalculated.subtotal,
      vat_enabled: quote.vatEnabled,
      vat: recalculated.vat,
      total: recalculated.total,
      deposit_percent: quote.depositPercent,
      deposit: recalculated.deposit,
      status: quote.status,
      accepted_signature_name: quote.acceptedSignatureName || null,
      accepted_at: quote.acceptedAt || null,
      rejected_reason: quote.rejectedReason || null,
      rejected_at: quote.rejectedAt || null,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function syncCustomerToCloud(customer: Customer): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { data: userData } = await sb.auth.getUser();
    const ownerId = userData?.user?.id;
    if (!ownerId) return false;

    const { error } = await sb.from("customers").upsert({
      id: customer.id,
      owner_id: ownerId,
      name: customer.name,
      company: customer.company || null,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes || null,
      created_at: customer.createdAt,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function syncProfileToCloud(profile: BusinessProfile): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { data: userData } = await sb.auth.getUser();
    const ownerId = userData?.user?.id;
    if (!ownerId) return false;

    const { error } = await sb.from("profiles").upsert({
      owner_id: ownerId,
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
  } catch {
    return false;
  }
}

export async function updateCloudQuoteStatus(
  idOrToken: string,
  status: Quote["status"],
  metadata?: {
    signatureName?: string;
    reason?: string;
  }
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (metadata?.signatureName) {
      updatePayload.accepted_signature_name = metadata.signatureName;
      updatePayload.accepted_at = new Date().toISOString();
    }
    if (metadata?.reason) {
      updatePayload.rejected_reason = metadata.reason;
      updatePayload.rejected_at = new Date().toISOString();
    }

    const isToken = idOrToken.startsWith("q_");
    const query = isToken
      ? sb.from("quotes").update(updatePayload).eq("token", idOrToken)
      : sb.from("quotes").update(updatePayload).eq("id", idOrToken);

    const { error } = await query;
    return !error;
  } catch {
    return false;
  }
}

