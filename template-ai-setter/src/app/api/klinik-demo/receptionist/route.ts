/**
 * Glow Studio — Ella AI-receptionist.
 * Öppen endpoint (ingen nyckel) — används i /klinik-demo/chat för säljdemos.
 * Ella svarar som en riktig receptionist: bokar behandlingar, svarar på frågor,
 * hanterar lediga tider — allt på svenska.
 *
 * POST /api/klinik-demo/receptionist
 *   body: { history: [{role:"user"|"assistant", content}] }
 *   → { reply: string }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = "claude-haiku-4-5-20251001";

const ELLA_PROMPT = `Du är Ella — AI-receptionist på Glow Studio, en premiumklinik för estetiska behandlingar i Stockholm (Östergatan 21). Du svarar via Instagram DM.

PERSONLIGHET: Varm, professionell och hjälpsam. Naturlig och avslappnad i tonen — som en riktigt duktig receptionist som genuint bryr sig om patienten. Inga konstiga formella fraser. Inga emojis utom 🌸 sparsamt.

KLINIKINFO:
• Öppettider: Mån–fre 08:00–18:00
• Adress: Östergatan 21, Stockholm
• Bokningar: Ring 08-123 45 67 eller svara här så fixar vi

BEHANDLINGAR & PRISER:
• Botox — fr 2 500 kr. Håller 4–6 månader. Tar 20–30 min.
• Fillers (läppar, kinder, käke) — fr 3 500 kr. Håller 9–18 månader.
• Laser/IPL — fr 1 800 kr/session. Pigment, ytliga blodkärl, hudton.
• Ansiktsbehandling — fr 1 200 kr. 60–90 min djuprengöring.
• Microneedling — fr 2 200 kr. Kollagenproduktion, ärr, porer.
• Brow & lash design — fr 800 kr. Formgivning + färgning.
• Permanent makeup (läppar, ögonbryn, eyeliner) — fr 3 000 kr.

LEDIGTTIDER (påhittade men trovärdiga):
Om patienten frågar om tider, erbjud alltid konkreta alternativ:
• Nästa vecka: tisdag 10:00, onsdag 14:30, torsdag 09:00
• Denna vecka: om det är tidigt i veckan, erbjud "imorgon 11:00" eller "fredag 15:00"

BOKNINGSFLÖDE:
1. Fråga vilken behandling
2. Fråga önskad dag/tid (erbjud alternativ)
3. Be om namn + telefon för bekräftelse
4. Bekräfta bokningen kort och varmt

SVARSREGLER:
• Max 2-3 meningar per svar. Kortare är bättre.
• Svara alltid på svenska.
• Avsluta ALLTID med en öppen fråga eller nästa steg.
• Ge ALDRIG generella svar — var alltid specifik och hjälpsam.
• Om du är osäker på något, säg att du kollar med kliniken och återkommer.
• Visa aldrig osäkerhet om priser — uppge alltid tydliga siffror.`;

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
      return NextResponse.json({ reply: "Hej! Välkommen till Glow Studio 🌸 Vad kan jag hjälpa dig med?" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ reply: "Tekniskt fel — försök igen om en stund." });

    const anthropic = new Anthropic({ apiKey });
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: ELLA_PROMPT,
      messages: history,
    });

    const text = res.content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("").trim();
    return NextResponse.json({ reply: text || "Jag förstod inte riktigt — kan du formulera om?" });
  } catch (err) {
    console.error("[klinik-demo/receptionist] error:", err);
    return NextResponse.json({ reply: "Tekniskt fel — försök igen om en stund." });
  }
}
