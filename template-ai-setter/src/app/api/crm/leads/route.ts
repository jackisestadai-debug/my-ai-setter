/**
 * CRM — leads list + create.
 *
 * GET  /api/crm/leads?k=<key>&channel=call|dm&status=<status>&q=<search>
 *      Returns leads for the owner, filtered by crm_channel, ordered by updated_at desc.
 *
 * POST /api/crm/leads?k=<key>
 *      Body: { company_name, full_name?, phone?, crm_channel, status?, next_step?, crm_notes? }
 *      Creates a new lead in the CRM.
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

  const channel = req.nextUrl.searchParams.get("channel"); // 'call' | 'dm' | null (all)
  const status = req.nextUrl.searchParams.get("status");
  const q = req.nextUrl.searchParams.get("q")?.trim();

  let query = supabase
    .from("leads")
    .select("id,company_name,full_name,phone,email,ig_username,status,crm_channel,next_step,needs_followup,crm_notes,demo_date,created_at,updated_at")
    .eq("client_id", client.id)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (channel) query = query.eq("crm_channel", channel);
  if (status) query = query.eq("status", status);
  if (q) {
    query = query.or(
      `company_name.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%,ig_username.ilike.%${q}%`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ leads: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const client = await getClient();
  if (!client) return NextResponse.json({ error: "owner not found" }, { status: 500 });

  const body = await req.json();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      client_id: client.id,
      company_name: body.company_name || null,
      full_name: body.full_name || null,
      phone: body.phone || null,
      email: body.email || null,
      ig_username: body.ig_username || null,
      crm_channel: body.crm_channel || "call",
      status: body.status || "new",
      next_step: body.next_step || null,
      crm_notes: body.crm_notes || null,
      needs_followup: body.needs_followup ?? false,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ lead: data });
}
