/**
 * Glow Studio Demo — pulse.
 * Returnerar statisk demo-data för orbens ringar och ripples.
 * Inga riktiga DB-queries — ger alltid imponerande, trovärdiga siffror.
 *
 * GET /api/klinik-demo/pulse?k=<key>&since=<ISO>
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEMO_SLUG = "klinik-demo";

async function getDemoAccessKey(): Promise<string | null> {
  const { data } = await supabase
    .from("clients")
    .select("hq_access_key")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();
  return (data as { hq_access_key?: string } | null)?.hq_access_key ?? null;
}

// Deterministiska men lite varierande siffror (baserade på dagsindex)
function getDemoNumbers() {
  const day = new Date().getDate();
  const seed = day % 7;
  return {
    leads7: 47 + seed,
    engaged: 18 + (seed % 5),
    booked7: 11 + (seed % 4),
    cash7: `${(36 + seed * 2)} 500 kr`,
  };
}

// Simulerade ripples — 2-3 per poll för att orben ska se levande ut
function getDemoRecent() {
  const now = Date.now();
  const types = ["lead", "booked", "msg", "lead", "msg"];
  return types.slice(0, 3).map((t, i) => ({
    t,
    at: new Date(now - (i + 1) * 12 * 60_000).toISOString(), // 12, 24, 36 min sedan
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
    console.error("[klinik-demo/pulse] error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
