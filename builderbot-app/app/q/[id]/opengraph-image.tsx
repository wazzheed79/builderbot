import { ImageResponse } from "next/og";
import { fetchPublicQuoteCard } from "@/lib/supabase-server";

export const alt = "Your quote";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function pounds(amount: number) {
  const [whole, pence] = amount.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `£${grouped}.${pence}`;
}

export default async function QuoteCardImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await fetchPublicQuoteCard(id);
  const company = card?.company || "Your quote";
  const job = card?.jobTitle || "Tap to open the quote";
  const total = card ? pounds(card.total) : "";

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
            padding: "64px 72px",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#a84322" }}>{company}</div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.05 }}>{job}</div>
          {total ? (
            <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: "#c4522a" }}>{total}</div>
          ) : null}
          <div style={{ display: "flex", fontSize: 32, color: "#5c4a38" }}>Tap to view and accept</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
