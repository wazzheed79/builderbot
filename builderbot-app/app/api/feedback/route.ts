import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getServerSupabase } from "@/lib/supabase-server";
import { brand } from "@/lib/brand.mjs";

const FeedbackSchema = z.object({
  message: z.string().trim().min(4).max(2000),
  contact: z.string().trim().max(200).optional(),
  page: z.string().trim().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`feedback:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Please wait a while before sending more feedback." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Please write a short message." },
      { status: 422 }
    );
  }

  const contactEmail = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL || brand.ownerEmail;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = serviceKey && isSupabaseConfigured() ? getServerSupabase() : null;

  if (supabase && serviceKey) {
    const { error } = await supabase.from("feedback").insert({
      message: parsed.data.message,
      contact: parsed.data.contact || null,
      page: parsed.data.page || null,
    });
    if (!error) {
      return NextResponse.json({ ok: true, stored: true });
    }
    console.error("[feedback] store failed", error.message);
  } else {
    console.info(
      "[feedback]",
      JSON.stringify({
        message: parsed.data.message,
        contact: parsed.data.contact || "",
        page: parsed.data.page || "",
      })
    );
  }

  return NextResponse.json({
    ok: true,
    stored: false,
    mailto: contactEmail
      ? `mailto:${contactEmail}?subject=${encodeURIComponent("Beta feedback")}`
      : "",
  });
}
