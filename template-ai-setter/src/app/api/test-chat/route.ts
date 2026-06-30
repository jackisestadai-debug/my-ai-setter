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
    undefined
  );

  const systemPrompt = [stable, volatile].filter(Boolean).join("\n\n");

  // Build conversation history for Claude (lead = user, ai = assistant)
  const messages: Anthropic.MessageParam[] = [];

  // Add Jack's opener as first assistant message
  messages.push({
    role: "assistant",
    content: "Hej, har ni några lediga tider nångån kommande 1-2 veckor?",
  });

  // history already includes the new message at the end (page.tsx appends
  // before calling the API), so just map it — no need to add message again.
  for (const m of history) {
    if (m.role === "lead" || m.role === "user") {
      messages.push({ role: "user", content: m.content });
    } else if (m.role === "ai" || m.role === "assistant") {
      messages.push({ role: "assistant", content: m.content });
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

  // Take first bubble only (ignore [[SPLIT]] in test chat for simplicity)
  const reply = raw.split("[[SPLIT]]")[0].trim();

  return NextResponse.json({ reply });
}
