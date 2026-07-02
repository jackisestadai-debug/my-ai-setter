import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { todos, ideas, k } = await req.json() as { todos: string[]; ideas: string[]; k: string };
    if (k !== process.env.HQ_ACCESS_KEY) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "no api key" }, { status: 500 });

    const todoList = todos.length ? todos.map((t, i) => `${i + 1}. ${t}`).join("\n") : "Tom";
    const ideaList = ideas.length ? ideas.map((t, i) => `${i + 1}. ${t}`).join("\n") : "Tom";

    const anthropic = new Anthropic({ apiKey });
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `Du är Aura, Jack på Rekvo's personliga AI-assistent. Jack säljer AI Instagram DM-setters till svenska skönhetskliniker. Ge konkreta, korta råd på svenska. Inga tankstreck. Max 5 meningar totalt.`,
      messages: [{
        role: "user",
        content: `Här är min att göra-lista:\n${todoList}\n\nHär är mina idéer:\n${ideaList}\n\nVad tycker du om prioriteringen och idéerna? Vad borde jag fokusera på?`,
      }],
    });

    const text = res.content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("").trim();
    return NextResponse.json({ advice: text });
  } catch (e) {
    console.error("[advise]", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
