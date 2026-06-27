/**
 * CRM — update or delete a single lead.
 *
 * PATCH /api/crm/leads/<id>?k=<key>
 *       Body: any subset of { company_name, full_name, phone, status,
 *             next_step, crm_notes, needs_followup, crm_channel }
 *
 * DELETE /api/crm/leads/<id>?k=<key>
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await auth(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const client = await getClient();
  if (!client) return NextResponse.json({ error: "owner not found" }, { status: 500 });

  const body = await req.json();
  const allowed = ["company_name","full_name","phone","email","ig_username","status","next_step","crm_notes","needs_followup","crm_channel"];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  const { data, error } = await supabase
    .from("leads")
    .update(update)
    .eq("id", params.id)
    .eq("client_id", client.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await auth(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const client = await getClient();
  if (!client) return NextResponse.json({ error: "owner not found" }, { status: 500 });

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", params.id)
    .eq("client_id", client.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
