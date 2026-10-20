import type { Metadata } from "next";
import { Suspense } from "react";
import CustomerQuoteClient from "./CustomerQuoteClient";
import { brand } from "@/lib/brand.mjs";
import { fetchPublicQuoteHeading } from "@/lib/supabase";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const heading = (await fetchPublicQuoteHeading(id)) || "Your quote";
  const description = "Read this quote and accept it on your phone.";
  const socialTitle = `${heading} · ${brand.name}`;
  return {
    title: heading,
    description,
    openGraph: {
      title: socialTitle,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export function generateStaticParams() {
  return [{ id: "BB-1042" }];
}

export default function CustomerQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
