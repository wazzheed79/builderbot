"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { viewLabel, reminderDue } from "@/lib/quote-follow.mjs";
import { hasBusinessName } from "@/lib/business-name.mjs";
import { getWhatsAppFollowUpUrl } from "@/lib/share";
import { useClientReady, useSiteOrigin } from "@/lib/live-store";
import type { Quote } from "@/lib/storage";

export function QuoteFollowUp({
  quote,
  companyName,
}: {
  quote: Quote;
  companyName?: string;
}) {
  const origin = useSiteOrigin();
  const ready = useClientReady();
  const label = viewLabel(quote);
  const due = reminderDue(quote) && Boolean(origin);
  const href = due
    ? getWhatsAppFollowUpUrl(
        {
          quoteId: quote.id,
          token: quote.token,
          clientName: quote.clientName,
          clientPhone: quote.clientPhone,
          quoteTitle: quote.title,
          companyName: companyName || "",
          total: quote.total,
          deposit: quote.deposit,
          depositPercent: quote.depositPercent,
        },
        origin
      )
    : "";

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-stone-600">{label}</span>
      {ready && due && !hasBusinessName(companyName) && (
        <Link href="/settings" className="inline-flex min-h-11 items-center text-xs font-bold text-clay-800 underline">
          Add your business name in Settings before sending your first quote
        </Link>
      )}
      {ready && due && hasBusinessName(companyName) && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-clay-700 px-3 py-2 text-xs font-bold text-white"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Send a reminder
        </a>
      )}
    </div>
  );
}
