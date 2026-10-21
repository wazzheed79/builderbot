import { Suspense } from "react";
import InvoicesClient from "./InvoicesClient";

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-12 text-sm font-semibold text-stone-600">Loading invoices…</div>
      }
    >
      <InvoicesClient />
    </Suspense>
  );
}
