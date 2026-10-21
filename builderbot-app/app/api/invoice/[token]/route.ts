import { NextResponse } from "next/server";
import { isPublicInvoiceToken } from "@/lib/invoice-rules.mjs";
import { fetchPublicInvoiceByToken } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!isPublicInvoiceToken(token)) {
    return NextResponse.json({ error: "This invoice link is not valid." }, { status: 400 });
  }
  const result = await fetchPublicInvoiceByToken(token);
  if (!result) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }
  return NextResponse.json(result);
}
