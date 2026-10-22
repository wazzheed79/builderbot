import type { Metadata } from "next";
import TryClient from "./TryClient";

export const metadata: Metadata = {
  title: "Try a quote free",
  description:
    "Type a job and see an itemised quote with Standard, Better, and Premium. No account. Nothing is saved or sent.",
  alternates: { canonical: "/try" },
};

export default function TryPage() {
  return <TryClient />;
}
