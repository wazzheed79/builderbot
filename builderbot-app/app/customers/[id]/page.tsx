import { Suspense } from "react";
import CustomerProfileClient from "./CustomerProfileClient";

export function generateStaticParams() {
  return [{ id: "cust-1" }];
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-xl w-48" />
          <div className="h-44 bg-slate-200 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="h-24 bg-slate-200 rounded-xl" />
            <div className="h-24 bg-slate-200 rounded-xl" />
            <div className="h-24 bg-slate-200 rounded-xl" />
            <div className="h-24 bg-slate-200 rounded-xl" />
          </div>
        </div>
      }
    >
      <CustomerProfileClient params={params} />
    </Suspense>
  );
}
