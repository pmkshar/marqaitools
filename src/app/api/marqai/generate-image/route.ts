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

    // Build the request body. The `model` field is OPTIONAL in the Z.AI SDK
    // (per the type signature and the official README example). Different
    // Z.AI plans expose different image models — cogview-3-flash,
    // cogview-4-flash, cogview-4 etc. — and not all are available on every
    // account. If ZAI_IMAGE_MODEL env var is set, honor it; otherwise OMIT
    // the model field entirely and let Z.AI pick the account's default.
    // Passing an unavailable model name returns code 1211 "Unknown Model".
    const imageModel = getDefaultImageModel();
    const requestBody: any = { prompt, size: size as any };
    if (imageModel) {
      requestBody.model = imageModel;
    }

    const result: any = await zai.images.generations.create(requestBody);

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
