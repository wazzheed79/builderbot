import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import CustomerQuoteClient from "./CustomerQuoteClient";
import { brand, configuredSiteUrl } from "@/lib/brand.mjs";
import { quoteCardImagePath } from "@/lib/public-quote.mjs";
import { fetchPublicQuoteCard, isMissingPublicQuote } from "@/lib/supabase-server";

// The status has to be known before the page is sent, so an unknown link can be a real 404.
export const instant = false;

function quoteCardImageUrl(id: string) {
  const site = configuredSiteUrl() || "https://www.tradematequotes.co.uk";
  return new URL(quoteCardImagePath(id), site).href;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (await isMissingPublicQuote(id)) notFound();
  const card = await fetchPublicQuoteCard(id);
  const heading = card?.heading || "Your quote";
  const description = card
    ? `${card.jobTitle}. ${card.total.toLocaleString("en-GB", { style: "currency", currency: "GBP" })}. Tap to view and accept.`
    : "Read this quote and accept it on your phone.";
  const socialTitle = `${heading} · ${brand.name}`;
  const imageUrl = quoteCardImageUrl(id);
  return {
    title: heading,
    description,
    openGraph: {
      title: socialTitle,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [imageUrl],
    },
  };
}

export default async function CustomerQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (await isMissingPublicQuote(id)) notFound();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 font-semibold text-sm">
          Loading official quotation...
        </div>
      }
    >
      <CustomerQuoteClient params={params} />
    </Suspense>
  );
}
