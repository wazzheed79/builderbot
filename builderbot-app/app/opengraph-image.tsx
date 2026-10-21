import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand.mjs";

export const alt = `${brand.name} — ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f6f0e6",
          color: "#2c2416",
        }}
      >
        <div style={{ width: 28, height: "100%", background: "#c4522a" }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px 80px",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#a84322",
            }}
          >
            Free in beta for UK trades
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.02 }}>
            {brand.name}
          </div>
          <div style={{ display: "flex", fontSize: 36, color: "#2c2416", maxWidth: 820 }}>
            Rough job notes into a professional itemised quote.
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#5c4a38" }}>
            Send a link or WhatsApp. They accept with no login.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
