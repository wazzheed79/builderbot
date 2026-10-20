"use client";

import { MessageCircle } from "lucide-react";
import { viewLabel, reminderDue } from "@/lib/quote-follow.mjs";
import { getWhatsAppFollowUpUrl } from "@/lib/share";
import { useSiteOrigin } from "@/lib/live-store";
import type { Quote } from "@/lib/storage";

export function QuoteFollowUp({
  quote,
  companyName,
}: {
  quote: Quote;
  companyName?: string;
}) {
  const origin = useSiteOrigin();
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
      {due && (
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
