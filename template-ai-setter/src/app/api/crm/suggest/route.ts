/**
 * POST /api/crm/suggest?k=<key>
 * Body: { lead: { company_name, full_name, status, crm_notes, next_step, demo_date, crm_channel } }
 * Returns: { suggestion: string }
 *
 * Generates a concrete next-step suggestion for a lead using Claude.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAccessKey } from "@/lib/access";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const client = new Anthropic();

async function auth(req: NextRequest): Promise<boolean> {
  const k = req.nextUrl.searchParams.get("k") ?? "";
  const key = await getAccessKey();
  return !!key && k === key;
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { lead } = await req.json();
  if (!lead) return NextResponse.json({ error: "missing lead" }, { status: 400 });

  const name = lead.company_name || lead.full_name || lead.ig_username || "Okänd";
  const channel = lead.crm_channel === "dm" ? "Instagram DM" : "Telefon";
  const status: Record<string, string> = {
    new: "Ny (ej kontaktad)",
    engaged: "Kontakt etablerad",
    booked: "Demo bokad",
    done: "Klar",
    lost: "Tappad",
  };

  const parts = [
    `Lead: ${name}`,
    `Kanal: ${channel}`,
    `Status: ${status[lead.status] ?? lead.status}`,
    lead.demo_date ? `Demomöte: ${lead.demo_date}` : null,
    lead.next_step ? `Antecknat nästa steg: ${lead.next_step}` : null,
    lead.crm_notes ? `Anteckningar: ${lead.crm_notes}` : null,
  ].filter(Boolean).join("\n");

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: `Du är en säljcoach för en solenergi-säljare. Analysera denna lead och ge ETT konkret, handlingsorienterat förslag på nästa steg. Max 2 meningar. Inga inledningar eller förklaringar — bara förslaget direkt. Skriv på svenska.\n\n${parts}`,
      },
    ],
  });

  const suggestion = (msg.content[0] as { type: string; text: string }).text.trim();
  return NextResponse.json({ suggestion });
}
