import type { Metadata } from "next";
import { brand } from "@/lib/brand.mjs";

export const metadata: Metadata = {
  title: "Flyer",
  description: `A one-page flyer for ${brand.name}.`,
};

export default function FlyerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
