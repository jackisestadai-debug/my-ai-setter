/**
 * CRM — update or delete a single lead.
 *
 * PATCH /api/crm/leads/<id>?k=<key>
 * DELETE /api/crm/leads/<id>?k=<key>
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase, getClientByKey } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const k = req.nextUrl.searchParams.get("k") ?? "";
  const client = await getClientByKey(k);
  if (!client) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const allowed = ["company_name","full_name","phone","email","ig_username","status","next_step","crm_notes","needs_followup","crm_channel","demo_date"];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  const { data, error } = await supabase
    .from("leads")
    .update(update)
    .eq("id", id)
    .eq("client_id", client.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const k = req.nextUrl.searchParams.get("k") ?? "";
  const client = await getClientByKey(k);
  if (!client) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("client_id", client.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
