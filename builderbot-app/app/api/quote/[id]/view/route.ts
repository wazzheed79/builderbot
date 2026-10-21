import { NextRequest, NextResponse } from "next/server";
import { getSignedInUserId } from "@/lib/ai-access";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { quoteOwnerId, recordCustomerQuoteView } from "@/lib/supabase-server";
import {
  isVisitorId,
  newVisitorId,
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
} from "@/lib/quote-view.mjs";

function withVisitorCookie(response: NextResponse, visitorId: string, isNew: boolean) {
  if (!isNew) return response;
  response.cookies.set({
    name: VISITOR_COOKIE,
    value: visitorId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });
  return response;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !id.startsWith("q_") || id.length < 16) {
    return NextResponse.json({ error: "That quote link is not valid." }, { status: 400 });
  }

  const rate = await checkRateLimit(`quote-view:${getClientIp(request)}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Please wait a moment before opening this quote again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec || 60) } }
    );
  }

  const existing = request.cookies.get(VISITOR_COOKIE)?.value || "";
  const visitorId = isVisitorId(existing) ? existing : newVisitorId();
  const isNew = visitorId !== existing;

  const [ownerId, userId] = await Promise.all([quoteOwnerId(id), getSignedInUserId(request)]);
  if (ownerId && userId && ownerId === userId) {
    return withVisitorCookie(NextResponse.json({ counted: false }), visitorId, isNew);
  }

  const recorded = await recordCustomerQuoteView(id, visitorId);
  return withVisitorCookie(
    NextResponse.json({
      counted: Boolean(recorded?.counted),
      viewCount: recorded?.viewCount ?? 0,
    }),
    visitorId,
    isNew
  );
}
