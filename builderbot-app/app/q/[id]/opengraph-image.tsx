import { ImageResponse } from "next/og";
import { fetchPublicQuoteCard } from "@/lib/supabase-server";
import { vatPresentation } from "@/lib/vat.mjs";

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
  const chargesVat = card ? vatPresentation({ vatEnabled: card.vatEnabled }).charges : false;
  const vatLine = card ? (chargesVat ? "Total inc VAT" : "Not VAT registered - no VAT charged") : "";
  const costRows = card?.costRows ?? [];
  const vatAmount = card && chargesVat && card.vat > 0 ? card.vat : 0;

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
          {costRows.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {costRows.map((row) => (
                <div key={row.label} style={{ display: "flex", fontSize: 28, color: "#5c4a38" }}>
                  {`${row.label} ${pounds(row.amount)}`}
                </div>
              ))}
              {vatAmount > 0 ? (
                <div style={{ display: "flex", fontSize: 28, color: "#5c4a38" }}>{`VAT (20%) ${pounds(vatAmount)}`}</div>
              ) : null}
            </div>
          ) : null}
          {total ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: "#c4522a" }}>{total}</div>
              <div style={{ display: "flex", fontSize: 28, color: "#5c4a38" }}>{vatLine}</div>
            </div>
          ) : null}
          <div style={{ display: "flex", fontSize: 32, color: "#5c4a38" }}>Tap to view and accept</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
