import {
  syncQuoteToCloud,
  syncCustomerToCloud,
  syncProfileToCloud,
  updateCloudQuoteStatus,
  deleteCloudCustomer,
  deleteCloudQuote,
} from "./supabase";

export interface Customer {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  type: "labor" | "material" | "service";
  description: string;
  quantity: number;
  unit: string;
  rate: number;
}

export interface Quote {
  id: string;
  token: string;
  customerId?: string;
  clientName: string;
  clientCompany?: string;
  clientAddress: string;
  clientPhone?: string;
  clientEmail?: string;
  title: string;
  notes: string;
  items: LineItem[];
  subtotal: number;
  vatEnabled: boolean;
  vat: number;
  total: number;
  depositPercent: number;
  deposit: number;
  status: "Draft" | "Sent" | "Viewed" | "Accepted" | "Rejected" | "Expired";
  viewedAt?: string;
  acceptedSignatureName?: string;
  acceptedAt?: string;
  rejectedReason?: string;
  rejectedAt?: string;
  createdAt: string;
}

export interface BusinessProfile {
  companyName: string;
  tradingName?: string;
  ownerName: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  trade: string;
  vatRegistered: boolean;
  vatNumber?: string;
  bankName?: string;
  bankSortCode?: string;
  bankAccountNumber?: string;
  accreditations: string[];
  defaultDepositPercent: number;
  paymentTermsDays: number;
  quoteValidityDays: number;
  termsAndConditions?: string;
}

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  companyName: "Premier Trade Services",
  tradingName: "",
  ownerName: "Alex Morgan",
  phone: "+44 7700 900345",
  email: "quotes@premiertrade.co.uk",
  website: "www.premiertrade.co.uk",
  address: "Unit 4, Trade Enterprise Park, Bristol, BS2 8QJ",
  trade: "General Building & Renovation",
  vatRegistered: false,
  vatNumber: "",
  bankName: "",
  bankSortCode: "",
  bankAccountNumber: "",
  accreditations: [],
  defaultDepositPercent: 20,
  paymentTermsDays: 7,
  quoteValidityDays: 30,
  termsAndConditions:
    "1. All materials remain property of the contractor until paid in full.\n2. Workmanship guaranteed for 12 months from completion date.\n3. Deposit required before procurement of materials.",
};

const PROFILE_KEY = "builderbot_business_profile";

export function getBusinessProfile(): BusinessProfile {
  if (typeof window === "undefined") return DEFAULT_BUSINESS_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_BUSINESS_PROFILE;
    return { ...DEFAULT_BUSINESS_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BUSINESS_PROFILE;
  }
}

export function saveBusinessProfile(profile: BusinessProfile): BusinessProfile {
  if (typeof window !== "undefined") {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
  syncProfileToCloud(profile).catch(() => {});
  return profile;
}

import {
  roundMoney,
  recalculateQuoteTotals,
  validateStatusTransition,
  generateToken,
} from "./quote-rules.mjs";

export {
  roundMoney,
  recalculateQuoteTotals,
  validateStatusTransition,
  generateToken,
};

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Sarah Jenkins",
    company: "Private Homeowner",
    phone: "+44 7911 123456",
    email: "sarah.jenkins@example.com",
    address: "24 Orchard Way, Bristol, BS8 4EJ",
    notes: "Requires advance notice for site access (has two dogs). Prefers morning visits.",
    createdAt: "2026-10-10",
  },
  {
    id: "cust-2",
    name: "David Miller",
    company: "Miller Property Investments",
    phone: "+44 7700 900123",
    email: "david.m@millerprop.co.uk",
    address: "12 Meadow Lane, Bath, BA1 5TT",
    notes: "Manages 4 rental properties. Always pays deposits same-day.",
    createdAt: "2026-10-12",
  },
  {
    id: "cust-3",
    name: "Oakfield Management Ltd",
    company: "Commercial Property",
    phone: "+44 7820 445566",
    email: "estates@oakfield.co.uk",
    address: "Suite 4, Oakfield Business Park, Bristol, BS1 2AB",
    notes: "Requires formal VAT invoices and Gas Safe / NICEIC compliance sheets.",
    createdAt: "2026-10-14",
  },
];

