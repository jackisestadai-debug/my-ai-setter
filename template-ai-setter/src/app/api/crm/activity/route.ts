/**
 * CRM — daily activity tracker for the owner's call / DM numbers.
 *
 * GET  /api/crm/activity?k=<key>&date=<YYYY-MM-DD>
 * POST /api/crm/activity?k=<key>  body: { date?, dials?, ... }
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase, getClientByKey } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export async function GET(req: NextRequest) {
  const k = req.nextUrl.searchParams.get("k") ?? "";
  const client = await getClientByKey(k);
  if (!client) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") || todayIso();

  const { data, error } = await supabase
    .from("team_activity")
    .select("*")
    .eq("client_id", client.id)
    .eq("activity_date", date)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ activity: data ?? null, date });
}

export async function POST(req: NextRequest) {
  const k = req.nextUrl.searchParams.get("k") ?? "";
  const client = await getClientByKey(k);
  if (!client) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const date = body.date || todayIso();

  const row = {
    client_id: client.id,
    activity_date: date,
    dials: body.dials ?? 0,
    conversations: body.conversations ?? 0,
    pickups: body.pickups ?? 0,
    outreaches: body.outreaches ?? 0,
    followups_outreach: body.followups_outreach ?? 0,
    followups_dials: body.followups_dials ?? 0,
    demos_pitched: body.demos_pitched ?? 0,
    demos_booked: body.demos_booked ?? 0,
    demos_done: body.demos_done ?? 0,
    deals_closed: body.deals_closed ?? 0,
    cash_collected: body.cash_collected ?? 0,
    contract_value: body.contract_value ?? 0,
    note: body.note ?? null,
    logged_by: "owner",
  };

  const { data, error } = await supabase
    .from("team_activity")
    .upsert(row, { onConflict: "client_id,activity_date" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ activity: data });
}
