"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Printer, Send, Trash2 } from "lucide-react";
import InvoiceDocument from "@/components/invoices/InvoiceDocument";
import { useTodayIso } from "@/components/invoices/useTodayIso";
import LineItemEditor from "@/components/quotes/LineItemEditor";
import { displayInvoiceStatus, invoiceTotals, paymentDetails } from "@/lib/invoice-rules.mjs";
import { getWhatsAppInvoiceShareUrl } from "@/lib/share";
import {
  deleteInvoice,
  getBusinessProfile,
  saveInvoice,
  type Invoice,
  type LineItem,
} from "@/lib/storage";
import { useClientReady, useInvoiceList, useSiteOrigin } from "@/lib/live-store";
import { captureEvent } from "@/lib/analytics";

export default function InvoiceEditorClient({ invoiceId }: { invoiceId: string }) {
  const ready = useClientReady();
  const invoices = useInvoiceList();
  const today = useTodayIso();
  const origin = useSiteOrigin();
  const router = useRouter();
  const stored = invoices.find((invoice) => invoice.id === invoiceId);
  const [edits, setEdits] = useState<Invoice | null>(null);
  const [notice, setNotice] = useState("");
  const draft = edits && edits.id === stored?.id ? edits : stored ?? null;
  const setDraft = (next: Invoice) => setEdits(next);

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-stone-600">Loading invoice…</div>;
  }
  if (!draft) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="font-bold text-ink">That invoice is not on this phone.</p>
        <Link href="/invoices" className="mt-4 inline-flex min-h-12 items-center font-bold text-clay-800 underline">
          Back to invoices
        </Link>
      </div>
    );
  }

  const statusLabel = today ? displayInvoiceStatus(draft.status, draft.dueDate, today) : draft.status;
  const locked = draft.status === "Paid";
  const link = origin && draft.token ? `${origin}/i/${draft.token}` : "";
  const figures = invoiceTotals(draft.items, draft.vatEnabled, locked ? draft.total : 0);
  const shown: Invoice = {
    ...draft,
    ...figures,
    balanceDue: locked ? 0 : figures.balanceDue,
    depositPaid: locked ? figures.total : figures.depositPaid,
  };

  const persist = (next: Invoice, message: string) => {
    const saved = saveInvoice(next);
    setDraft(saved);
    setNotice(message);
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    const items = draft.items.map((item) => {
      if (item.id !== id || item[field] === value) return item;
      const clearsSource = field === "rate" || field === "description" || field === "unit";
      return {
        ...item,
        [field]: value,
        usualPrice: clearsSource ? false : item.usualPrice,
        rateSource: clearsSource ? undefined : item.rateSource,
      };
    });
    if (items.every((item, index) => item === draft.items[index])) return;
    setDraft({ ...draft, items });
  };

  const shareUrl = getWhatsAppInvoiceShareUrl({
    invoiceId: draft.number,
    link: link || undefined,
    clientName: draft.clientName,
    clientPhone: draft.clientPhone,
    title: draft.title,
    companyName: draft.companyName,
    contractorName: draft.ownerName,
    total: shown.total,
    balanceDue: shown.balanceDue,
    dueDate: draft.dueDate,
    bankName: draft.bankName,
    bankSortCode: draft.bankSortCode,
    bankAccountNumber: draft.bankAccountNumber,
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <Link href="/invoices" className="inline-flex min-h-11 items-center text-sm font-bold text-clay-800 underline">
          All invoices
        </Link>
        <span className="font-mono text-sm font-black text-ink">{draft.number}</span>
      </div>

      <div className="no-print space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold text-ink">
            Issue date
            <input
              type="date"
              value={draft.issueDate || ""}
              disabled={locked}
              onChange={(event) => setDraft({ ...draft, issueDate: event.target.value })}
              className="mt-1 min-h-12 w-full rounded-xl border border-stone-300 px-3"
            />
          </label>
          <label className="block text-sm font-bold text-ink">
            Due date
            <input
              type="date"
              value={draft.dueDate || ""}
              disabled={locked}
              onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
              className="mt-1 min-h-12 w-full rounded-xl border border-stone-300 px-3"
            />
          </label>
        </div>
        <label className="flex min-h-12 items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={draft.vatEnabled}
            disabled={locked}
            onChange={(event) => setDraft({ ...draft, vatEnabled: event.target.checked })}
            className="h-5 w-5"
          />
          Add 20% VAT, same as the quote
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={locked}
            onClick={() => persist(draft, "Invoice saved.")}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-clay-700 px-4 font-bold text-white disabled:opacity-50"
          >
            Save changes
          </button>
          <button
            type="button"
            disabled={locked || draft.status === "Sent"}
            onClick={() => persist({ ...draft, status: "Sent" }, "Invoice sent. You can share the link.")}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-bold text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Send invoice
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-900"
          >
            Share on WhatsApp
          </a>
          <button
            type="button"
            onClick={() => {
              if (link) navigator.clipboard?.writeText(link).catch(() => {});
              setNotice(link ? "Customer link copied." : "Save the invoice, then copy the link.");
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-ink"
          >
            <Copy className="h-4 w-4" />
            Copy customer link
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-ink"
          >
            <Printer className="h-4 w-4" />
            Print or save PDF
          </button>
          {draft.status !== "Paid" && (
            <button
              type="button"
              onClick={() => {
                persist(
                  { ...draft, status: "Paid", depositPaid: draft.total, balanceDue: 0, paidAt: new Date().toISOString() },
                  "Marked as paid."
                );
                captureEvent("invoice_marked_paid");
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-bold text-emerald-900"
            >
              <Check className="h-4 w-4" />
              Mark as paid
            </button>
          )}
        </div>
        <button
          type="button"
          disabled={locked}
          onClick={() => {
            const profile = getBusinessProfile();
            const payment = paymentDetails(profile);
            setDraft({
              ...draft,
              companyName: profile.companyName,
              tradingName: profile.tradingName,
              ownerName: profile.ownerName,
              businessPhone: profile.phone,
              businessEmail: profile.email,
              businessAddress: profile.address,
              vatNumber: profile.vatRegistered ? profile.vatNumber || "" : "",
              bankName: payment.bankName,
              bankSortCode: payment.sortCode,
              bankAccountNumber: payment.accountNumber,
              logoUrl: profile.logoUrl,
              accreditations: profile.accreditations,
              termsAndConditions: profile.termsAndConditions,
            });
            setNotice(
              payment.ready
                ? "Payment details copied from Settings."
                : "Settings has no account number, so this invoice says payment details to follow."
            );
          }}
          className="min-h-11 text-left text-sm font-semibold text-clay-800 underline disabled:opacity-50"
        >
          Use business and payment details from Settings
        </button>
        {draft.status === "Draft" && (
          <button
            type="button"
            onClick={() => {
              deleteInvoice(draft.id);
              router.push("/invoices");
            }}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-rose-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete draft
          </button>
        )}
        {notice && <p className="text-sm font-semibold text-ink">{notice}</p>}
        {link && <p className="break-all text-xs text-stone-500">{link}</p>}
      </div>

      {!locked && (
        <div className="no-print mt-4">
          <LineItemEditor
            heading="Invoice lines"
            items={draft.items}
            isAiDraft={false}
            onAcknowledgeAiDraft={() => {}}
            onAddPrice={(line) =>
              setDraft({
                ...draft,
                items: [...draft.items, { ...line, id: `line-${Date.now()}` }],
              })
            }
            onAddItem={(type) =>
              setDraft({
                ...draft,
                items: [
                  ...draft.items,
                  {
                    id: `line-${Date.now()}`,
                    type,
                    description: type === "labor" ? "Labour" : "Materials",
                    quantity: 1,
                    unit: type === "labor" ? "hrs" : "unit",
                    rate: 0,
                  },
                ],
              })
            }
            onUpdateItem={updateItem}
            onDeleteItem={(id) => setDraft({ ...draft, items: draft.items.filter((item) => item.id !== id) })}
          />
        </div>
      )}

      <div className="mt-4">
        <InvoiceDocument invoice={shown} statusLabel={statusLabel} />
      </div>
    </div>
  );
}
