"use client";

import Link from "next/link";
import { BellRing, Check, MessageCircle } from "lucide-react";
import { useTodayIso } from "@/components/invoices/useTodayIso";
import { useBusinessProfile, useCustomerList, useJobList } from "@/lib/live-store";
import { saveJob } from "@/lib/storage";
import { captureEvent } from "@/lib/analytics";
import { hasBusinessName } from "@/lib/business-name.mjs";
import {
  formatRebookDate,
  getWhatsAppRebookUrl,
  nextRebookAfterDone,
  rebookDueLabel,
  rebookingsDue,
} from "@/lib/rebook-rules.mjs";

/**
 * Customers due a repeat visit (boiler service, gutter clean) in the next
 * month, or already overdue. Shown in the app only. Nothing is sent by itself:
 * the trade taps to open WhatsApp with a ready message.
 */
export default function RebookDue() {
  const today = useTodayIso();
  const jobs = useJobList();
  const customers = useCustomerList();
  const profile = useBusinessProfile();
  if (!today) return null;
  const rows = rebookingsDue(jobs, today);
  if (rows.length === 0) return null;
  const canMessage = hasBusinessName(profile.companyName);

  return (
    <section
      className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 sm:p-5"
      aria-labelledby="rebook-due-heading"
    >
      <h2 id="rebook-due-heading" className="flex items-center gap-2 text-base font-black text-emerald-950">
        <BellRing className="h-5 w-5" aria-hidden="true" />
        Due for a rebook
      </h2>
      <p className="mt-0.5 text-xs text-emerald-900">
        Repeat work coming round. Send a message, then tap Booked to set the next reminder.
      </p>
      <ul className="mt-3 divide-y divide-emerald-200 overflow-hidden rounded-xl border border-emerald-200 bg-white">
        {rows.map(({ job, daysUntil }) => {
          const customer = customers.find((item) => item.id === job.customerId);
          const href = getWhatsAppRebookUrl({
            clientName: customer?.name,
            clientPhone: customer?.phone,
            companyName: profile.companyName,
            ownerName: profile.ownerName,
            jobTitle: job.title,
            months: job.rebookMonths,
          });
          return (
            <li key={job.id} className="px-3 py-3">
              <div className="flex items-start gap-3">
                <Link href={`/customers/${encodeURIComponent(job.customerId)}`} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">{customer?.name || "Customer"}</span>
                  <span className="block truncate text-xs text-stone-600">{job.title}</span>
                </Link>
                <span
                  className={`shrink-0 text-right text-xs font-semibold ${daysUntil < 0 ? "text-red-700" : "text-emerald-800"}`}
                  title={job.rebookDue ? formatRebookDate(job.rebookDue) : undefined}
                >
                  {rebookDueLabel(daysUntil)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {canMessage ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => captureEvent("rebook_message_opened")}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-700 px-3 text-xs font-bold text-white"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Message on WhatsApp
                  </a>
                ) : (
                  <Link href="/settings" className="inline-flex min-h-11 items-center text-xs font-bold text-clay-800 underline">
                    Add your business name in Settings to send a message
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    saveJob({ ...job, ...nextRebookAfterDone(job, today) });
                    captureEvent("rebook_marked_done");
                  }}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-bold text-emerald-900"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Booked
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveJob({ ...job, rebookDue: undefined, rebookMonths: undefined });
                    captureEvent("rebook_reminder_cleared");
                  }}
                  className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-stone-600 underline"
                >
                  Stop reminding
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
