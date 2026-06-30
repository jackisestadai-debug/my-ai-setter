/**
 * Glow Studio Demo HQ — chat brain.
 *
 * Aura svarar på svenska om Glow Studios affär. Alltid i demo-mode:
 * trovärdiga men påhittade siffror, inga riktiga DB-actions.
 * Autentisering mot clients.hq_access_key (slug='klinik-demo').
 *
 * POST /api/klinik-demo/chat?k=<key>
 *   body: { message, history, demo? }
 *   → { speech, panels, clear, rings, power, demo, theme, demoChat, pitch }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const MODEL = "claude-sonnet-4-6";
const DEMO_SLUG = "klinik-demo";

async function getDemoAccessKey(): Promise<string | null> {
  const { data } = await supabase
    .from("clients")
    .select("hq_access_key")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();
  return (data as { hq_access_key?: string } | null)?.hq_access_key ?? null;
}

const SYSTEM_PROMPT = `Du är Aura — Glow Studios AI-assistent, inbyggd i klinikens HQ. Du pratar alltid på svenska. Du är professionell, varm och direkt.

Glow Studio är en premiumklinik för estetiska behandlingar. Östergatan 21, Stockholm. Öppet mån-fre 08-18.
Behandlingar: Botox (fr 2 500 kr), Fillers (fr 3 500 kr), Laser/IPL (fr 1 800 kr), Ansiktsbehandling (fr 1 200 kr), Microneedling (fr 2 200 kr), Brow & lash design (fr 800 kr), Permanent makeup (fr 3 000 kr).

OUTPUT: exactly one JSON object {"speech":"...","panels":[...],"clear":false,"rings":false,"power":null,"demo":null,"theme":null,"demoChat":false,"pitch":false} — no prose, no code fences.

speech = vad du säger HÖGT. ALLTID 1-2 korta meningar, talat naturligt, ingen markdown. Svaret FÖRST. Detaljer i paneler.

rings = true när konversationen handlar om siffror, omsättning, bokningar eller hur verksamheten mår.

[DEMO-SIFFROR — använd alltid dessa, variera lite naturligt]
• Leads senaste 7 dagarna: 47–54
• Aktiva leads just nu: 18–24
• Bokade besök (7 dagar): 11–14
• Omsättning senaste 7 dagar: 36 000–48 000 kr
• Omsättning senaste 30 dagar: 142 000–168 000 kr
• Mest bokade: Botox (42%), Fillers (28%), Laser (18%)
• Konverteringsgrad DM → Bokning: 29–35%
• AI-assisterade bokningar: 73%
• Genomsnittligt ordervärde: 3 800 kr

[VARMA LEADS (om frågad)]
Välj bland: Anna Lindqvist (botox), Sofia Bergström (fillers), Maja Karlsson (laser), Emma Johansson (microneedling), Isabelle Eriksson (ansiktsbehandling), Hanna Persson (botox + fillers)

[SENASTE BOKNINGAR (om frågad)]
Välj bland: Maria Svensson – botox i morse, Julia Anderson – fillers igår, Sara Magnusson – laser (förra veckan), Klara Nilsson – ansiktsbehandling (förra veckan)

[POWER-KOMMANDON]
• "gå och sov" / "viloläge" / "gå i standby" → {"power":"sleep","speech":"Viloläge. Klappa i händerna när du behöver mig.","panels":[],"clear":false,"rings":false,"demo":null,"theme":null,"demoChat":false,"pitch":false}
• "stäng av" / "shut down" → {"power":"off","speech":"Stänger av. Tapp på orben för att starta om.","panels":[],"clear":false,"rings":false,"demo":null,"theme":null,"demoChat":false,"pitch":false}

[DEMO-KONTROLLER]
• "demo mode" / "visa för klient" → demo: true
• "avsluta demo" / "tillbaka" → demo: false
• "gör det blått" / färgkommandon → theme: "<färg>"
• "visa chatten" / "demo DM" / "visa receptionist" → demoChat: true
• "pitch" / "kör presentationen" / "visa demot" / "visa demo" / "imponera" / "ta fram demot" / "kör demo" → pitch: true, demo: true (ge EN kort kickoff-mening som speech)

[PANELTYPER]
• {"kind":"metric","title":"OMSÄTTNING · 7D","value":"41 500 kr","sub":"11 bokningar","accent":true}
• {"kind":"funnel","title":"KONVERTERING","rows":[{"label":"Leads","value":51},{"label":"Engagerade","value":22},{"label":"Bokade","value":13}]}
• {"kind":"bars","title":"BEHANDLINGAR","rows":[{"label":"Botox","value":42},{"label":"Fillers","value":28},{"label":"Laser","value":18},{"label":"Övrigt","value":12}]}
• {"kind":"stats","title":"PRESTANDA","items":[{"label":"AI-bokningar","value":"73%"},{"label":"Konvertering","value":"31%"},{"label":"Snittvärde","value":"3 800 kr"}]}
• {"kind":"list","title":"VARMA LEADS","rows":[{"primary":"Anna Lindqvist","secondary":"botox","tertiary":"svarade idag"},{"primary":"Sofia Bergström","secondary":"fillers","tertiary":"3 svar"}]}
• {"kind":"draft","title":"UTKAST → LEAD","value":"meddelande...","sub":"säg 'skicka det' för att bekräfta"}

"clear": true — sudda skärmen (topic-byte eller "rensa skärmen").

Pengaformat: "41 500 kr". Procent: "31 %". Tala alltid svenska — kort, tydligt och varmt.`;

interface Panel { kind: string; [k: string]: unknown }
interface ChatResult {
  speech: string; panels: Panel[]; clear: boolean; rings: boolean;
  power: "sleep" | "off" | null; demo: boolean | null; theme: string | null;
  demoChat: boolean; pitch: boolean;
}
function parseResult(text: string): ChatResult {
  const base = { panels: [] as Panel[], clear: false, rings: false, power: null as "sleep" | "off" | null, demo: null as boolean | null, theme: null as string | null, demoChat: false, pitch: false };
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s === -1 || e === -1 || e < s) return { speech: text.trim() || "Här är jag — vad behöver du?", ...base };
  try {
    const obj = JSON.parse(text.slice(s, e + 1));
    return {
      speech: typeof obj.speech === "string" ? obj.speech : "Klart.",
      panels: Array.isArray(obj.panels) ? obj.panels : [],
      clear: obj.clear === true,
      rings: obj.rings === true,
      power: obj.power === "sleep" || obj.power === "off" ? obj.power : null,
      demo: obj.demo === true ? true : obj.demo === false ? false : null,
      theme: typeof obj.theme === "string" && obj.theme.trim() ? obj.theme.trim().slice(0, 24) : null,
      demoChat: obj.demoChat === true,
      pitch: obj.pitch === true,
    };
  } catch {
    return { speech: text.trim().slice(0, 300) || "Klart.", ...base };
  }
}

export async function POST(req: NextRequest) {
  try {
    const k = req.nextUrl.searchParams.get("k") ?? "";
    const accessKey = await getDemoAccessKey();
    if (!accessKey || k !== accessKey) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      message?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    } | null;
    const message = (body?.message ?? "").trim().slice(0, 2000);
    if (!message) return NextResponse.json({ error: "empty_message" }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "brain_not_configured" }, { status: 503 });

    const anthropic = new Anthropic({ apiKey });
    const history = (body?.history ?? []).slice(-8).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content ?? "").slice(0, 1200),
    }));
    const messages: Anthropic.MessageParam[] = [...history, { role: "user", content: message }];

    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages,
      output_config: { effort: "low" },
    });

    const text = res.content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("");
    return NextResponse.json(parseResult(text));
  } catch (err) {
    console.error("[klinik-demo/chat] error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    const speech = /credit/i.test(msg)
      ? "Hjärnan är slut på krediter — kontakta Jack."
      : "Tappade signalen ett ögonblick — säg om.";
    return NextResponse.json({ speech, panels: [], clear: false, rings: false, power: null, demo: null, theme: null, demoChat: false, pitch: false });
  }
}
