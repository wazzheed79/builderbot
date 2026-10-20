import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isMissingPublicQuote } from "@/lib/supabase-server";

export async function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/q\/([^/]+)$/);
  if (!match) return NextResponse.next();

  const token = decodeURIComponent(match[1]);
  if (!(await isMissingPublicQuote(token))) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/quote-missing";
  return NextResponse.rewrite(url, { status: 404 });
}

export const config = {
  matcher: "/q/:token",
};
