import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultImageModel } from "@/lib/zai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface GenerateImageBody {
  prompt: string;
  size?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, size = "1024x1024" } = (await req.json()) as GenerateImageBody;
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const zai = await getZai();
    const result: any = await zai.images.generations.create({
      model: getDefaultImageModel(),
      prompt,
      size: size as any,
    });

    // The Z.AI SDK downloads the generated image and returns it as base64
    // (NOT a URL). Read .base64 first; fall back to .url only if the SDK
    // behavior changes in a future version.
    const item = result?.data?.[0];
    const base64 = item?.base64;
    const url = item?.url;

    if (base64) {
      // Return as a data URL so the <img src=...> works directly in the browser
      // without an extra round-trip to a remote URL.
      const dataUrl = `data:image/png;base64,${base64}`;
      return NextResponse.json({ ok: true, url: dataUrl, base64, format: "png" });
    }

    if (url) {
      return NextResponse.json({ ok: true, url });
    }

    return NextResponse.json(
      { error: "No image returned by Z.AI. The model may be unavailable on your plan." },
      { status: 502 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