const DEFAULT_QUOTES: Quote[] = [
  {
    id: "BB-1042",
    token: "q_demo_bathroom",
    customerId: "cust-1",
    clientName: "Sarah Jenkins",
    clientCompany: "Private Homeowner",
    clientAddress: "24 Orchard Way, Bristol, BS8 4EJ",
    clientPhone: "+44 7911 123456",
    clientEmail: "sarah.jenkins@example.com",
    title: "En-suite Bathroom Renovation & Radiator Upgrade",
    notes:
      "Strip out old shower suite. Supply and install thermostatic bar shower, 1200x500mm heated towel rail, low-profile resin tray, vanity basin, pipework rerouting, testing, and licensed trade waste disposal.",
    items: [
      {
        id: "1",
        type: "material",
        description: "Thermostatic Bar Shower Kit & Riser Rail",
        quantity: 1,
        unit: "unit",
        rate: 245.0,
      },
      {
        id: "2",
        type: "material",
        description: "Chrome Heated Towel Rail (1200x500mm) + Angled Valves",
        quantity: 1,
        unit: "unit",
        rate: 165.0,
      },
      {
        id: "3",
        type: "material",
        description: "Low Profile Stone Resin Shower Tray (1200x800mm)",
        quantity: 1,
        unit: "unit",
        rate: 195.0,
      },
      {
        id: "4",
        type: "labor",
        description: "Certified plumbing labor, waste routing & pressure testing",
        quantity: 16,
        unit: "hrs",
        rate: 55.0,
      },
      {
        id: "5",
        type: "service",
        description: "Old suite rip-out & licensed trade waste disposal",
        quantity: 1,
        unit: "job",
        rate: 180.0,
      },
    ],
    subtotal: 1665.0,
    vatEnabled: true,
    vat: 333.0,
    total: 1998.0,
    depositPercent: 20,
    deposit: 399.6,
    status: "Sent",
    createdAt: "2026-10-16",
  },
  {
    id: "BB-1041",
    token: "q_demo_electrical",
    customerId: "cust-2",
    clientName: "David Miller",
    clientCompany: "Miller Property Investments",
    clientAddress: "12 Meadow Lane, Bath, BA1 5TT",
    clientPhone: "+44 7700 900123",
    clientEmail: "david.m@millerprop.co.uk",
    title: "Full Consumer Unit Upgrade & 8 Downlights",
    notes:
      "Supply and fit 10-way dual RCD consumer unit, replace 8 kitchen downlights with fire-rated LEDs, full circuit testing and issue EICR certificate.",
    items: [
      {
        id: "1",
        type: "material",
        description: "10-Way Dual RCD Metal Consumer Unit + RCBOs",
        quantity: 1,
        unit: "unit",
        rate: 280.0,
      },
      {
        id: "2",
        type: "material",
        description: "Fire-rated IP65 Warm White LED Downlights",
        quantity: 8,
        unit: "units",
        rate: 26.0,
      },
      {
        id: "3",
        type: "labor",
        description: "Certified electrical installation, circuit testing & EICR certification",
        quantity: 8,
        unit: "hrs",
        rate: 60.0,
      },
    ],
    subtotal: 968.0,
    vatEnabled: true,
    vat: 193.6,
    total: 1161.6,
    depositPercent: 20,
    deposit: 232.32,
    status: "Accepted",
    acceptedSignatureName: "David Miller",
    acceptedAt: "2026-10-15T14:30:00Z",
    createdAt: "2026-10-15",
  },
  {
    id: "BB-1040",
    token: "q_demo_boiler",
    customerId: "cust-3",
    clientName: "Oakfield Management Ltd",
    clientCompany: "Commercial Property",
    clientAddress: "Suite 4, Oakfield Business Park, Bristol, BS1 2AB",
    clientPhone: "+44 7820 445566",
    clientEmail: "estates@oakfield.co.uk",
    title: "Commercial Combi Boiler Plant Inspection & Flush",
    notes:
      "Annual safety inspection on plant room boiler, chemical powerflush of commercial heating loop, test all motorized zone valves, and issue CP12 certificate.",
    items: [
      {
        id: "1",
        type: "material",
        description: "Commercial system chemical inhibitor & cleaner packs",
        quantity: 4,
        unit: "bottles",
        rate: 45.0,
      },
      {
        id: "2",
        type: "labor",
        description: "Commercial technician inspection & heating flush",
        quantity: 14,
        unit: "hrs",
        rate: 65.0,
      },
      {
        id: "3",
        type: "service",
        description: "Safety Inspection Certificate & emissions compliance sign-off",
        quantity: 1,
        unit: "cert",
        rate: 95.0,
      },
    ],
    subtotal: 1185.0,
    vatEnabled: true,
    vat: 237.0,
    total: 1422.0,
    depositPercent: 25,
    deposit: 355.5,
    status: "Draft",
    createdAt: "2026-10-14",
  },
];

