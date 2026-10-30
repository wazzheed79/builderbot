import type { Metadata } from "next";
import { Suspense } from "react";
import QuotesClient from "./QuotesClient";

export const metadata: Metadata = {
  title: "Quote builder",
  description: "Talk or type the job, set the prices, then share a link the customer can accept.",
};

export default function QuotesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-500 font-semibold text-sm">
          Loading quote builder...
        </div>
      }
    >
      <QuotesClient />
    </Suspense>
  );
}