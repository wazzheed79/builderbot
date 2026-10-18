import { NextResponse } from "next/server";
import { brand } from "@/lib/brand.mjs";

export function GET() {
  return NextResponse.json({
    name: `${brand.name} — ${brand.tagline}`,
    short_name: brand.shortName,
    description: brand.description,
    start_url: "/dashboard",
    id: "/dashboard",
    display: "standalone",
    background_color: "#f6f0e6",
    theme_color: "#c4522a",
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "New Quote",
        short_name: "New Quote",
        description: "Start a new trade quote",
        url: "/quotes",
        icons: [{ src: "/icon.svg", sizes: "192x192" }],
      },
      {
        name: "Customers",
        short_name: "Customers",
        description: "View customer directory and quotes",
        url: "/customers",
        icons: [{ src: "/icon.svg", sizes: "192x192" }],
      },
    ],
  });
}
