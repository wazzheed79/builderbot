"use client";

import { BellRing } from "lucide-react";
import { useTodayIso } from "@/components/invoices/useTodayIso";
import { formatRebookDate, rebookFields, REBOOK_MONTH_CHOICES } from "@/lib/rebook-rules.mjs";

function choiceLabel(months: number) {
  if (months === 12) return "1 year";
  if (months % 12 === 0) return `${months / 12} years`;
  return `${months} months`;
}

/**
 * "Remind me to rebook" buttons. Calls onChange with the fields to save on the
 * job: a due date and months, or both cleared. Nothing is sent to the customer.
 */
export default function RebookPicker({
  rebookDue,
  rebookMonths,
  onChange,
  compact = false,
}: {
  rebookDue?: string;
  rebookMonths?: number;
  onChange: (fields: { rebookDue?: string; rebookMonths?: number }) => void;
  compact?: boolean;
}) {
  const today = useTodayIso();
  if (!today) return null;
  const dueText = rebookDue ? formatRebookDate(rebookDue) : "";

  return (
    <div className={compact ? "space-y-2" : "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-2"}>
      <p className="flex items-center gap-2 text-sm font-bold text-emerald-950">
        <BellRing className="h-4 w-4" aria-hidden="true" />
        {dueText ? `Rebook reminder: ${dueText}` : "Remind me to rebook this customer"}
      </p>
      {!compact && !dueText && (
        <p className="text-xs text-emerald-900">
          For work that comes round again, like a boiler service or gutter clean. It shows on your dashboard a month before. Nothing is sent to the customer by itself.
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Rebook reminder">
        {REBOOK_MONTH_CHOICES.map((months) => {
          const chosen = Boolean(dueText) && rebookMonths === months;
          return (
            <button
              key={months}
              type="button"
              aria-pressed={chosen}
              onClick={() => onChange(rebookFields(today, months))}
              className={`inline-flex min-h-11 items-center rounded-xl border px-3 text-xs font-bold ${
                chosen
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-emerald-300 bg-white text-emerald-900 hover:border-emerald-600"
              }`}
            >
              {choiceLabel(months)}
            </button>
          );
        })}
        {dueText && (
          <button
            type="button"
            onClick={() => onChange(rebookFields(today, 0))}
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-xs font-semibold text-stone-600 underline"
          >
            No reminder
          </button>
        )}
      </div>
    </div>
  );
}
