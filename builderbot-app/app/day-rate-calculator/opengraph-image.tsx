import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand.mjs";
import { TAX_YEAR_LABEL } from "@/lib/day-rate.mjs";

export const alt = `Free day rate calculator for UK trades, ${TAX_YEAR_LABEL}, after tax · ${brand.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f0e6", color: "#2c2416" }}>
        <div style={{ width: 28, height: "100%", background: "#c4522a" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px 80px", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#a84322" }}>
            Free tool · {TAX_YEAR_LABEL} tax year
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.02, maxWidth: 980 }}>
            What should your day rate be?
          </div>
          <div style={{ display: "flex", fontSize: 34, maxWidth: 940 }}>
            Start with what you want to take home. It adds tax, NI, the van and tools, and the days you cannot charge.
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#a84322", fontWeight: 700 }}>{brand.name} day rate calculator</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
