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
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#a84322",
            }}
          >
            For tradespeople
          </div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1 }}>
            {brand.name}
          </div>
          <div style={{ display: "flex", fontSize: 40, color: "#5c4a38" }}>{brand.tagline}</div>
          <div style={{ display: "flex", fontSize: 30, color: "#2c2416" }}>
            Speak the job. Send a quote the customer can accept.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
