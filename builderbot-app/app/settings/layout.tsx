import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Your company name, bank details, and the wording customers see.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
