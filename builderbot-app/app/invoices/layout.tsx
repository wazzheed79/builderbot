import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Invoices made from your quotes, with a link you can send on WhatsApp.",
};

export default function InvoicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
