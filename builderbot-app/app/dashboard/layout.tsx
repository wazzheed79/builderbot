import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Quotes sent, jobs won, and what is still waiting.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
