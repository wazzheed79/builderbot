import type { Metadata } from "next";
import { absoluteCanonicalUrl } from "@/lib/site-urls.mjs";
import TryClient from "./TryClient";

const tryUrl = absoluteCanonicalUrl("/try");

export const metadata: Metadata = {
  title: "Try a quote free",
  description:
    "Type a job and see an itemised quote with Standard, Better, and Premium. No account. Nothing is saved or sent.",
  alternates: { canonical: tryUrl },
  openGraph: {
    title: "Try a quote free",
    description:
      "Type a job and see an itemised quote with Standard, Better, and Premium. No account. Nothing is saved or sent.",
    url: tryUrl,
  },
};

export default function TryPage() {
  return <TryClient />;
}
