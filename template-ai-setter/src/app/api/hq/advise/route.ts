import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAccessKey } from "@/lib/access";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { todos, ideas, k, context } = await req.json() as { todos: string[]; ideas: string[]; k: string; context?: string };

    const validKey = await getAccessKey();
    if (!validKey || k !== validKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "no api key" }, { status: 500 });

    // Hämta affärsdata från databasen
    const [{ data: clientData }, { data: leadsData }, { data: recentEvents }] = await Promise.all([
      supabase.from("clients").select("business_context, voice_samples, system_prompt").eq("slug", "owner").maybeSingle(),
      supabase.from("leads").select("funnel_stage, status").eq("client_id", "ce05b747-b81a-4be5-9d63-a7435cc946ec"),
      supabase.from("events").select("event_type, created_at").eq("client_id", "ce05b747-b81a-4be5-9d63-a7435cc946ec").order("created_at", { ascending: false }).limit(20),
    ]);

    const leads = (leadsData ?? []) as { funnel_stage: string; status: string }[];
    const totalLeads = leads.length;
    const engaged = leads.filter((l) => l.status === "engaged").length;
    const booked = (recentEvents ?? []).filter((e: { event_type: string }) => e.event_type === "appointment_booked").length;

    const todoList = todos.length ? todos.map((t, i) => `${i + 1}. ${t}`).join("\n") : "Tom";
    const ideaList = ideas.length ? ideas.map((t) => `- ${t}`).join("\n") : "Tom";
    const businessCtx = (clientData as { business_context?: string } | null)?.business_context ?? "";

    const anthropic = new Anthropic({ apiKey });
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: `Du är Aura, Jacks personliga AI-strateg på Rekvo. Du känner Jacks affär på djupet:

REKVO:
- Jack säljer AI Instagram DM-setters till svenska skönhetskliniker och salonger
- Systemet svarar automatiskt på DMs, bokar möten och följer upp leads dygnet runt
- Jack är ensam säljare och bygger sin första kundbas just nu
- Viktigaste målet just nu: få igång AI-settern och boka de första betalande kunderna

LIVE DATA (just nu):
- Totalt ${totalLeads} leads i systemet
- ${engaged} aktiva leads (engaged)
- ${booked} bokade möten senaste tiden

AFFÄRSKONTEXT:
${businessCtx || "AI-setter för skönhetskliniker i Sverige"}

Du ger ärliga, konkreta råd på svenska. Inga tankstreck. Prioritera det som faktiskt rör Jack närmast ett betalt avtal. Max 6 meningar.`,
      messages: [{
        role: "user",
        content: `Att göra (ej klart):\n${todoList}\n\nIdéer:\n${ideaList}${context ? `\n\nJack skriver:\n${context}` : ""}`,
      }],
    });

    const text = res.content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("").trim();
    return NextResponse.json({ advice: text });
  } catch (e) {
    console.error("[advise]", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
