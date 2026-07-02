import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { todos, ideas, k, context } = await req.json() as { todos: string[]; ideas: string[]; k: string; context?: string };
    if (k !== process.env.HQ_ACCESS_KEY) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "no api key" }, { status: 500 });

    const todoList = todos.length ? todos.map((t, i) => `${i + 1}. ${t}`).join("\n") : "Tom";
    const ideaList = ideas.length ? ideas.map((t, i) => `${i + 1}. ${t}`).join("\n") : "Tom";

    const anthropic = new Anthropic({ apiKey });
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `Du är Aura, Jacks personliga AI-assistent på Rekvo. Du känner Jacks affär väl: han säljer AI Instagram DM-setters till svenska skönhetskliniker och salonger. Systemet bokar möten automatiskt via Instagram DM. Jack är ensam säljare just nu och bygger sin första kundbas. Viktigaste målet: få igång AI-settern och boka in de första betalande kunderna. Ge konkreta, ärliga råd på svenska. Inga tankstreck. Max 6 meningar.`,
      messages: [{
        role: "user",
        content: `Att göra (ej klart):\n${todoList}\n\nIdéer:\n${ideaList}${context ? `\n\nExtra kontext från Jack:\n${context}` : ""}\n\nVad är viktigast att fokusera på nu? Vad tycker du om idéerna?`,
      }],
    });

    const text = res.content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("").trim();
    return NextResponse.json({ advice: text });
  } catch (e) {
    console.error("[advise]", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
