import { Suspense } from "react";
import CustomerQuoteClient from "./CustomerQuoteClient";

export function generateStaticParams() {
  return [{ id: "BB-1042" }];
}

export default async function CustomerQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 font-semibold text-sm">
          Loading official quotation...
        </div>
      }
    >
      <CustomerQuoteClient quoteId={id} />
    </Suspense>
  );
}
