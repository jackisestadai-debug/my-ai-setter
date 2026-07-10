/**
 * Nynäskalaset HQ — AI chat brain.
 * Lets Jack ask questions about the festival client and take actions.
 * POST /api/nynaskalaset/chat?k=<key>  body: { message, history }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const HQ_KEY = process.env.NYNASKALASET_HQ_KEY ?? "";
const CLIENT_SLUG = "nynaskalaset";
const MODEL = "claude-sonnet-4-6";

async function getClientId(): Promise<string | null> {
  const { data } = await supabase.from("clients").select("id").eq("slug", CLIENT_SLUG).maybeSingle();
  return data?.id ?? null;
}

export async function POST(req: NextRequest) {
  const k = req.nextUrl.searchParams.get("k") ?? "";
  if (!HQ_KEY || k !== HQ_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { message, history = [] } = await req.json();
  if (!message) return NextResponse.json({ error: "no message" }, { status: 400 });

  const clientId = await getClientId();

  // Gather live context
  let ctx = "";
  if (clientId) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    const [
      { count: totalLeads },
      { count: leadsToday },
      { count: activeConvs },
      { count: dmsSent },
      { count: dmsToday },
      { data: recentLeads },
      { data: clientRow },
    ] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("client_id", clientId),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("client_id", clientId).gte("created_at", todayISO),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("client_id", clientId).gte("last_message_at", new Date(Date.now() - 24 * 3600_000).toISOString()),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("role", "ai"),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("role", "ai").gte("created_at", todayISO),
      supabase.from("leads").select("ig_username, full_name, last_message_at, funnel_stage").eq("client_id", clientId).order("last_message_at", { ascending: false }).limit(5),
      supabase.from("clients").select("is_active").eq("id", clientId).maybeSingle(),
    ]);

    const eventDate = new Date("2026-08-07T14:00:00+02:00");
    const daysLeft = Math.max(0, Math.floor((eventDate.getTime() - Date.now()) / 86_400_000));

    ctx = `
LIVE FESTIVAL DATA (Nynäskalaset):
- AI aktiv: ${clientRow?.is_active ? "JA" : "NEJ — pausad"}
- Dagar till eventet: ${daysLeft} (8 aug 2026)
- Totalt antal konversationer: ${totalLeads ?? 0}
- Nya konversationer idag: ${leadsToday ?? 0}
- Aktiva konversationer (senaste 24h): ${activeConvs ?? 0}
- AI-svar skickade totalt: ${dmsSent ?? 0}
- AI-svar skickade idag: ${dmsToday ?? 0}
- Senaste 5 konversationer: ${(recentLeads ?? []).map((l) => `${l.full_name ?? l.ig_username ?? "okänd"} (steg: ${l.funnel_stage ?? "ny"})`).join(", ") || "inga ännu"}
`;
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const system = `Du är KALA — festivalkontrollanterna för Nynäskalaset. Du hjälper Jack (arrangören/ägaren av AI-systemet) att övervaka och kontrollera festival-AI:n som svarar på Facebook-DMs för Nynäskalaset.

Du svarar ALLTID på svenska, kort och konkret. Max 2-3 meningar. Du är Jack's smarta assistent — inte en chatbot. Svara som en riktig person.

Du kan:
- Rapportera statistik om DMs och konversationer
- Svara på frågor om hur det går
- Föreslå nästa steg
- Berätta om nedräkningen till eventet

Du KAN INTE direkt pausa/starta AI:n via denna chatt (det görs via kontrollknapparna i HQ:n).

${ctx}

Dagens datum: ${new Date().toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;

  const messages = [
    ...history.map((h: { role: string; content: string }) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user" as const, content: message },
  ];

  const resp = await anthropic.messages.create({ model: MODEL, max_tokens: 400, system, messages });
  const text = resp.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("").trim();

  return NextResponse.json({ reply: text });
}
