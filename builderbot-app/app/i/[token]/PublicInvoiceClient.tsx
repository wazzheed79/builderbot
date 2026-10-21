"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import InvoiceDocument from "@/components/invoices/InvoiceDocument";
import { useTodayIso } from "@/components/invoices/useTodayIso";
import { displayInvoiceStatus } from "@/lib/invoice-rules.mjs";
import type { Invoice } from "@/lib/storage";
import { useClientReady, useInvoiceList } from "@/lib/live-store";

export default function PublicInvoiceClient({ token }: { token: string }) {
  const ready = useClientReady();
  const invoices = useInvoiceList();
  const today = useTodayIso();
  const local = invoices.find((invoice) => invoice.token === token);
  const [remote, setRemote] = useState<Invoice | null>(null);
  const [remoteStatus, setRemoteStatus] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!ready || local) return;
    let active = true;
    fetch(`/api/invoice/${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        if (data?.invoice) {
          setRemote(data.invoice as Invoice);
          setRemoteStatus(String(data.statusLabel || ""));
        } else {
          setMissing(true);
        }
      })
      .catch(() => {
        if (active) setMissing(true);
      });
    return () => {
      active = false;
    };
  }, [ready, local, token]);

  const invoice = local || remote;
  if (!ready || (!invoice && !missing)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-stone-500">
        Loading invoice…
      </div>
    );
  }
  if (!invoice) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-black text-ink">Invoice not found</h1>
        <p className="mt-2 text-sm text-stone-600">This link does not match an invoice.</p>
      </div>
    );
  }

  const statusLabel = remote && !local && remoteStatus
    ? remoteStatus
    : today
      ? displayInvoiceStatus(invoice.status, invoice.dueDate, today)
      : invoice.status;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stone-600">Invoice {invoice.number}</p>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-clay-700 px-4 font-bold text-white"
        >
          <Printer className="h-4 w-4" />
          Print or save PDF
        </button>
      </div>
      <InvoiceDocument invoice={invoice} statusLabel={statusLabel} />
    </div>
  );
}
