import { NextRequest, NextResponse } from "next/server";
import { getSignedInUserId } from "@/lib/ai-access";
import { quoteOwnerId, recordCustomerQuoteView } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !id.startsWith("q_") || id.length < 16) {
    return NextResponse.json({ error: "That quote link is not valid." }, { status: 400 });
  }

  const [ownerId, userId] = await Promise.all([quoteOwnerId(id), getSignedInUserId(request)]);
  if (ownerId && userId && ownerId === userId) {
    return NextResponse.json({ counted: false });
  }

  const recorded = await recordCustomerQuoteView(id);
  return NextResponse.json({
    counted: Boolean(recorded),
    viewCount: recorded?.viewCount ?? 0,
  });
}
