import type { Metadata } from "next";
import { brand } from "@/lib/brand.mjs";

export const metadata: Metadata = {
  // The sign-in email opens these pages. A standalone manifest makes Edge on
  // Android ask to open the Edge app, which leaves this tab.
  manifest: "/api/auth-manifest",
  appleWebApp: {
    capable: false,
    title: brand.shortName,
    statusBarStyle: "default",
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
