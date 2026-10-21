import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import PublicInvoiceClient from "./PublicInvoiceClient";
import { brand } from "@/lib/brand.mjs";
import { isMissingPublicInvoice } from "@/lib/supabase-server";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  if (await isMissingPublicInvoice(token)) notFound();
  const title = "Your invoice";
  const description = "Read this invoice and the payment details on your phone.";
  return {
    title,
    description,
    openGraph: { title: `${title} · ${brand.name}`, description },
  };
}

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (await isMissingPublicInvoice(token)) notFound();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">
          Loading invoice…
        </div>
      }
    >
      <PublicInvoiceClient token={token} />
    </Suspense>
  );
}
