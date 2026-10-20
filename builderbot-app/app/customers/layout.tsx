import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
  description: "Names, phone numbers, and the quotes you have sent them.",
};

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
