import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { brand } from "@/lib/brand.mjs";
import { rateCardFromParams } from "@/lib/day-rate.mjs";

/** Rate card picture built from the figures in the link. Nothing is stored. */
export function GET(request: NextRequest) {
  const card = rateCardFromParams(request.nextUrl.searchParams);
  const pounds = (n: number) => `£${n.toLocaleString("en-GB")}`;
  const rows: [string, string][] = [
    ["Half day", pounds(card.half)],
    ["Per hour", pounds(card.hour)],
    ...(card.callOut > 0 ? ([["Call-out from", pounds(card.callOut)]] as [string, string][]) : []),
    ["Weekend day", pounds(card.weekend)],
    ["Emergency hour", pounds(card.emergency)],
  ];
  const heading = card.name || "My rates";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f0e6", color: "#2c2416" }}>
        <div style={{ width: 28, height: "100%", background: "#c4522a" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 72px", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#a84322" }}>
              {card.trade ? `${card.trade} · rates` : "Rates"}
            </div>
            <div style={{ display: "flex", fontSize: 60, fontWeight: 800, lineHeight: 1.05, marginTop: 8 }}>{heading}</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 56 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 28, color: "#5c4a38" }}>Day rate</div>
              <div style={{ display: "flex", fontSize: 150, fontWeight: 800, lineHeight: 1 }}>{pounds(card.day)}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 12 }}>
              {rows.map(([label, value]) => (
                <div key={label} style={{ display: "flex", fontSize: 30, gap: 16 }}>
                  <span style={{ color: "#5c4a38", width: 230 }}>{label}</span>
                  <span style={{ fontWeight: 800 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#5c4a38" }}>
            <span>Prices before VAT. Materials charged on top.</span>
            <span style={{ fontWeight: 700, color: "#a84322" }}>Made with {brand.name}</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400, immutable", "X-Robots-Tag": "noindex" },
    }
  );
}
