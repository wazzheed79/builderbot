import { MapPin, Mail, Phone, Wrench } from "lucide-react";
import { displayBusinessName } from "@/lib/business-name.mjs";
import { formatGbp, preparePrintableQuote } from "@/lib/quote-print.mjs";
import { formatUkDate, paymentDetails, PAYMENT_DETAILS_TO_FOLLOW } from "@/lib/invoice-rules.mjs";
import type { Invoice } from "@/lib/storage";

export default function InvoiceDocument({
  invoice,
  statusLabel,
}: {
  invoice: Invoice;
  statusLabel: string;
}) {
  const printable = preparePrintableQuote({
    items: invoice.items,
    logoUrl: invoice.logoUrl,
    vatEnabled: invoice.vatEnabled,
    depositPercent: 0,
    totals: {
      subtotal: invoice.subtotal,
      vat: invoice.vat,
      total: invoice.total,
      deposit: 0,
    },
  });
  const payment = paymentDetails(invoice);
  const business = displayBusinessName(invoice.companyName, invoice.ownerName);
  const statusTone =
    statusLabel === "Paid"
      ? "bg-emerald-100 text-emerald-800"
      : statusLabel === "Overdue"
        ? "bg-rose-100 text-rose-800"
        : statusLabel === "Draft"
          ? "bg-stone-100 text-stone-700"
          : "bg-amber-100 text-amber-950";

  return (
    <div className="quote-document print-page overflow-hidden rounded-2xl border border-stone-200 border-t-8 border-t-clay-700 bg-[#fffdf8] shadow-xl print:overflow-visible">
      <div className="quote-letterhead border-b border-stone-200 bg-[#fffdf8] p-5 text-ink sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {printable.hasLogo && invoice.logoUrl && (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={invoice.logoUrl} alt="" className="h-full w-full object-contain" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-800">Invoice</p>
              <h1 className="mt-1 break-words text-2xl font-black tracking-tight text-ink sm:text-4xl">{business}</h1>
              {invoice.tradingName && <p className="text-sm text-clay-800">{invoice.tradingName}</p>}
              {invoice.businessPhone && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-700">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                  {invoice.businessPhone}
                </p>
              )}
              {invoice.businessEmail && (
                <p className="mt-1 flex items-center gap-1.5 break-all text-sm text-stone-700">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                  {invoice.businessEmail}
                </p>
              )}
              {invoice.businessAddress && (
                <p className="mt-1 flex items-start gap-1.5 text-sm text-stone-700">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
                  <span>{invoice.businessAddress}</span>
                </p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm sm:min-w-52">
            <p className="font-mono text-lg font-black text-ink">{invoice.number}</p>
            <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusTone}`}>{statusLabel}</p>
            <p className="mt-3 text-stone-600">Issued {formatUkDate(invoice.issueDate) || "—"}</p>
            <p className="text-stone-600">Due {formatUkDate(invoice.dueDate) || "—"}</p>
            {invoice.vatNumber && <p className="mt-2 text-xs text-stone-500">VAT {invoice.vatNumber}</p>}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Bill to</p>
            <p className="mt-1 font-bold text-ink">
              {invoice.clientName}
              {invoice.clientCompany ? ` (${invoice.clientCompany})` : ""}
            </p>
            {invoice.clientAddress && <p className="mt-1 text-stone-700">{invoice.clientAddress}</p>}
            {invoice.clientPhone && <p className="mt-1 text-stone-600">{invoice.clientPhone}</p>}
            {invoice.clientEmail && <p className="mt-1 break-all text-stone-600">{invoice.clientEmail}</p>}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Job</p>
            <p className="mt-1 font-bold text-ink">{invoice.title}</p>
            {invoice.optionLabel && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-stone-700">
                <Wrench className="h-3.5 w-3.5 text-clay-700" />
                {invoice.optionLabel} option
              </p>
            )}
            {invoice.quoteId && <p className="mt-1 text-stone-600">From quote {invoice.quoteId}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-8">
        {invoice.notes && (
          <div>
            <h2 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-stone-500">Notes</h2>
            <p className="quote-line-long whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-800">
              {invoice.notes}
            </p>
          </div>
        )}

        <div>
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-stone-600">Work and materials</h2>
          <div className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200">
            {printable.lines.map((item) => (
              <div
                key={item.key}
                className={`grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end ${item.long ? "quote-line quote-line-long" : "quote-line"}`}
              >
                <p className="min-w-0 font-medium wrap-break-word text-ink">{item.description}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Qty</p>
                    <p className="mt-0.5 text-sm tabular-nums text-stone-800">
                      {item.qtyLabel} {item.unit}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Rate</p>
                    <p className="mt-0.5 text-sm tabular-nums text-stone-800">{item.rateLabel}</p>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Amount</p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-ink">{item.lineTotal}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quote-totals ml-auto w-full max-w-sm space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-stone-600">Subtotal</span>
            <span className="font-semibold tabular-nums">{formatGbp(invoice.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-600">{invoice.vatEnabled ? "VAT 20%" : "VAT"}</span>
            <span className="font-semibold tabular-nums">{invoice.vatEnabled ? formatGbp(invoice.vat) : "Not charged"}</span>
          </div>
          <div className="flex items-center justify-between border-t border-stone-200 pt-2 text-base">
            <span className="font-extrabold text-ink">Total</span>
            <span className="text-2xl font-black tabular-nums text-ink">{formatGbp(invoice.total)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-ink">Balance due</span>
            <span className="font-black tabular-nums text-clay-800">{formatGbp(invoice.balanceDue)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-stone-500">How to pay</h2>
          {payment.ready ? (
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {payment.bankName && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Bank</dt>
                  <dd className="font-semibold text-ink">{payment.bankName}</dd>
                </div>
              )}
              {payment.sortCode && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Sort code</dt>
                  <dd className="font-mono font-semibold text-ink">{payment.sortCode}</dd>
                </div>
              )}
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Account number</dt>
                <dd className="font-mono font-semibold text-ink">{payment.accountNumber}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Reference</dt>
                <dd className="font-mono font-semibold text-ink">{invoice.number}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm font-semibold text-stone-700">{PAYMENT_DETAILS_TO_FOLLOW}</p>
          )}
        </div>

        {invoice.termsAndConditions && (
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-500">{invoice.termsAndConditions}</p>
        )}
      </div>
    </div>
  );
}
