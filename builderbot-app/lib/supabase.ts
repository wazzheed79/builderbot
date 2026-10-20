import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Quote, Customer, BusinessProfile, Job, Invoice } from "./storage";
import {
  roundMoney,
  recalculateQuoteTotals,
  validateStatusTransition,
} from "./quote-rules.mjs";

export { roundMoney, recalculateQuoteTotals, validateStatusTransition };

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
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // The default Magic Link email only has a link. Implicit flow brings
        // that link back as a hash the callback page can turn into a session.
        // PKCE would need a template edit, which the free plan does not allow.
        flowType: "implicit",
        detectSessionInUrl: false,
      },
    });
  }
  return clientInstance;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const sb = getSupabase();
  if (!sb) return headers;
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
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
    viewCount: Number(row.view_count) || 0,
    firstViewedAt: row.first_viewed_at ? String(row.first_viewed_at) : undefined,
    lastViewedAt: row.last_viewed_at ? String(row.last_viewed_at) : undefined,
    sentAt: row.sent_at ? String(row.sent_at) : undefined,
    reminderAfterDays: Number(row.reminder_after_days) || 3,
    options: Array.isArray(row.options) ? (row.options as Quote["options"]) : undefined,
    selectedOptionId: row.selected_option_id ? String(row.selected_option_id) : undefined,
    acceptedSignatureName: row.accepted_signature_name ? String(row.accepted_signature_name) : undefined,
    acceptedAt: row.accepted_at ? String(row.accepted_at) : undefined,
    rejectedReason: row.rejected_reason ? String(row.rejected_reason) : undefined,
    rejectedAt: row.rejected_at ? String(row.rejected_at) : undefined,
    createdAt: row.created_at ? String(row.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
    photos: Array.isArray(row.photos) ? (row.photos as string[]).slice(0, 6) : undefined,
  };
}

// Convert Supabase DB row to Customer object
export function mapRowToCustomer(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    company: row.company ? String(row.company) : undefined,
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    address: String(row.address ?? ""),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: row.created_at ? String(row.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
  };
}

