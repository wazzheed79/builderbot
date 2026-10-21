import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { legacyDomainLocation } from "@/lib/domain-redirect.mjs";
import { isMissingPublicQuote } from "@/lib/supabase-server";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const location = legacyDomainLocation(host, request.nextUrl.pathname, request.nextUrl.search);
  if (location) {
    return NextResponse.redirect(location, 308);
  }

  const match = request.nextUrl.pathname.match(/^\/q\/([^/]+)$/);
  if (!match) return NextResponse.next();

  const token = decodeURIComponent(match[1]);
  if (!(await isMissingPublicQuote(token))) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/quote-missing";
  return NextResponse.rewrite(url, { status: 404 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
