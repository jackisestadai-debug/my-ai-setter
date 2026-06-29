/**
 * GET /api/crm/stats?k=<key>
 * Returns lifetime totals from team_activity for the requesting client.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase, getClientByKey } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const k = req.nextUrl.searchParams.get("k") ?? "";
  const client = await getClientByKey(k);
  if (!client) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("team_activity")
    .select("dials,conversations,pickups,outreaches,demos_pitched,demos_booked,demos_done,deals_closed,cash_collected,contract_value")
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
  const cash_collected = sum("cash_collected");
  const contract_value = sum("contract_value");
  const outreaches = sum("outreaches");
  const followups_outreach = sum("followups_outreach");

  const stats = {
    dials, conversations, pickups, outreaches, followups_outreach,
    demos_pitched, demos_booked, demos_done, deals_closed,
    cash_collected, contract_value,
    abr: dials > 0 ? ((pickups / dials) * 100).toFixed(1) : "0.0",
    show_rate: demos_booked > 0 ? ((demos_done / demos_booked) * 100).toFixed(1) : "0.0",
    close_rate: demos_pitched > 0 ? ((deals_closed / demos_pitched) * 100).toFixed(1) : "0.0",
    booking_rate: dials > 0 ? ((demos_booked / dials) * 100).toFixed(1) : "0.0",
  };

  return NextResponse.json({ stats });
}