// Convert Supabase DB row to BusinessProfile object
export function mapRowToProfile(row: Record<string, unknown>): BusinessProfile {
  return {
    companyName: String(row.company_name ?? ""),
    tradingName: row.trading_name ? String(row.trading_name) : "",
    ownerName: String(row.owner_name ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    website: row.website ? String(row.website) : "",
    address: String(row.address ?? ""),
    trade: String(row.trade ?? "General Building & Renovation"),
    vatRegistered: Boolean(row.vat_registered ?? false),
    vatNumber: row.vat_number ? String(row.vat_number) : "",
    bankName: row.bank_name ? String(row.bank_name) : "",
    bankSortCode: row.bank_sort_code ? String(row.bank_sort_code) : "",
    bankAccountNumber: row.bank_account_number ? String(row.bank_account_number) : "",
    accreditations: Array.isArray(row.accreditations) ? (row.accreditations as string[]) : [],
    defaultDepositPercent: Number(row.default_deposit_percent ?? 20),
    paymentTermsDays: Number(row.payment_terms_days ?? 7),
    quoteValidityDays: Number(row.quote_validity_days ?? 30),
    termsAndConditions: row.terms_and_conditions ? String(row.terms_and_conditions) : undefined,
    logoUrl: row.logo_url ? String(row.logo_url) : "",
  };
}

// Convert Supabase DB row to Job object
export function mapRowToJob(row: Record<string, unknown>): Job {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    title: String(row.title ?? ""),
    address: String(row.address ?? ""),
    status: (row.status as Job["status"]) || "Quoted",
    notes: row.notes ? String(row.notes) : undefined,
    quoteId: row.quote_id ? String(row.quote_id) : undefined,
    createdAt: row.created_at ? String(row.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
  };
}

// Convert Supabase DB row to Invoice object
export function mapRowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: String(row.id),
    quoteId: row.quote_id ? String(row.quote_id) : undefined,
    jobId: row.job_id ? String(row.job_id) : undefined,
    customerId: String(row.customer_id),
    title: String(row.title ?? ""),
    clientName: String(row.client_name ?? ""),
    clientAddress: String(row.client_address ?? ""),
    clientEmail: row.client_email ? String(row.client_email) : undefined,
    clientPhone: row.client_phone ? String(row.client_phone) : undefined,
    items: Array.isArray(row.items) ? (row.items as Invoice["items"]) : [],
    subtotal: Number(row.subtotal ?? 0),
    vatEnabled: Boolean(row.vat_enabled ?? true),
    vat: Number(row.vat ?? 0),
    total: Number(row.total ?? 0),
    depositPaid: Number(row.deposit_paid ?? 0),
    balanceDue: Number(row.balance_due ?? 0),
    status: (row.status as Invoice["status"]) || "Issued",
    dueDate: row.due_date ? String(row.due_date).split("T")[0] : new Date().toISOString().split("T")[0],
    paidAt: row.paid_at ? String(row.paid_at) : undefined,
    createdAt: row.created_at ? String(row.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
  };
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
  metadata: { signatureName?: string; reason?: string; clientIp?: string; selectedOptionId?: string }
): Promise<{ success: boolean; error?: string }> {
  const sb = getServerSupabase();
  if (!sb) {
    return { success: false, error: "Database service unavailable." };
  }

  try {
    // 1. Fetch current quote by token
    const { data: currentQuote, error: fetchErr } = await sb
      .from("quotes")
      .select("id, status, created_at, owner_id, options")
      .eq("token", token)
      .maybeSingle();

    if (fetchErr || !currentQuote) {
      return { success: false, error: "Quote not found." };
    }

    // 2. Expiry Check
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
    const isExpired = Date.now() > expiryMs;

    // 3. Strict State Transition Rule validation
    const transition = validateStatusTransition(currentQuote.status, decision, isExpired);
    if (!transition.allowed) {
      if (isExpired) {
        await sb.from("quotes").update({ status: "Expired" }).eq("token", token);
      }
      return { success: false, error: transition.error || "Quotation cannot be modified." };
    }

    // 4. Apply status with audit log (timestamp + IP)
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: decision,
      updated_at: now,
    };

    if (decision === "Accepted") {
      const options = Array.isArray(currentQuote.options) ? currentQuote.options : [];
      if (options.length > 1) {
        const chosen = options.find(
          (option: { id?: string }) => option?.id === metadata.selectedOptionId
        ) as { id: string; items?: unknown; subtotal?: number; vat?: number; total?: number; deposit?: number } | undefined;
        if (!chosen) {
          return { success: false, error: "Choose Standard, Better, or Premium before you accept." };
        }
        updatePayload.items = chosen.items;
        updatePayload.subtotal = chosen.subtotal;
        updatePayload.vat = chosen.vat;
        updatePayload.total = chosen.total;
        updatePayload.deposit = chosen.deposit;
        updatePayload.selected_option_id = chosen.id;
      }
    }

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

export type CloudSaveResult = { ok: true } | { ok: false; error: string };

function plainCloudError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("customer")) {
    return "The customer record is not online yet. The quote was not saved for sharing.";
  }
  if (text.includes("address")) {
    return "Add an address, then try sharing again.";
  }
  if (text.includes("jwt") || text.includes("session") || text.includes("auth")) {
    return "Your sign-in has expired. Sign in again, then share the quote.";
  }
  return "The quote did not save online. Check your connection and try again.";
}

