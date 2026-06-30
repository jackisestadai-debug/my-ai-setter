/**
 * Nordic Solar Demo HQ — chat brain.
 *
 * Nova svarar på svenska om Nordic Solars affär. Demo-mode:
 * trovärdiga men påhittade siffror, inga riktiga DB-actions.
 * Autentisering mot clients.hq_access_key (slug='nordic-solar-demo').
 *
 * POST /api/nordic-solar-demo/chat?k=<key>
 *   body: { message, history, demo? }
 *   → { speech, panels, clear, rings, power, demo, theme, demoChat, pitch }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const MODEL = "claude-sonnet-4-6";
const DEMO_SLUG = "nordic-solar-demo";

async function getDemoAccessKey(): Promise<string | null> {
  const { data } = await supabase
    .from("clients")
    .select("hq_access_key")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();
  return (data as { hq_access_key?: string } | null)?.hq_access_key ?? null;
}

const SYSTEM_PROMPT = `Du är Nova — Nordic Solars AI-assistent, inbyggd i företagets HQ. Du pratar alltid på svenska. Du är professionell, kunnig och trygg — mer som en energirådgivare än en säljare.

Nordic Solar installerar solceller, batterilager, elinstallationer och laddboxar för elbil. Storgatan 14, Göteborg. Öppet mån–fre 08–17.
Tjänster: Solceller villor (fr 120 000 kr), Solceller företag/fastighet (fr 350 000 kr), Batterilager (fr 65 000 kr), Elinstallation (fr 18 000 kr), Laddbox elbil (fr 8 500 kr).

OUTPUT: exactly one JSON object {"speech":"...","panels":[...],"clear":false,"rings":false,"power":null,"demo":null,"theme":null,"demoChat":false,"pitch":false} — no prose, no code fences.

speech = vad du säger HÖGT. ALLTID 1-2 korta meningar, talat naturligt, ingen markdown. Svaret FÖRST. Detaljer i paneler.

rings = true när konversationen handlar om siffror, omsättning, leads eller hur verksamheten mår.

[DEMO-SIFFROR — använd alltid dessa, variera lite naturligt]
• Leads senaste 30d: 284
• Svar: 198 (70% svarsfrekvens)
• Kvalificerade: 112 (57%)
• Bokade möten: 67 (34% av leads)
• Signerade avtal: 41
• Omsättning 30d: 2 340 000 kr
• AI-bokade möten: 78%
• Svarstid: 45 sekunder
• Säljcykel median: 8 dagar
• Mix: ~70% B2C (villa), ~30% B2B (företag/fastighet)
• Snitt B2C avtal: 285 000 kr
• Snitt B2B avtal: 680 000 kr

[VARMA LEADS (om frågad)]
Välj bland: Erik Johansson (villa solceller + batteri), Petra Lindqvist (företag 200 kvm tak), Magnus Holm (laddbox + solceller), BRF Solhem (fastighet 18 lgh), Anderssons Bygg AB (industritak), Camilla Svensson (villa + EV-laddbox)

[SENASTE BOKNINGAR (om frågad)]
Välj bland: Lars Pettersson – hembesök imorse (villa Mölndal), Fastighets AB Väst – möte igår (kommersell tak), Anna Bergström – hembesök (villa Kungsbacka, förra veckan), Teknik & Bygg AB – offert signerad (förra veckan)

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
• {"kind":"metric","title":"OMSÄTTNING · 30D","value":"2 340 000 kr","sub":"41 signerade avtal","accent":true}
• {"kind":"funnel","title":"LEAD-FUNNEL","rows":[{"label":"Leads","value":284},{"label":"Kvalificerade","value":112},{"label":"Bokade möten","value":67},{"label":"Signerade","value":41}]}
• {"kind":"bars","title":"TJÄNSTER","rows":[{"label":"Solceller villa","value":52},{"label":"Solceller företag","value":21},{"label":"Batterilager","value":16},{"label":"Laddbox","value":11}]}
• {"kind":"stats","title":"PRESTANDA","items":[{"label":"AI-bokade möten","value":"78%"},{"label":"Svarsfrekvens","value":"70%"},{"label":"Svarstid","value":"45 sek"}]}
• {"kind":"list","title":"VARMA LEADS","rows":[{"primary":"Erik Johansson","secondary":"villa solceller","tertiary":"svarade idag"},{"primary":"BRF Solhem","secondary":"fastighet 18 lgh","tertiary":"3 kontakter"}]}
• {"kind":"draft","title":"UTKAST → LEAD","value":"meddelande...","sub":"säg 'skicka det' för att bekräfta"}

"clear": true — sudda skärmen (topic-byte eller "rensa skärmen").

Pengaformat: "2 340 000 kr". Procent: "70 %". Tala alltid svenska — kort, tydligt och tryggt. Du är rådgivare, inte säljare.`;

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
    console.error("[nordic-solar-demo/chat] error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    const speech = /credit/i.test(msg)
      ? "Hjärnan är slut på krediter — kontakta Jack."
      : "Tappade signalen ett ögonblick — säg om.";
    return NextResponse.json({ speech, panels: [], clear: false, rings: false, power: null, demo: null, theme: null, demoChat: false, pitch: false });
  }
}
