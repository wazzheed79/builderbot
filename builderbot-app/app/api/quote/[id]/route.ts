import { NextRequest, NextResponse } from "next/server";
import { fetchQuoteByTokenOrIdFromCloud, updateCloudQuoteStatus } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing quote identifier" }, { status: 400 });
    }

    const cloudQuote = await fetchQuoteByTokenOrIdFromCloud(id);
    if (!cloudQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json({ quote: cloudQuote });
  } catch (error) {
    console.error("API error fetching quote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, signatureName, reason } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const updated = await updateCloudQuoteStatus(id, status, {
      signatureName,
      reason,
    });

    return NextResponse.json({ success: updated });
  } catch (error) {
    console.error("API error updating quote status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
