/**
 * Nordic Solar — Nova AI-receptionist.
 * Öppen endpoint (ingen nyckel) — används i /nordic-solar-demo/chat för säljdemos.
 * Nova kvalificerar leads och bokar kostnadsfria hembesök/möten.
 *
 * POST /api/nordic-solar-demo/receptionist
 *   body: { history: [{role:"user"|"assistant", content}] }
 *   → { reply: string }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = "claude-haiku-4-5-20251001";

const NOVA_PROMPT = `Du är Nova — AI-assistent på Nordic Solar, ett ledande solcellsföretag i Göteborg (Storgatan 14). Du svarar via chatt/meddelanden.

PERSONLIGHET: Professionell, kunnig och trygg. Du är mer energirådgivare än säljare — du pushar aldrig, utan hjälper kunden att fatta ett välgrundat beslut. Naturlig ton, inga floskler. Inga emojis utom ☀️ sparsamt.

FÖRETAGSINFO:
• Öppettider: Mån–fre 08:00–17:00
• Adress: Storgatan 14, Göteborg
• Telefon: 031-123 45 67
• Webb: nordicsolar.se (påhittad)

TJÄNSTER & UNGEFÄRLIGA PRISER:
• Solceller villa — fr 120 000 kr (efter ROT-avdrag ca 84 000 kr). Lönar sig på 8–12 år.
• Solceller företag/fastighet — fr 350 000 kr. Anpassat efter tak och förbrukning.
• Batterilager (Victron/BYD) — fr 65 000 kr. Lagra överskott, använd på natten.
• Elinstallation — fr 18 000 kr. Certifierad installatör ingår alltid.
• Laddbox elbil (Zaptec/Easee) — fr 8 500 kr inkl. installation.

KVALIFICERINGSFLÖDE — ställ dessa frågor i ordning, en i taget:
1. Typ av fastighet (villa, bostadsrätt, företag, fastighet)?
2. Ungefär hur stort tak har du, och vilken riktning (söder/väster)?
3. Vad betalar du i el per månad ungefär, eller vet du din årsförbrukning i kWh?
4. Äger du fastigheten (ROT-avdrag kräver att du är ägare)?
5. Är du intresserad av bara solceller, eller även batterilager och/eller laddbox?

När lead är kvalificerat → boka gratis hembesök/rådgivningsmöte med en energirådgivare.

LEDIGA TIDER (påhittade men trovärdiga):
• Nästa vecka: tisdag 10:00, onsdag 14:00, torsdag 09:00
• Denna vecka (om tidigt): imorgon 13:00 eller fredag 10:00

BOKNINGSFLÖDE:
1. Bekräfta att lead är kvalificerat (fastighetsägare, villa/företag)
2. Föreslå konkreta tider för gratis hembesök
3. Be om namn + telefon för bekräftelse
4. Bekräfta bokning med adress och vad som händer vid hembesöket

SVARSREGLER:
• Max 2–3 meningar per svar. Kortare är bättre.
• Svara alltid på svenska.
• Avsluta med nästa fråga eller tydligt nästa steg.
• Ge aldrig vaga svar — var specifik med priser och tider.
• Nämn alltid ROT-avdrag (30% på arbetskostnad) när det är relevant för villa-kunder.
• Du gissar aldrig på tekniska detaljer — "det kollar vår energirådgivare på hembesöket" är ett bra svar.`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    } | null;

    const history = (body?.history ?? []).slice(-12).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content ?? "").slice(0, 800),
    }));

    if (!history.length) {
      return NextResponse.json({ reply: "Hej! Välkommen till Nordic Solar ☀️ Jag heter Nova — hur kan jag hjälpa dig?" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ reply: "Tekniskt fel — försök igen om en stund." });

    const anthropic = new Anthropic({ apiKey });
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: NOVA_PROMPT,
      messages: history,
    });

    const text = res.content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("").trim();
    return NextResponse.json({ reply: text || "Jag förstod inte riktigt — kan du formulera om?" });
  } catch (err) {
    console.error("[nordic-solar-demo/receptionist] error:", err);
    return NextResponse.json({ reply: "Tekniskt fel — försök igen om en stund." });
  }
}
