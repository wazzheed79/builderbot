import { Suspense } from "react";
import InvoiceEditorClient from "./InvoiceEditorClient";

export const instant = false;

export default async function InvoiceEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-12 text-sm font-semibold text-stone-600">Loading invoice…</div>
      }
    >
      <InvoiceEditorClient invoiceId={id} />
    </Suspense>
  );
}
