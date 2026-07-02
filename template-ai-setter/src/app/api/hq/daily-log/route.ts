import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAccessKey } from "@/lib/access";

export const dynamic = "force-dynamic";

const CLIENT_ID = "ce05b747-b81a-4be5-9d63-a7435cc946ec";

async function auth(req: NextRequest): Promise<boolean> {
  const k = req.nextUrl.searchParams.get("k");
  const valid = await getAccessKey();
  return !!valid && k === valid;
}

// GET /api/hq/daily-log?k=...&date=2026-07-02   (omit date = today)
// GET /api/hq/daily-log?k=...&history=1          (last 30 entries)
export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (req.nextUrl.searchParams.get("history")) {
    const { data } = await supabase
      .from("daily_log")
      .select("log_date, plan, bevis, undvek, vinst")
      .eq("client_id", CLIENT_ID)
      .order("log_date", { ascending: false })
      .limit(30);
    return NextResponse.json({ entries: data ?? [] });
  }

  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("daily_log")
    .select("plan, bevis, undvek, vinst")
    .eq("client_id", CLIENT_ID)
    .eq("log_date", date)
    .maybeSingle();
  return NextResponse.json({ entry: data ?? {} });
}

// POST /api/hq/daily-log?k=...   body: { date, plan, bevis, undvek, vinst }
export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json() as { date?: string; plan?: string; bevis?: string; undvek?: string; vinst?: string };
  const date = body.date ?? new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("daily_log").upsert(
    { client_id: CLIENT_ID, log_date: date, plan: body.plan, bevis: body.bevis, undvek: body.undvek, vinst: body.vinst, updated_at: new Date().toISOString() },
    { onConflict: "client_id,log_date" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
