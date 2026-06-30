/**
 * Nordic Solar Demo — pulse.
 * Statisk demo-puls-data för orbens ringar och ripples.
 * Inga riktiga DB-queries — ger alltid trovärdiga solcells-siffror.
 *
 * GET /api/nordic-solar-demo/pulse?k=<key>&since=<ISO>
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEMO_SLUG = "nordic-solar-demo";

async function getDemoAccessKey(): Promise<string | null> {
  const { data } = await supabase
    .from("clients")
    .select("hq_access_key")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();
  return (data as { hq_access_key?: string } | null)?.hq_access_key ?? null;
}

function getDemoNumbers() {
  const day = new Date().getDate();
  const seed = day % 7;
  return {
    leads7: 62 + seed,
    engaged: 43 + (seed % 5),
    booked7: 15 + (seed % 4),
    cash7: `${(520 + seed * 15)} 000 kr`,
  };
}

function getDemoRecent() {
  const now = Date.now();
  const types = ["lead", "booked", "msg", "lead", "booked"];
  return types.slice(0, 3).map((t, i) => ({
    t,
    at: new Date(now - (i + 1) * 18 * 60_000).toISOString(),
  }));
}

export async function GET(req: NextRequest) {
  try {
    const k = req.nextUrl.searchParams.get("k") ?? "";
    const accessKey = await getDemoAccessKey();
    if (!accessKey || k !== accessKey) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      now: new Date().toISOString(),
      ring: getDemoNumbers(),
      recent: getDemoRecent(),
    });
  } catch (err) {
    console.error("[nordic-solar-demo/pulse] error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
