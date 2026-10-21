"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import { displayInvoiceStatus, formatUkDate } from "@/lib/invoice-rules.mjs";
import { formatGbp } from "@/lib/quote-print.mjs";
import { useClientReady, useInvoiceList } from "@/lib/live-store";
import { useTodayIso } from "@/components/invoices/useTodayIso";

function tone(status: string) {
  if (status === "Paid") return "bg-emerald-100 text-emerald-800";
  if (status === "Overdue") return "bg-rose-100 text-rose-800";
  if (status === "Draft") return "bg-stone-100 text-stone-700";
  return "bg-amber-100 text-amber-950";
}

export default function InvoicesClient() {
  const ready = useClientReady();
  const invoices = useInvoiceList();
  const today = useTodayIso();

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-stone-600">Loading invoices…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">Invoices</h1>
          <p className="mt-1 text-sm text-stone-600">
            Made from a quote. Send a link, then mark it paid when the money arrives.
          </p>
        </div>
        <Receipt className="h-8 w-8 shrink-0 text-clay-700" />
      </div>

      {invoices.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 text-center">
          <p className="font-bold text-ink">No invoices yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">
            Open a quote you have sent, then tap Create invoice. The lines, customer, and VAT come across with it.
          </p>
          <Link
            href="/quotes"
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-clay-700 px-5 font-bold text-white"
          >
            Go to quotes
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {invoices.map((invoice) => {
            const status = today ? displayInvoiceStatus(invoice.status, invoice.dueDate, today) : invoice.status;
            return (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="block rounded-2xl border border-stone-200 bg-white p-4 shadow-xs transition hover:border-clay-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-black text-ink">{invoice.number}</p>
                      <p className="mt-1 truncate font-bold text-ink">{invoice.title}</p>
                      <p className="truncate text-sm text-stone-600">{invoice.clientName}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${tone(status)}`}>{status}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-xs text-stone-500">
                      Due {formatUkDate(invoice.dueDate) || "—"}
                      {invoice.optionLabel ? ` · ${invoice.optionLabel}` : ""}
                    </p>
                    <p className="text-lg font-black tabular-nums text-ink">{formatGbp(invoice.balanceDue)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