// Background sync helpers (authenticated)
export async function syncQuoteToCloud(quote: Quote): Promise<CloudSaveResult> {
  const sb = getSupabase();
  if (!sb) {
    return { ok: false, error: "Online save is not set up on this site yet." };
  }

  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
    if (!ownerId) {
      return {
        ok: false,
        error:
          "Sign in before you share. This quote is only on this phone until then, so the customer link will not open.",
      };
    }

    const address = quote.clientAddress.trim() || "Address to be confirmed";
    const clientName = quote.clientName.trim() || "Private client";
    const title = quote.title.trim() || "Trade works";
    let customerId = quote.customerId || null;

    if (customerId) {
      const existing = await sb
        .from("customers")
        .select("id")
        .eq("id", customerId)
        .eq("owner_id", ownerId)
        .maybeSingle();
      if (!existing.data) {
        const created = await sb.from("customers").upsert({
          id: customerId,
          owner_id: ownerId,
          name: clientName,
          phone: quote.clientPhone?.trim() || "Not given",
          email: quote.clientEmail?.trim() || "not-given@local.invalid",
          address,
        });
        if (created.error) customerId = null;
      }
    }

    const recalculated = recalculateQuoteTotals(quote.items, quote.vatEnabled, quote.depositPercent);
    const photos = Array.isArray(quote.photos)
      ? quote.photos.filter((photo) => photo.length < 180_000).slice(0, 4)
      : [];

    const row = {
      id: quote.id,
      token: quote.token,
      owner_id: ownerId,
      customer_id: customerId,
      client_name: clientName,
      client_company: quote.clientCompany || null,
      client_address: address,
      client_phone: quote.clientPhone || null,
      client_email: quote.clientEmail || null,
      title,
      notes: quote.notes,
      items: quote.items.map((item) => ({
        id: item.id,
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
      })),
      options: quote.options && quote.options.length > 1 ? quote.options : null,
      selected_option_id: quote.selectedOptionId || null,
      sent_at: quote.sentAt || null,
      reminder_after_days: quote.reminderAfterDays || 3,
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
      photos,
    };

    const first = await sb.from("quotes").upsert(row);
    if (first.error && /photo|option|sent_at|reminder/i.test(first.error.message || "")) {
      const withoutPhotos = Object.fromEntries(
        Object.entries(row).filter(([key]) => !["photos", "options", "selected_option_id", "sent_at", "reminder_after_days"].includes(key))
      );
      const retry = await sb.from("quotes").upsert(withoutPhotos);
      if (retry.error) return { ok: false, error: plainCloudError(retry.error.message || "") };
      return { ok: true };
    }
    if (first.error) return { ok: false, error: plainCloudError(first.error.message || "") };
    return { ok: true };
  } catch {
    return { ok: false, error: "The quote did not save online. Check your connection and try again." };
  }
}

export async function fetchPublicQuoteCard(token: string): Promise<{
  company: string;
  jobTitle: string;
  total: number;
  heading: string;
} | null> {
  const sb = getServerSupabase();
  if (!sb || !token.startsWith("q_")) return null;
  try {
    const { data: quoteRow } = await sb
      .from("quotes")
      .select("owner_id, title, total")
      .eq("token", token)
      .maybeSingle();
    if (!quoteRow) return null;
    let company = "";
    if (quoteRow.owner_id) {
      const { data: profile } = await sb
        .from("profiles")
        .select("company_name, trading_name")
        .eq("owner_id", quoteRow.owner_id)
        .maybeSingle();
      company = String(profile?.trading_name || profile?.company_name || "").trim();
    }
    const jobTitle = String(quoteRow.title || "Trade quote").trim();
    const heading = company ? `Quote from ${company}` : jobTitle ? `Quote: ${jobTitle}` : "Your quote";
    return { company, jobTitle, total: Number(quoteRow.total) || 0, heading };
  } catch {
    return null;
  }
}

export async function quoteOwnerId(token: string): Promise<string | null> {
  const sb = getServerSupabase();
  if (!sb || !token.startsWith("q_")) return null;
  const { data } = await sb.from("quotes").select("owner_id").eq("token", token).maybeSingle();
  return data?.owner_id ? String(data.owner_id) : null;
}

export async function recordCustomerQuoteView(token: string): Promise<{ viewCount: number } | null> {
  const sb = getServerSupabase();
  if (!sb || !token.startsWith("q_")) return null;
  const { data, error } = await sb.rpc("record_public_quote_view", { lookup_token: token });
  if (error || !data || typeof data !== "object") return null;
  const row = data as { counted?: boolean; view_count?: number };
  if (!row.counted) return null;
  return { viewCount: Number(row.view_count) || 0 };
}

export async function fetchPublicQuoteHeading(token: string): Promise<string | null> {
  const sb = getServerSupabase();
  if (!sb || !token.startsWith("q_")) return null;
  try {
    const { data: quoteRow } = await sb
      .from("quotes")
      .select("owner_id, title")
      .eq("token", token)
      .maybeSingle();
    if (!quoteRow?.owner_id) return null;
    const { data: profile } = await sb
      .from("profiles")
      .select("company_name, trading_name")
      .eq("owner_id", quoteRow.owner_id)
      .maybeSingle();
    const company = String(profile?.trading_name || profile?.company_name || "").trim();
    if (company) return `Quote from ${company}`;
    const title = String(quoteRow.title || "").trim();
    return title ? `Quote: ${title}` : "Your quote";
  } catch {
    return null;
  }
}

