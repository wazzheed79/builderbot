"use client";

import { useSyncExternalStore } from "react";
import {
  ActivityItem,
  Customer,
  DEFAULT_BUSINESS_PROFILE,
  Invoice,
  Job,
  Quote,
  getBusinessProfile,
  getCustomers,
  getDashboardMetrics,
  getInvoices,
  getJobs,
  getQuotes,
  getRecentActivityFeed,
  BusinessProfile,
} from "./storage";

const CUSTOMERS_KEY = "builderbot_customers_v1";
const QUOTES_KEY = "builderbot_quotes_v1";
const JOBS_KEY = "builderbot_jobs_v1";
const INVOICES_KEY = "builderbot_invoices_v1";
const PROFILE_KEY = "builderbot_business_profile";

const EMPTY_CUSTOMERS: Customer[] = [];
const EMPTY_QUOTES: Quote[] = [];
const EMPTY_JOBS: Job[] = [];
const EMPTY_INVOICES: Invoice[] = [];
const EMPTY_ACTIVITY: ActivityItem[] = [];
const EMPTY_METRICS = {
  totalQuotesCount: 0,
  sentQuotesCount: 0,
  viewedQuotesCount: 0,
  activePipelineCount: 0,
  acceptedQuotesCount: 0,
  rejectedQuotesCount: 0,
  draftQuotesCount: 0,
  totalAcceptedValue: 0,
  totalPendingValue: 0,
  totalDraftValue: 0,
  winRate: 0,
  recentQuotes: EMPTY_QUOTES,
};

type Metrics = ReturnType<typeof getDashboardMetrics>;

function subscribe(onChange: () => void) {
  window.addEventListener("builderbot_storage_updated", onChange);
  return () => window.removeEventListener("builderbot_storage_updated", onChange);
}

function cached<T>(key: string, read: () => T, empty: T, slot: { raw: string; value: T }) {
  if (typeof window === "undefined") return empty;
  const raw = localStorage.getItem(key) ?? "";
  if (raw !== slot.raw) {
    slot.raw = raw;
    slot.value = raw ? read() : empty;
  }
  return slot.value;
}

const customerSlot = { raw: "\u0000", value: EMPTY_CUSTOMERS };
const quoteSlot = { raw: "\u0000", value: EMPTY_QUOTES };
const jobSlot = { raw: "\u0000", value: EMPTY_JOBS };
const invoiceSlot = { raw: "\u0000", value: EMPTY_INVOICES };
const profileSlot = { raw: "\u0000", value: DEFAULT_BUSINESS_PROFILE };
const metricsSlot = { raw: "\u0000", value: EMPTY_METRICS as Metrics };
const activitySlot = { raw: "\u0000", value: EMPTY_ACTIVITY };

function storageKey() {
  return [QUOTES_KEY, CUSTOMERS_KEY, JOBS_KEY, INVOICES_KEY]
    .map((key) => localStorage.getItem(key) ?? "")
    .join("\n");
}

function subscribeNoop() {
  return () => {};
}

export function useClientReady(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

export function useSiteOrigin(): string {
  return useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => ""
  );
}

export function useSiteHost(): string {
  return useSyncExternalStore(
    subscribeNoop,
    () => window.location.host,
    () => ""
  );
}

export function useCustomerList(): Customer[] {
  return useSyncExternalStore(
    subscribe,
    () => cached(CUSTOMERS_KEY, getCustomers, EMPTY_CUSTOMERS, customerSlot),
    () => EMPTY_CUSTOMERS
  );
}

export function useQuoteList(): Quote[] {
  return useSyncExternalStore(
    subscribe,
    () => cached(QUOTES_KEY, getQuotes, EMPTY_QUOTES, quoteSlot),
    () => EMPTY_QUOTES
  );
}

export function useJobList(): Job[] {
  return useSyncExternalStore(
    subscribe,
    () => cached(JOBS_KEY, getJobs, EMPTY_JOBS, jobSlot),
    () => EMPTY_JOBS
  );
}

export function useInvoiceList(): Invoice[] {
  return useSyncExternalStore(
    subscribe,
    () => cached(INVOICES_KEY, getInvoices, EMPTY_INVOICES, invoiceSlot),
    () => EMPTY_INVOICES
  );
}

export function useBusinessProfile(): BusinessProfile {
  return useSyncExternalStore(
    subscribe,
    () => cached(PROFILE_KEY, getBusinessProfile, DEFAULT_BUSINESS_PROFILE, profileSlot),
    () => DEFAULT_BUSINESS_PROFILE
  );
}

export function useDashboardMetrics(): Metrics {
  return useSyncExternalStore(
    subscribe,
    () => {
      const raw = storageKey();
      if (raw !== metricsSlot.raw) {
        metricsSlot.raw = raw;
        metricsSlot.value = getDashboardMetrics();
      }
      return metricsSlot.value;
    },
    () => EMPTY_METRICS
  );
}

export function useActivityFeed(): ActivityItem[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      const raw = storageKey();
      if (raw !== activitySlot.raw) {
        activitySlot.raw = raw;
        activitySlot.value = raw.trim() ? getRecentActivityFeed() : EMPTY_ACTIVITY;
      }
      return activitySlot.value;
    },
    () => EMPTY_ACTIVITY
  );
}
