import { NextRequest, NextResponse } from "next/server";
import { getAccessKey } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const k = req.nextUrl.searchParams.get("k") ?? "";
  const accessKey = await getAccessKey();
  if (!accessKey || k !== accessKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const allKeys = Object.keys(process.env).filter(
    (k) => k.includes("ELEVEN") || k.includes("eleven")
  );

  let voicesStatus: string | number = "not_tested";
  let voicesBody: unknown = null;
  if (elevenKey) {
    try {
      const res = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": elevenKey },
      });
      voicesStatus = res.status;
      const txt = await res.text();
      try { voicesBody = JSON.parse(txt); } catch { voicesBody = txt.slice(0, 300); }
    } catch (e) {
      voicesStatus = "fetch_error";
      voicesBody = String(e);
    }
  }

  // Test TTS with the first voice found
  let ttsStatus: string | number = "not_tested";
  let ttsError: unknown = null;
  if (elevenKey && voicesStatus === 200) {
    try {
      const voicesData = voicesBody as { voices?: Array<{ voice_id: string }> };
      const firstVoiceId = voicesData?.voices?.[0]?.voice_id;
      if (firstVoiceId) {
        const ttsRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${firstVoiceId}/stream?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: { "xi-api-key": elevenKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
            body: JSON.stringify({ text: "test", model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.4, similarity_boost: 0.75 } }),
          }
        );
        ttsStatus = ttsRes.status;
        if (!ttsRes.ok) ttsError = await ttsRes.text().catch(() => "");
      }
    } catch (e) {
      ttsStatus = "fetch_error";
      ttsError = String(e);
    }
  }

  return NextResponse.json({
    ELEVENLABS_API_KEY_present: !!elevenKey,
    ELEVENLABS_API_KEY_length: elevenKey?.length ?? 0,
    ELEVENLABS_API_KEY_prefix: elevenKey?.slice(0, 5) ?? null,
    NODE_ENV: process.env.NODE_ENV,
    elevenlabs_voices_status: voicesStatus,
    elevenlabs_tts_status: ttsStatus,
    elevenlabs_tts_error: ttsError,
  });
}
