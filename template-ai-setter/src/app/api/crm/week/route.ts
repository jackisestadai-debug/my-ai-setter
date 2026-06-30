/**
 * GET /api/crm/week?k=<key>
 * Returns activity for the current Mon–Sun week.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase, getClient } from "@/lib/supabase";
import { getAccessKey } from "@/lib/access";

export const dynamic = "force-dynamic";

async function auth(req: NextRequest): Promise<boolean> {
  const k = req.nextUrl.searchParams.get("k") ?? "";
  const key = await getAccessKey();
  return !!key && k === key;
}

function weekRange() {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() + diffToMon);
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(mon), to: fmt(sun) };
}

export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const client = await getClient();
  if (!client) return NextResponse.json({ error: "owner not found" }, { status: 500 });

  const { from, to } = weekRange();

  const { data, error } = await supabase
    .from("team_activity")
    .select("activity_date,dials,conversations,demos_booked,deals_closed,cash_collected")
    .eq("client_id", client.id)
    .gte("activity_date", from)
    .lte("activity_date", to)
    .order("activity_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ week: data ?? [], from, to });
}
