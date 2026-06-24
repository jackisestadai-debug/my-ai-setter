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

  return NextResponse.json({
    ELEVENLABS_API_KEY_present: !!elevenKey,
    ELEVENLABS_API_KEY_length: elevenKey?.length ?? 0,
    ELEVENLABS_API_KEY_prefix: elevenKey?.slice(0, 5) ?? null,
    matching_env_keys: allKeys,
    NODE_ENV: process.env.NODE_ENV,
  });
}
