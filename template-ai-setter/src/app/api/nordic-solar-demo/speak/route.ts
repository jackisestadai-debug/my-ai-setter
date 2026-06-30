/**
 * Nordic Solar Demo — TTS via ElevenLabs.
 * Pass-through till ElevenLabs, validerar mot nordic-solar-demo hq_access_key.
 *
 * POST /api/nordic-solar-demo/speak?k=<key>  body: { text }  → audio/mpeg
 * GET  /api/nordic-solar-demo/speak?k=<key>&text=<text>       → audio/mpeg
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TTS_MODEL = "eleven_turbo_v2_5";
const PREFERRED_VOICE_NAME = "hale";
const DEMO_SLUG = "nordic-solar-demo";

let cachedVoiceId: string | null = null;
let cachedKey: string | null = null;

async function getDemoAccessKey(): Promise<string | null> {
  if (cachedKey) return cachedKey;
  const { data } = await supabase
    .from("clients")
    .select("hq_access_key")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();
  cachedKey = (data as { hq_access_key?: string } | null)?.hq_access_key ?? null;
  return cachedKey;
}

async function resolveVoiceId(apiKey: string): Promise<string | null> {
  if (cachedVoiceId) return cachedVoiceId;
  const envId = process.env.ELEVENLABS_VOICE_ID;
  if (envId) { cachedVoiceId = envId; return cachedVoiceId; }
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": apiKey } });
    if (!res.ok) return null;
    const data = (await res.json()) as { voices?: Array<{ voice_id: string; name: string }> };
    const voices = data.voices ?? [];
    const hale = voices.find((v) => (v.name || "").toLowerCase().includes(PREFERRED_VOICE_NAME));
    cachedVoiceId = (hale ?? voices[0])?.voice_id ?? null;
    return cachedVoiceId;
  } catch { return null; }
}

async function synthesize(req: NextRequest, rawText: string) {
  const k = req.nextUrl.searchParams.get("k") ?? "";
  const accessKey = await getDemoAccessKey();
  if (!accessKey || k !== accessKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "voice_not_configured" }, { status: 503 });

  const text = (rawText || "").trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: "empty_text" }, { status: 400 });

  const voiceId = await resolveVoiceId(apiKey);
  if (!voiceId) return NextResponse.json({ error: "no_voice_available" }, { status: 503 });

  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: TTS_MODEL,
        voice_settings: { stability: 0.75, similarity_boost: 0.85, style: 0.15, speed: 0.88 },
      }),
    }
  );

  if (!ttsRes.ok) return NextResponse.json({ error: "tts_failed" }, { status: 502 });
  return new NextResponse(ttsRes.body, {
    status: 200,
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  return synthesize(req, body?.text ?? "");
}

export async function GET(req: NextRequest) {
  return synthesize(req, req.nextUrl.searchParams.get("text") ?? "");
}
