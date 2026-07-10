/**
 * Nynäskalaset HQ — live pulse.
 * Returns DM stats, ticket sales, and follower counts for the festival client.
 * GET /api/nynaskalaset/pulse?k=<key>&since=<ISO>
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const HQ_KEY = process.env.NYNASKALASET_HQ_KEY ?? "";
const CLIENT_SLUG = "nynaskalaset";

export async function GET(req: NextRequest) {
  const k = req.nextUrl.searchParams.get("k") ?? "";
  if (!HQ_KEY || k !== HQ_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sinceParam = req.nextUrl.searchParams.get("since") ?? "";
  const floor = Date.now() - 10 * 60_000;
  const sinceMs = Math.max(new Date(sinceParam || 0).getTime() || floor, floor);
  const since = new Date(sinceMs).toISOString();

  // Get client row including follower counts
  const { data: client } = await supabase
    .from("clients")
    .select("id, is_active, fb_followers, fb_followers_yesterday")
    .eq("slug", CLIENT_SLUG)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "client not found" }, { status: 404 });
  }

  const clientId = client.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [
    { count: totalLeads },
    { count: leadsToday },
    { count: activeConvs },
    { count: dmsSentTotal },
    { count: dmsSentToday },
    { data: recentLeads },
    { data: ticketRows },
    { data: stageRows },
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("client_id", clientId),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("client_id", clientId).gte("created_at", todayISO),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("client_id", clientId).gte("last_message_at", new Date(Date.now() - 24 * 3600_000).toISOString()),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("role", "ai"),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("role", "ai").gte("created_at", todayISO),
    supabase.from("leads").select("created_at").eq("client_id", clientId).gt("created_at", since).order("created_at", { ascending: true }).limit(10),
    supabase.from("leads").select("ticket_type").eq("client_id", clientId).eq("ticket_purchased", true),
    supabase.from("leads").select("funnel_stage").eq("client_id", clientId),
  ]);

  // Aggregate ticket sales by type
  const ticketsByType: Record<string, number> = {};
  for (const row of ticketRows ?? []) {
    const t = row.ticket_type ?? "okänd";
    ticketsByType[t] = (ticketsByType[t] ?? 0) + 1;
  }
  const ticketsByTypeArr = Object.entries(ticketsByType).map(([type, count]) => ({ type, count }));

  // Ticket price map for revenue estimate
  const avgPrice: Record<string, number> = {
    "2-dagars": 1795, fredag: 995, lördag: 1195, vip: 2495, okänd: 1200,
  };
  const estimatedRevenue = (ticketRows ?? []).reduce((sum, r) => {
    const key = (r.ticket_type ?? "okänd").toLowerCase();
    return sum + (avgPrice[key] ?? 1200);
  }, 0);

  // Stage breakdown
  const stageCount: Record<string, number> = {};
  for (const row of stageRows ?? []) {
    const s = row.funnel_stage ?? "opener";
    stageCount[s] = (stageCount[s] ?? 0) + 1;
  }
  const linkSentCount = (stageCount["close"] ?? 0) + (stageCount["nurture"] ?? 0) + (stageCount["recommend"] ?? 0);

  const eventDate = new Date("2026-08-07T14:00:00+02:00"); // Friday opens 14:00
  const msLeft = eventDate.getTime() - Date.now();
  const daysLeft = Math.max(0, Math.floor(msLeft / 86_400_000));
  const hoursLeft = Math.max(0, Math.floor((msLeft % 86_400_000) / 3_600_000));

  return NextResponse.json({
    now: new Date().toISOString(),
    isActive: client.is_active,
    stats: {
      totalLeads: totalLeads ?? 0,
      leadsToday: leadsToday ?? 0,
      activeConvs: activeConvs ?? 0,
      dmsSentTotal: dmsSentTotal ?? 0,
      dmsSentToday: dmsSentToday ?? 0,
      ticketsSold: ticketRows?.length ?? 0,
      ticketsByType: ticketsByTypeArr,
      estimatedRevenue,
      linkSentCount,
      stageCount,
      fbFollowers: client.fb_followers ?? 0,
      fbFollowersYesterday: client.fb_followers_yesterday ?? 0,
    },
    countdown: { daysLeft, hoursLeft },
    recent: (recentLeads ?? []).map((l) => ({ kind: "lead", at: l.created_at })),
  });
}
