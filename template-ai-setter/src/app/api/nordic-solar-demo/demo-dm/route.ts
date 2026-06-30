/**
 * Nordic Solar Demo — live DM-showcase.
 * Powrar DemoDM-panelen i HQ: besökaren skriver som en lead,
 * Nova (nordic-solar-demo AI-receptionist) svarar med sin riktiga system-prompt.
 *
 * POST /api/nordic-solar-demo/demo-dm?k=<key>
 *   body: { history: [{role:"lead"|"setter", content}] }
 *   → { messages: string[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateReply } from "@/lib/brain";
import type { ClientConfig, Message } from "@/lib/prompts/master";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const DEMO_SLUG = "nordic-solar-demo";
const OPENER = "Hej! Välkommen till Nordic Solar ☀️ Vad kan jag hjälpa dig med idag?";

async function getDemoClient() {
  const { data } = await supabase.from("clients").select("*").eq("slug", DEMO_SLUG).maybeSingle();
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const k = req.nextUrl.searchParams.get("k") ?? "";
    const client = await getDemoClient();
    if (!client) return NextResponse.json({ messages: [OPENER] });

    const accessKey = (client as { hq_access_key?: string }).hq_access_key;
    if (!accessKey || k !== accessKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as { history?: Array<{ role: string; content: string }> } | null;
    const hist = (body?.history ?? []).slice(-20);

    if (!hist.length || hist[hist.length - 1].role !== "lead") {
      return NextResponse.json({ messages: [OPENER] });
    }

    const history: Message[] = hist.map((m) => ({
      role: m.role === "setter" ? ("ai" as const) : ("lead" as const),
      content: String(m.content ?? "").slice(0, 600),
      created_at: new Date().toISOString(),
    }));

    const result = await generateReply({ client: client as unknown as ClientConfig, history });
    const bubbles = (result.segments || []).map((s) => s.trim()).filter(Boolean).slice(0, 4);
    return NextResponse.json({ messages: bubbles.length ? bubbles : [result.reply.trim() || OPENER] });
  } catch (err) {
    console.error("[nordic-solar-demo/demo-dm] error:", err);
    return NextResponse.json({ messages: [OPENER] });
  }
}
