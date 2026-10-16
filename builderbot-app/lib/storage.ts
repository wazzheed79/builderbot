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
  status: "Draft" | "Sent" | "Accepted" | "Declined";
  createdAt: string;
}

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
    createdAt: "2026-10-15",
  },
  {
    id: "BB-1040",
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
        description: "Gas Safe registered commercial technician inspection & flush",
        quantity: 14,
        unit: "hrs",
        rate: 65.0,
      },
      {
        id: "3",
        type: "service",
        description: "Gas Safety Certificate (CP12) & emissions compliance sign-off",
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
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(DEFAULT_CUSTOMERS));
      return DEFAULT_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch (e) {
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
    if (typeof window !== "undefined") localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
  } else {
    saved = {
      ...customer,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [saved, ...current];
    if (typeof window !== "undefined") localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
  }

  return saved;
}

export function deleteCustomer(id: string): void {
  const current = getCustomers().filter((c) => c.id !== id);
  if (typeof window !== "undefined") localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(current));
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
      localStorage.setItem(QUOTES_KEY, JSON.stringify(DEFAULT_QUOTES));
      return DEFAULT_QUOTES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_QUOTES;
  }
}

export function getQuoteById(id: string): Quote | undefined {
  const quotes = getQuotes();
  return quotes.find((q) => q.id.toLowerCase() === id.toLowerCase()) || quotes[0];
}

export function saveQuote(quote: Omit<Quote, "id" | "createdAt"> & { id?: string }): Quote {
  const current = getQuotes();
  let saved: Quote;

  if (quote.id) {
    saved = {
      ...(quote as Quote),
      createdAt: (quote as Quote).createdAt || new Date().toISOString().split("T")[0],
    };
    const updated = current.map((q) => (q.id === quote.id ? saved : q));
    if (typeof window !== "undefined") localStorage.setItem(QUOTES_KEY, JSON.stringify(updated));
  } else {
    const nextNumber = 1040 + current.length + 1;
    saved = {
      ...quote,
      id: `BB-${nextNumber}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [saved, ...current];
    if (typeof window !== "undefined") localStorage.setItem(QUOTES_KEY, JSON.stringify(updated));
  }

  return saved;
}

export function updateQuoteStatus(id: string, status: Quote["status"]): Quote | undefined {
  const current = getQuotes();
  let target: Quote | undefined;

  const updated = current.map((q) => {
    if (q.id.toLowerCase() === id.toLowerCase()) {
      target = { ...q, status };
      return target;
    }
    return q;
  });

  if (typeof window !== "undefined" && target) {
    localStorage.setItem(QUOTES_KEY, JSON.stringify(updated));
  }

  return target;
}

export function deleteQuote(id: string): void {
  const current = getQuotes().filter((q) => q.id !== id);
  if (typeof window !== "undefined") localStorage.setItem(QUOTES_KEY, JSON.stringify(current));
}

// Computed Dashboard Metrics
export function getDashboardMetrics() {
  const quotes = getQuotes();

  const totalQuotesSent = quotes.length;
  const acceptedQuotes = quotes.filter((q) => q.status === "Accepted");
  const pendingQuotes = quotes.filter((q) => q.status === "Sent" || q.status === "Draft");

  const totalAcceptedValue = acceptedQuotes.reduce((acc, q) => acc + q.total, 0);
  const totalPendingValue = pendingQuotes.reduce((acc, q) => acc + q.total, 0);
  const winRate = totalQuotesSent > 0 ? Math.round((acceptedQuotes.length / totalQuotesSent) * 100) : 0;

  return {
    totalQuotesCount: totalQuotesSent,
    acceptedQuotesCount: acceptedQuotes.length,
    pendingQuotesCount: pendingQuotes.length,
    totalAcceptedValue,
    totalPendingValue,
    winRate,
    recentQuotes: quotes.slice(0, 5),
  };
}