const CUSTOMERS_KEY = "builderbot_customers_v1";
const QUOTES_KEY = "builderbot_quotes_v1";

// Customers Repository
export function getCustomers(): Customer[] {
  if (typeof window === "undefined") return DEFAULT_CUSTOMERS;
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) {
      if (localStorage.getItem("builderbot_data_source") === "cloud") {
        return [];
      }
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(DEFAULT_CUSTOMERS));
      return DEFAULT_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CUSTOMERS;
  }
}

export function saveCustomer(customer: Omit<Customer, "id" | "createdAt"> & { id?: string }): Customer {
  const current = getCustomers();
  let saved: Customer;

  if (customer.id) {
    saved = {
      ...(customer as Customer),
      createdAt: (customer as Customer).createdAt || new Date().toISOString().split("T")[0],
    };
    const updated = current.map((c) => (c.id === customer.id ? saved : c));
    if (typeof window !== "undefined") {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("builderbot_storage_updated"));
    }
  } else {
    saved = {
      ...customer,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [saved, ...current];
    if (typeof window !== "undefined") {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("builderbot_storage_updated"));
    }
  }

  syncCustomerToCloud(saved).catch(() => {});
  return saved;
}

export function deleteCustomer(id: string): void {
  const current = getCustomers().filter((c) => c.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event("builderbot_storage_updated"));
  }
  deleteCloudCustomer(id).catch(() => {});
}

export function getCustomerById(id: string): Customer | undefined {
  return getCustomers().find((c) => c.id === id);
}

// Quotes Repository
export function getQuotes(): Quote[] {
  if (typeof window === "undefined") return DEFAULT_QUOTES;
  try {
    const raw = localStorage.getItem(QUOTES_KEY);
    if (!raw) {
      if (localStorage.getItem("builderbot_data_source") === "cloud") {
        return [];
      }
      localStorage.setItem(QUOTES_KEY, JSON.stringify(DEFAULT_QUOTES));
      return DEFAULT_QUOTES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_QUOTES;
  }
}

export function getQuoteById(idOrToken: string): Quote | undefined {
  if (!idOrToken) return undefined;
  const quotes = getQuotes();
  const lower = idOrToken.toLowerCase();
  return quotes.find((q) => q.id.toLowerCase() === lower || q.token.toLowerCase() === lower);
}

export function saveQuote(
  quote: Omit<Quote, "id" | "token" | "createdAt"> & { id?: string; token?: string; createdAt?: string }
): Quote {
  const current = getQuotes();
  let saved: Quote;

  // Round currency to pence
  const subtotal = roundMoney(quote.subtotal);
  const vat = roundMoney(quote.vat);
  const total = roundMoney(quote.total);
  const deposit = roundMoney(quote.deposit);

  if (quote.id) {
    // Updating existing quote
    saved = {
      ...quote,
      id: quote.id,
      token: quote.token || generateToken(),
      subtotal,
      vat,
      total,
      deposit,
      createdAt: quote.createdAt || new Date().toISOString().split("T")[0],
    };
    const updated = current.map((q) => (q.id === quote.id ? saved : q));
    if (typeof window !== "undefined") {
      localStorage.setItem(QUOTES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("builderbot_storage_updated"));
    }
  } else {
    // New quote: find max number to avoid duplicates after deletion
    let maxNum = 1040;
    for (const q of current) {
      const match = q.id.match(/^BB-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextId = `BB-${maxNum + 1}`;

    saved = {
      ...quote,
      id: nextId,
      token: quote.token || generateToken(),
      subtotal,
      vat,
      total,
      deposit,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [saved, ...current];
    if (typeof window !== "undefined") {
      localStorage.setItem(QUOTES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("builderbot_storage_updated"));
    }
  }

  syncQuoteToCloud(saved).catch(() => {});
  return saved;
}

export function updateQuoteStatus(
  idOrToken: string,
  status: Quote["status"],
  metadata?: { signatureName?: string; reason?: string }
): Quote | undefined {
  const current = getQuotes();
  let target: Quote | undefined;

  const lower = idOrToken.toLowerCase();
  const now = new Date().toISOString();

  const updated = current.map((q) => {
    if (q.id.toLowerCase() === lower || q.token.toLowerCase() === lower) {
      target = {
        ...q,
        status,
        ...(status === "Viewed" ? { viewedAt: q.viewedAt || now } : {}),
        ...(status === "Accepted" && metadata?.signatureName
          ? { acceptedSignatureName: metadata.signatureName, acceptedAt: now }
          : {}),
        ...(status === "Rejected" && metadata?.reason
          ? { rejectedReason: metadata.reason, rejectedAt: now }
          : {}),
      };
      return target;
    }
    return q;
  });

  if (typeof window !== "undefined" && target) {
    localStorage.setItem(QUOTES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("builderbot_storage_updated"));
  }

  updateCloudQuoteStatus(idOrToken, status, metadata).catch(() => {});
  return target;
}

export function markQuoteViewed(idOrToken: string): Quote | undefined {
  const current = getQuotes();
  let target: Quote | undefined;

  const lower = idOrToken.toLowerCase();
  const now = new Date().toISOString();

  const updated = current.map((q) => {
    if (q.id.toLowerCase() === lower || q.token.toLowerCase() === lower) {
      if (q.status === "Sent") {
        target = {
          ...q,
          status: "Viewed",
          viewedAt: q.viewedAt || now,
        };
        return target;
      }
      target = q;
      return q;
    }
    return q;
  });

  if (typeof window !== "undefined" && target && target.status === "Viewed") {
    localStorage.setItem(QUOTES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("builderbot_storage_updated"));
    updateCloudQuoteStatus(idOrToken, "Viewed").catch(() => {});
  }

  return target;
}

export function deleteQuote(id: string): void {
  const current = getQuotes().filter((q) => q.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(QUOTES_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event("builderbot_storage_updated"));
  }
  deleteCloudQuote(id).catch(() => {});
}

// Cloud Hydration & Cache Synchronization
export function hydrateLocalCache(data: {
  profile?: BusinessProfile | null;
  customers?: Customer[];
  quotes?: Quote[];
}): void {
  if (typeof window === "undefined") return;
  if (data.profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
  }
  if (data.customers !== undefined) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(data.customers));
  }
  if (data.quotes !== undefined) {
    localStorage.setItem(QUOTES_KEY, JSON.stringify(data.quotes));
  }
  localStorage.setItem("builderbot_data_source", "cloud");
  window.dispatchEvent(new Event("builderbot_storage_updated"));
}

export function loadDemoSampleData(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(DEFAULT_CUSTOMERS));
  localStorage.setItem(QUOTES_KEY, JSON.stringify(DEFAULT_QUOTES));
  localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_BUSINESS_PROFILE));
  localStorage.setItem("builderbot_data_source", "demo");
  window.dispatchEvent(new Event("builderbot_storage_updated"));
}

