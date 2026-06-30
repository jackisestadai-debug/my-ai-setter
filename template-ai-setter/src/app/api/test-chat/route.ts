/**
 * Test-chat endpoint — lets Jack play as a clinic while the real Rekvo AI
 * responds as himself. Uses the exact same engine and prompt as production.
 * POST { message, history, sessionId, k }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getClientByKey } from "@/lib/supabase";
import { buildSystemBlocks } from "@/lib/prompts/master";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const anthropic = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    message?: string;
    history?: Array<{ role: string; content: string }>;
    sessionId?: string;
    k?: string;
  };

  const { message, history = [], k } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const client = k ? await getClientByKey(k) : null;
  if (!client) {
    return NextResponse.json({ error: "client not found" }, { status: 403 });
  }

  const { stable, volatile } = buildSystemBlocks(
    {
      name: client.name,
      slug: client.slug,
      system_prompt: client.system_prompt,
      voice_samples: client.voice_samples,
      active_rules: client.active_rules,
      business_context: client.business_context,
      timezone: client.timezone ?? "Europe/Stockholm",
    },
    undefined,
    undefined,
    "TESTLÄGE: Fullfölja hela din tanke i varje svar. Använd inte cliffhangers eller ofullständiga meningar som slutar med '...' — säg allt du vill säga i ett sammanhängande svar."
  );

  const systemPrompt = [stable, volatile].filter(Boolean).join("\n\n");

  // Build conversation history for Claude (lead = user, ai = assistant)
  const messages: Anthropic.MessageParam[] = [];

  // Add Jack's opener as first assistant message
  messages.push({
    role: "assistant",
    content: "Hej, har ni några lediga tider nångån kommande 1-2 veckor?",
  });

  // Build history — merge consecutive ai messages (from [[SPLIT]] bubbles) into
  // one assistant turn so Claude API gets valid alternating user/assistant turns.
  for (const m of history) {
    const role = (m.role === "lead" || m.role === "user") ? "user" : "assistant";
    const last = messages[messages.length - 1];
    if (last && last.role === role) {
      // Merge consecutive same-role messages
      last.content = (last.content as string) + "\n\n" + m.content;
    } else {
      messages.push({ role, content: m.content });
    }
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: systemPrompt,
    messages,
  });

  const raw = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const bubbles = raw.split("[[SPLIT]]").map((s) => s.trim()).filter(Boolean);

  return NextResponse.json({ reply: bubbles[0], bubbles });
}
