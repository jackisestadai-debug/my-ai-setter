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

  return NextResponse.json({
    ELEVENLABS_API_KEY_present: !!elevenKey,
    ELEVENLABS_API_KEY_length: elevenKey?.length ?? 0,
    ELEVENLABS_API_KEY_prefix: elevenKey?.slice(0, 5) ?? null,
    matching_env_keys: allKeys,
    NODE_ENV: process.env.NODE_ENV,
    elevenlabs_voices_status: voicesStatus,
    elevenlabs_voices_body: voicesBody,
  });
}