export function clearLocalData(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify([]));
  localStorage.setItem(QUOTES_KEY, JSON.stringify([]));
  localStorage.removeItem("builderbot_data_source");
  window.dispatchEvent(new Event("builderbot_storage_updated"));
}

// Computed Dashboard Metrics
export function getDashboardMetrics() {
  const quotes = getQuotes();

  const sentQuotes = quotes.filter((q) => q.status === "Sent");
  const viewedQuotes = quotes.filter((q) => q.status === "Viewed");
  const acceptedQuotes = quotes.filter((q) => q.status === "Accepted");
  const rejectedQuotes = quotes.filter((q) => q.status === "Rejected");
  const draftQuotes = quotes.filter((q) => q.status === "Draft");

  const totalAcceptedValue = roundMoney(acceptedQuotes.reduce((acc, q) => acc + q.total, 0));
  const totalPendingValue = roundMoney(
    quotes.filter((q) => q.status === "Sent" || q.status === "Viewed").reduce((acc, q) => acc + q.total, 0)
  );
  const totalDraftValue = roundMoney(draftQuotes.reduce((acc, q) => acc + q.total, 0));

  const decidedQuotesCount = acceptedQuotes.length + rejectedQuotes.length;
  const winRate = decidedQuotesCount > 0 ? Math.round((acceptedQuotes.length / decidedQuotesCount) * 100) : 0;

  return {
    totalQuotesCount: quotes.length,
    sentQuotesCount: sentQuotes.length,
    viewedQuotesCount: viewedQuotes.length,
    activePipelineCount: sentQuotes.length + viewedQuotes.length,
    acceptedQuotesCount: acceptedQuotes.length,
    rejectedQuotesCount: rejectedQuotes.length,
    draftQuotesCount: draftQuotes.length,
    totalAcceptedValue,
    totalPendingValue,
    totalDraftValue,
    winRate,
    recentQuotes: quotes.slice(0, 8),
  };
}

