"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ChevronRight, Hourglass } from "lucide-react";
import { useBusinessProfile, useQuoteList } from "@/lib/live-store";
import { quotesExpiringSoon } from "@/lib/quote-rules.mjs";

function subscribe() {
  return () => {};
}

/** Current time to the minute, so the server render and the first phone render agree. */
function useNowMinute() {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 60000) * 60000,
    () => 0
  );
}

function daysLeftLabel(days: number) {
  if (days <= 0) return "Ends today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

/**
 * Sent quotes the customer has not answered that run out within 3 days, so
 * they can be chased in time. Shown in the app only. Nothing is emailed.
 */
export default function ExpiringSoon() {
  const quotes = useQuoteList();
  const profile = useBusinessProfile();
  const now = useNowMinute();
  if (!now) return null;
  const rows = quotesExpiringSoon(quotes, profile.quoteValidityDays, now, 3);
  if (rows.length === 0) return null;

  return (
    <section
      className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5"
      aria-labelledby="expiring-soon-heading"
    >
      <h2 id="expiring-soon-heading" className="flex items-center gap-2 text-base font-black text-amber-950">
        <Hourglass className="h-5 w-5" aria-hidden="true" />
        Expiring soon
      </h2>
      <p className="mt-0.5 text-xs text-amber-900">
        Sent but not answered yet. Give these customers a nudge before the prices run out.
      </p>
      <ul className="mt-3 divide-y divide-amber-200 overflow-hidden rounded-xl border border-amber-200 bg-white">
        {rows.map(({ quote, daysLeft, expiryFormatted }) => (
          <li key={quote.id}>
            <Link
              href={`/quotes?quote=${encodeURIComponent(quote.id)}`}
              className="flex min-h-14 items-center gap-3 px-3 py-2.5 hover:bg-amber-50/60"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink">{quote.clientName || "Customer"}</span>
                <span className="block truncate text-xs text-stone-600">{quote.title}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-bold tabular-nums text-ink">
                  £{Number(quote.total || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`block text-xs font-semibold ${daysLeft <= 1 ? "text-red-700" : "text-amber-800"}`}
                  title={`Valid until ${expiryFormatted}`}
                >
                  {daysLeftLabel(daysLeft)}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
