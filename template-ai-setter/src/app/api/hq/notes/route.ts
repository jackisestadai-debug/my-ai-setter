import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { OWNER_SLUG } from "@/lib/owner";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("k");
  let q = supabase.from("clients").select("owner_notes");
  if (key) q = q.eq("access_key", key) as typeof q;
  else q = q.eq("slug", OWNER_SLUG) as typeof q;
  const { data } = await q.maybeSingle();
  return NextResponse.json({ notes: (data as { owner_notes?: string } | null)?.owner_notes ?? "" });
}

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("k");
  const { notes } = await req.json();
  if (typeof notes !== "string") return NextResponse.json({ error: "bad input" }, { status: 400 });
  let q = supabase.from("clients").update({ owner_notes: notes });
  if (key) q = q.eq("access_key", key) as typeof q;
  else q = q.eq("slug", OWNER_SLUG) as typeof q;
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
