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
    const result = await zai.images.generations.create({
      model: getDefaultImageModel(),
      prompt,
      size: size as any,
    });

    const url = (result as any)?.data?.[0]?.url ?? "";
    if (!url) {
      return NextResponse.json({ error: "No image returned" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