export interface ActivityItem {
  id: string;
  type: "quote_accepted" | "quote_viewed" | "quote_sent" | "quote_rejected" | "customer_created";
  title: string;
  description: string;
  timestamp: string;
  relativeTime: string;
  link?: string;
}

export function getCustomerQuotes(customerIdOrName: string): Quote[] {
  const quotes = getQuotes();
  const lower = customerIdOrName.toLowerCase();
  return quotes.filter(
    (q) =>
      q.customerId === customerIdOrName ||
      q.clientName.toLowerCase() === lower
  );
}

export function getCustomerMetrics(customerIdOrName: string) {
  const quotes = getCustomerQuotes(customerIdOrName);
  const accepted = quotes.filter((q) => q.status === "Accepted");
  const pending = quotes.filter((q) => q.status === "Sent" || q.status === "Viewed");
  const totalBilled = roundMoney(quotes.reduce((acc, q) => acc + q.total, 0));
  const totalWon = roundMoney(accepted.reduce((acc, q) => acc + q.total, 0));
  const totalPending = roundMoney(pending.reduce((acc, q) => acc + q.total, 0));
  const decided = quotes.filter((q) => q.status === "Accepted" || q.status === "Rejected").length;
  const winRate = decided > 0 ? Math.round((accepted.length / decided) * 100) : 0;

  return {
    totalQuotes: quotes.length,
    totalBilled,
    totalWon,
    totalPending,
    winRate,
    quotes,
  };
}

export function getRecentActivityFeed(): ActivityItem[] {
  const quotes = getQuotes();
  const customers = getCustomers();
  const activities: ActivityItem[] = [];

  for (const q of quotes) {
    if (q.acceptedAt) {
      activities.push({
        id: `${q.id}-accepted`,
        type: "quote_accepted",
        title: `Quote ${q.id} Accepted`,
        description: `${q.acceptedSignatureName || q.clientName} signed £${q.total.toFixed(2)} (${q.title})`,
        timestamp: q.acceptedAt,
        relativeTime: formatRelativeTime(q.acceptedAt),
        link: `/q/${q.token || q.id}`,
      });
    }

    if (q.viewedAt) {
      activities.push({
        id: `${q.id}-viewed`,
        type: "quote_viewed",
        title: `Quote ${q.id} Viewed`,
        description: `${q.clientName} opened quote link (${q.title})`,
        timestamp: q.viewedAt,
        relativeTime: formatRelativeTime(q.viewedAt),
        link: `/q/${q.token || q.id}`,
      });
    }

    if (q.status === "Sent") {
      const sentTime = q.createdAt ? `${q.createdAt}T10:00:00Z` : new Date().toISOString();
      activities.push({
        id: `${q.id}-sent`,
        type: "quote_sent",
        title: `Quote ${q.id} Sent`,
        description: `Issued £${q.total.toFixed(2)} quote to ${q.clientName}`,
        timestamp: sentTime,
        relativeTime: formatRelativeTime(sentTime),
        link: `/q/${q.token || q.id}`,
      });
    }

    if (q.rejectedAt) {
      activities.push({
        id: `${q.id}-rejected`,
        type: "quote_rejected",
        title: `Quote ${q.id} Declined`,
        description: `${q.clientName} declined: ${q.rejectedReason || "No reason given"}`,
        timestamp: q.rejectedAt,
        relativeTime: formatRelativeTime(q.rejectedAt),
        link: `/q/${q.token || q.id}`,
      });
    }
  }

  for (const c of customers) {
    const custTime = c.createdAt ? `${c.createdAt}T08:00:00Z` : new Date().toISOString();
    activities.push({
      id: `${c.id}-created`,
      type: "customer_created",
      title: "New Customer Added",
      description: `${c.name} added to trade directory`,
      timestamp: custTime,
      relativeTime: formatRelativeTime(custTime),
      link: `/customers/${c.id}`,
    });
  }

  // Sort newest first
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}

function formatRelativeTime(isoString: string): string {
  if (!isoString) return "Recently";
  try {
    const timestamp = new Date(isoString).getTime();
    if (isNaN(timestamp)) return "Recently";

    // Safe fallback for SSR / static prerender
    if (typeof window === "undefined") {
      return new Date(isoString).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }

    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 2) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "Recently";
  }
}