export async function syncCustomerToCloud(customer: Customer): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
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
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
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
      logo_url: profile.logoUrl || null,
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

// Cloud Data Fetchers (Source of Truth)
export async function fetchCloudProfile(): Promise<BusinessProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
    if (!ownerId) return null;

    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToProfile(data);
  } catch {
    return null;
  }
}

export async function fetchCloudCustomers(): Promise<Customer[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
    if (!ownerId) return [];

    const { data, error } = await sb
      .from("customers")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapRowToCustomer);
  } catch {
    return [];
  }
}

export async function fetchCloudQuotes(): Promise<Quote[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
    if (!ownerId) return [];

    const { data, error } = await sb
      .from("quotes")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapRowToQuote);
  } catch {
    return [];
  }
}

export async function pullUserDataFromCloud(): Promise<{
  profile: BusinessProfile | null;
  customers: Customer[];
  quotes: Quote[];
  jobs: Job[];
  invoices: Invoice[];
} | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data: userData } = await sb.auth.getSession();
    if (!userData.session?.user?.id) return null;

    const [profile, customers, quotes, jobs, invoices] = await Promise.all([
      fetchCloudProfile(),
      fetchCloudCustomers(),
      fetchCloudQuotes(),
      fetchCloudJobs(),
      fetchCloudInvoices(),
    ]);

    return { profile, customers, quotes, jobs, invoices };
  } catch (err) {
    console.error("Failed to pull user data from cloud:", err);
    return null;
  }
}

export async function deleteCloudCustomer(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
    if (!ownerId) return false;

    const { error } = await sb
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId);

    return !error;
  } catch {
    return false;
  }
}

export async function deleteCloudQuote(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
    if (!ownerId) return false;

    const { error } = await sb
      .from("quotes")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId);

    return !error;
  } catch {
    return false;
  }
}

// Jobs Cloud Sync
export async function syncJobToCloud(job: Job): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
    if (!ownerId) return false;

    const { error } = await sb.from("jobs").upsert({
      id: job.id,
      owner_id: ownerId,
      customer_id: job.customerId,
      title: job.title,
      address: job.address,
      status: job.status,
      notes: job.notes || null,
      quote_id: job.quoteId || null,
      created_at: job.createdAt,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCloudJob(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
    if (!ownerId) return false;

    const { error } = await sb.from("jobs").delete().eq("id", id).eq("owner_id", ownerId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchCloudJobs(): Promise<Job[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
    if (!ownerId) return [];

    const { data, error } = await sb
      .from("jobs")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapRowToJob);
  } catch {
    return [];
  }
}

// Invoices Cloud Sync
export async function syncInvoiceToCloud(invoice: Invoice): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
    if (!ownerId) return false;

    const { error } = await sb.from("invoices").upsert({
      id: invoice.id,
      owner_id: ownerId,
      quote_id: invoice.quoteId || null,
      job_id: invoice.jobId || null,
      customer_id: invoice.customerId,
      title: invoice.title,
      client_name: invoice.clientName,
      client_address: invoice.clientAddress,
      client_email: invoice.clientEmail || null,
      client_phone: invoice.clientPhone || null,
      items: invoice.items,
      subtotal: invoice.subtotal,
      vat_enabled: invoice.vatEnabled,
      vat: invoice.vat,
      total: invoice.total,
      deposit_paid: invoice.depositPaid,
      balance_due: invoice.balanceDue,
      status: invoice.status,
      due_date: invoice.dueDate,
      paid_at: invoice.paidAt || null,
      created_at: invoice.createdAt,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCloudInvoice(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
    if (!ownerId) return false;

    const { error } = await sb.from("invoices").delete().eq("id", id).eq("owner_id", ownerId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchCloudInvoices(): Promise<Invoice[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data: userData } = await sb.auth.getSession();
    const ownerId = userData.session?.user?.id;
    if (!ownerId) return [];

    const { data, error } = await sb
      .from("invoices")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapRowToInvoice);
  } catch {
    return [];
  }
}

