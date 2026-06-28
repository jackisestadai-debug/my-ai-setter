/**
 * GET /api/crm/stats?k=<key>
 * Returns lifetime totals from team_activity (excluding legacy seed rows tagged logged_by='legacy'
 * are included — they represent historical data before CRM started).
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

export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const client = await getClient();
  if (!client) return NextResponse.json({ error: "owner not found" }, { status: 500 });

  const { data, error } = await supabase
    .from("team_activity")
    .select("dials,conversations,pickups,outreaches,demos_pitched,demos_booked,demos_done,deals_closed")
    .eq("client_id", client.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sum = (key: string) =>
    (data ?? []).reduce((acc, row) => acc + ((row as Record<string, number>)[key] ?? 0), 0);

  const dials = sum("dials");
  const conversations = sum("conversations");
  const pickups = sum("pickups");
  const demos_pitched = sum("demos_pitched");
  const demos_booked = sum("demos_booked");
  const demos_done = sum("demos_done");
  const deals_closed = sum("deals_closed");

  const stats = {
    dials,
    conversations,
    pickups,
    demos_pitched,
    demos_booked,
    demos_done,
    deals_closed,
    // KPIs
    abr: dials > 0 ? ((pickups / dials) * 100).toFixed(1) : "0.0",
    show_rate: demos_booked > 0 ? ((demos_done / demos_booked) * 100).toFixed(1) : "0.0",
    close_rate: demos_pitched > 0 ? ((deals_closed / demos_pitched) * 100).toFixed(1) : "0.0",
    booking_rate: dials > 0 ? ((demos_booked / dials) * 100).toFixed(1) : "0.0",
  };

  return NextResponse.json({ stats });
}
