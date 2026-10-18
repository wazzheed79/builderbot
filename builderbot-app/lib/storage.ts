import {
  syncQuoteToCloud,
  syncCustomerToCloud,
  syncProfileToCloud,
  updateCloudQuoteStatus,
  deleteCloudCustomer,
  deleteCloudQuote,
  syncJobToCloud,
  deleteCloudJob,
  syncInvoiceToCloud,
  deleteCloudInvoice,
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
  photos?: string[];
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

export interface Job {
  id: string;
  customerId: string;
  title: string;
  address: string;
  status: "Quoted" | "Scheduled" | "In Progress" | "Completed" | "Invoiced";
  notes?: string;
  quoteId?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  quoteId?: string;
  jobId?: string;
  customerId: string;
  title: string;
  clientName: string;
  clientAddress: string;
  clientEmail?: string;
  clientPhone?: string;
  items: LineItem[];
  subtotal: number;
  vatEnabled: boolean;
  vat: number;
  total: number;
  depositPaid: number;
  balanceDue: number;
  status: "Draft" | "Issued" | "Partially Paid" | "Paid" | "Overdue";
  dueDate: string;
  paidAt?: string;
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
  logoUrl?: string;
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
  logoUrl: "",
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

// Quote DNA & Personal Pricing Memory
export interface PricingMemory {
  laborDayRate: number; // e.g. £280/day
  laborHourlyRate: number; // e.g. £50/hr
  preferredMarkupPercent: number; // e.g. 20%
  totalQuotesLearned?: number;
  updatedAt?: string;
}

export const DEFAULT_PRICING_MEMORY: PricingMemory = {
  laborDayRate: 280,
  laborHourlyRate: 50,
  preferredMarkupPercent: 20,
  totalQuotesLearned: 0,
  updatedAt: "2026-10-18T12:00:00Z",
};

const PRICING_MEMORY_KEY = "trademate_pricing_memory_v1";

export function getPricingMemory(): PricingMemory {
  if (typeof window === "undefined") return DEFAULT_PRICING_MEMORY;
  try {
    const raw = localStorage.getItem(PRICING_MEMORY_KEY);
    if (!raw) return DEFAULT_PRICING_MEMORY;
    return { ...DEFAULT_PRICING_MEMORY, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRICING_MEMORY;
  }
}

export function savePricingMemory(memory: PricingMemory): PricingMemory {
  if (typeof window !== "undefined") {
    localStorage.setItem(PRICING_MEMORY_KEY, JSON.stringify(memory));
    window.dispatchEvent(new Event("trademate_pricing_memory_updated"));
  }
  return memory;
}

export function learnPricingFromQuote(items: LineItem[]): PricingMemory {
  const current = getPricingMemory();
  const laborItems = items.filter((it) => it.type === "labor" && it.rate > 0);
  if (laborItems.length === 0) return current;

  const hourlyItems = laborItems.filter((it) => it.unit === "hrs" || it.rate <= 120);
  const dayItems = laborItems.filter((it) => it.unit === "days" || it.rate > 150);

  let newHourly = current.laborHourlyRate;
  let newDay = current.laborDayRate;

  if (hourlyItems.length > 0) {
    const avgHourly = hourlyItems.reduce((acc, it) => acc + it.rate, 0) / hourlyItems.length;
    newHourly = roundMoney(current.laborHourlyRate * 0.7 + avgHourly * 0.3);
  }

  if (dayItems.length > 0) {
    const avgDay = dayItems.reduce((acc, it) => acc + it.rate, 0) / dayItems.length;
    newDay = roundMoney(current.laborDayRate * 0.7 + avgDay * 0.3);
  } else if (newHourly) {
    newDay = roundMoney(newHourly * 8);
  }

  const updated: PricingMemory = {
    ...current,
    laborHourlyRate: newHourly,
    laborDayRate: newDay,
    totalQuotesLearned: (current.totalQuotesLearned || 0) + 1,
    updatedAt: new Date().toISOString(),
  };

  savePricingMemory(updated);
  return updated;
}

import {
  roundMoney,
  recalculateQuoteTotals,
  validateStatusTransition,
  generateToken,
  calculateQuoteExpiry,
} from "./quote-rules.mjs";

export {
  roundMoney,
  recalculateQuoteTotals,
  validateStatusTransition,
  generateToken,
  calculateQuoteExpiry,
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
    photos: [
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='450' viewBox='0 0 600 450'><rect width='600' height='450' fill='%23f1f5f9'/><rect x='20' y='20' width='560' height='410' rx='16' fill='%23e2e8f0'/><path d='M80 350 L220 180 L340 290 L440 160 L520 350 Z' fill='%2394a3b8'/><circle cx='440' cy='100' r='32' fill='%23f59e0b'/><text x='300' y='390' font-family='sans-serif' font-size='18' font-weight='bold' text-anchor='middle' fill='%231e293b'>Site Reference Photo: Existing Shower Area</text></svg>",
    ],
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

export const DEFAULT_JOBS: Job[] = [
  {
    id: "job-101",
    customerId: "cust-1",
    title: "Master Ensuite Bathroom Renovation",
    address: "24 Orchard Way, Bristol, BS8 4EJ",
    status: "In Progress",
    notes: "Site survey completed. Customer requested walk-in shower tray instead of bathtub. Access code 4812.",
    quoteId: "BB-1042",
    createdAt: "2026-10-10",
  },
  {
    id: "job-102",
    customerId: "cust-2",
    title: "Boundary Featheredge Fence Replacement (28m)",
    address: "12 Meadow Lane, Bath, BA1 5TT",
    status: "Scheduled",
    notes: "Old panels dismantled and stacked. Installation scheduled for Monday 8:00 AM.",
    quoteId: "BB-1043",
    createdAt: "2026-10-12",
  },
  {
    id: "job-103",
    customerId: "cust-3",
    title: "Commercial Heating Plant Safety Inspection & Power Flush",
    address: "Suite 4, Oakfield Business Park, Bristol, BS1 2AB",
    status: "Quoted",
    notes: "Requires out-of-hours technician access certificate.",
    quoteId: "BB-1044",
    createdAt: "2026-10-14",
  },
];

export const DEFAULT_INVOICES: Invoice[] = [
  {
    id: "INV-1042",
    quoteId: "BB-1042",
    jobId: "job-101",
    customerId: "cust-1",
    title: "Master Ensuite Bathroom Renovation — Initial Deposit",
    clientName: "Sarah Jenkins",
    clientAddress: "24 Orchard Way, Bristol, BS8 4EJ",
    clientEmail: "sarah.jenkins@example.com",
    clientPhone: "+44 7911 123456",
    items: [
      {
        id: "1",
        type: "service",
        description: "Ensuite refurbishment procurement & initial deposit payment",
        quantity: 1,
        unit: "stage",
        rate: 894.0,
      },
    ],
    subtotal: 745.0,
    vatEnabled: true,
    vat: 149.0,
    total: 894.0,
    depositPaid: 894.0,
    balanceDue: 0.0,
    status: "Paid",
    dueDate: "2026-10-17",
    paidAt: "2026-10-15T14:30:00Z",
    createdAt: "2026-10-15",
  },
];

const CUSTOMERS_KEY = "builderbot_customers_v1";
const QUOTES_KEY = "builderbot_quotes_v1";
const JOBS_KEY = "builderbot_jobs_v1";
const INVOICES_KEY = "builderbot_invoices_v1";

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

  try {
    learnPricingFromQuote(saved.items);
  } catch {}

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

// Jobs Repository
export function getJobs(): Job[] {
  if (typeof window === "undefined") return DEFAULT_JOBS;
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    if (!raw) {
      if (localStorage.getItem("builderbot_data_source") === "cloud") return [];
      localStorage.setItem(JOBS_KEY, JSON.stringify(DEFAULT_JOBS));
      return DEFAULT_JOBS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_JOBS;
  }
}

export function getJobById(id: string): Job | undefined {
  return getJobs().find((j) => j.id === id);
}

export function getJobsByCustomer(customerId: string): Job[] {
  return getJobs().filter((j) => j.customerId === customerId);
}

export function saveJob(job: Omit<Job, "id" | "createdAt"> & { id?: string; createdAt?: string }): Job {
  const current = getJobs();
  let saved: Job;

  if (job.id) {
    saved = {
      ...(job as Job),
      createdAt: (job as Job).createdAt || new Date().toISOString().split("T")[0],
    };
    const updated = current.map((j) => (j.id === job.id ? saved : j));
    if (typeof window !== "undefined") {
      localStorage.setItem(JOBS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("builderbot_storage_updated"));
    }
  } else {
    saved = {
      ...job,
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [saved, ...current];
    if (typeof window !== "undefined") {
      localStorage.setItem(JOBS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("builderbot_storage_updated"));
    }
  }

  syncJobToCloud(saved).catch(() => {});
  return saved;
}

export function deleteJob(id: string): void {
  const current = getJobs().filter((j) => j.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(JOBS_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event("builderbot_storage_updated"));
  }
  deleteCloudJob(id).catch(() => {});
}

// Invoices Repository
export function getInvoices(): Invoice[] {
  if (typeof window === "undefined") return DEFAULT_INVOICES;
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    if (!raw) {
      if (localStorage.getItem("builderbot_data_source") === "cloud") return [];
      localStorage.setItem(INVOICES_KEY, JSON.stringify(DEFAULT_INVOICES));
      return DEFAULT_INVOICES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_INVOICES;
  }
}

export function getInvoiceById(id: string): Invoice | undefined {
  return getInvoices().find((i) => i.id === id);
}

export function getInvoicesByCustomer(customerId: string): Invoice[] {
  return getInvoices().filter((i) => i.customerId === customerId);
}

export function saveInvoice(
  invoice: Omit<Invoice, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Invoice {
  const current = getInvoices();
  let saved: Invoice;

  if (invoice.id) {
    saved = {
      ...(invoice as Invoice),
      createdAt: (invoice as Invoice).createdAt || new Date().toISOString().split("T")[0],
    };
    const updated = current.map((i) => (i.id === invoice.id ? saved : i));
    if (typeof window !== "undefined") {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("builderbot_storage_updated"));
    }
  } else {
    let maxNum = 1040;
    for (const inv of current) {
      const match = inv.id.match(/^INV-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextId = `INV-${maxNum + 1}`;

    saved = {
      ...invoice,
      id: nextId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [saved, ...current];
    if (typeof window !== "undefined") {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("builderbot_storage_updated"));
    }
  }

  syncInvoiceToCloud(saved).catch(() => {});
  return saved;
}

export function deleteInvoice(id: string): void {
  const current = getInvoices().filter((i) => i.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event("builderbot_storage_updated"));
  }
  deleteCloudInvoice(id).catch(() => {});
}

// 1-Tap Convert Quote to Invoice
export function convertQuoteToInvoice(quote: Quote, depositOnly: boolean = false): Invoice {
  const currentInvoices = getInvoices();
  const existing = currentInvoices.find((i) => i.quoteId === quote.id);
  if (existing) return existing;

  const profile = getBusinessProfile();
  const paymentDays = profile.paymentTermsDays || 7;
  const dueDate = new Date(Date.now() + paymentDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  let items: LineItem[] = quote.items;
  let subtotal = quote.subtotal;
  let vat = quote.vat;
  let total = quote.total;
  let depositPaid = quote.acceptedSignatureName ? quote.deposit : 0;
  let balanceDue = roundMoney(Math.max(0, total - depositPaid));

  if (depositOnly) {
    total = quote.deposit;
    subtotal = quote.vatEnabled ? roundMoney(total / 1.2) : total;
    vat = roundMoney(total - subtotal);
    depositPaid = 0;
    balanceDue = total;
    items = [
      {
        id: "dep-1",
        type: "service",
        description: `Initial Deposit (${quote.depositPercent}%) for: ${quote.title}`,
        quantity: 1,
        unit: "stage",
        rate: total,
      },
    ];
  }

  const invoice = saveInvoice({
    quoteId: quote.id,
    customerId: quote.customerId || "cust-unknown",
    title: depositOnly ? `Deposit: ${quote.title}` : `Invoice: ${quote.title}`,
    clientName: quote.clientName,
    clientAddress: quote.clientAddress,
    clientEmail: quote.clientEmail,
    clientPhone: quote.clientPhone,
    items,
    subtotal,
    vatEnabled: quote.vatEnabled,
    vat,
    total,
    depositPaid,
    balanceDue,
    status: balanceDue === 0 ? "Paid" : "Issued",
    dueDate,
  });

  return invoice;
}

// Cloud Hydration & Cache Synchronization
export function hydrateLocalCache(data: {
  profile?: BusinessProfile | null;
  customers?: Customer[];
  quotes?: Quote[];
  jobs?: Job[];
  invoices?: Invoice[];
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
  if (data.jobs !== undefined) {
    localStorage.setItem(JOBS_KEY, JSON.stringify(data.jobs));
  }
  if (data.invoices !== undefined) {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(data.invoices));
  }
  localStorage.setItem("builderbot_data_source", "cloud");
  window.dispatchEvent(new Event("builderbot_storage_updated"));
}

export function loadDemoSampleData(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(DEFAULT_CUSTOMERS));
  localStorage.setItem(QUOTES_KEY, JSON.stringify(DEFAULT_QUOTES));
  localStorage.setItem(JOBS_KEY, JSON.stringify(DEFAULT_JOBS));
  localStorage.setItem(INVOICES_KEY, JSON.stringify(DEFAULT_INVOICES));
  localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_BUSINESS_PROFILE));
  localStorage.setItem("builderbot_data_source", "demo");
  window.dispatchEvent(new Event("builderbot_storage_updated"));
}

export function clearLocalData(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify([]));
  localStorage.setItem(QUOTES_KEY, JSON.stringify([]));
  localStorage.setItem(JOBS_KEY, JSON.stringify([]));
  localStorage.setItem(INVOICES_KEY, JSON.stringify([]));
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
