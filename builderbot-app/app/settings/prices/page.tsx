import type { Metadata } from "next";
import PriceListClient from "./PriceListClient";

export const metadata: Metadata = {
  title: "My price list",
  description: "Save your own prices once. New quotes use them, and the AI fills in the quantities.",
};

export default function PriceListPage() {
  return <PriceListClient />;
}
