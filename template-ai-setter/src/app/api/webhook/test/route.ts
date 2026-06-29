import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });

  await supabase.from("webhook_debug_logs").insert({
    raw_payload: rawBody,
    raw_headers: headers,
    extracted_data: { query: Object.fromEntries(req.nextUrl.searchParams) },
  });

  return NextResponse.json({ ok: true, received: rawBody.slice(0, 200) });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "webhook-test" });
}
