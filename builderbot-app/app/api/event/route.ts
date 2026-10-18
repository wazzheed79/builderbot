import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const EventSchema = z.object({
  name: z.string().trim().min(1).max(80),
  path: z.string().trim().max(200).optional(),
  detail: z.string().trim().max(300).optional(),
});

/**
 * Cookieless log line for the free beta. Nothing is sent to a paid
 * monitoring service. The line shows up in the host's function logs.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`event:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  console.info(
    "[beta-event]",
    JSON.stringify({
      name: parsed.data.name,
      path: parsed.data.path || "",
      detail: parsed.data.detail || "",
    })
  );

  return NextResponse.json({ ok: true });
}
